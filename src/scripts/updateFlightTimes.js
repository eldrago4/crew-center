import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import Papa from 'papaparse'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { pgTable, char, varchar, interval } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Load env
if (!process.env.DATABASE_URL) dotenv.config()

// Minimal users table
export const users = pgTable('users', {
    id: char({ length: 7 }).primaryKey().notNull(),
    ifcName: varchar({ length: 20 }),
    flightTime: interval({ precision: 0 }),
})

const neonSql = neon(process.env.DATABASE_URL)
const db = drizzle(neonSql, { schema: { users } })

function parseLeaderboardLines(lines) {
    const pairs = []
    for (let i = 0; i < lines.length; i += 2) {
        const name = (lines[ i ] || '').trim()
        const ft = (lines[ i + 1 ] || '').trim()
        if (!name || !ft) continue
        pairs.push({ name, ft })
    }
    return pairs
}

function ftToInterval(ftRaw) {
    const s = ftRaw.trim()
    if (/^\d+:\d{2}:\d{2}$/.test(s)) {
        const [ h, m, sec ] = s.split(':').map(Number)
        return `${h} hours ${m} minutes ${sec} seconds`
    }
    const m = s.match(/^(\d+):(\d{2})$/)
    if (m) return `${Number(m[ 1 ])} hours ${Number(m[ 2 ])} minutes`
    return s
}

async function updateFlightTimes({ run = false } = {}) {
    const lbPath = path.resolve(process.cwd(), 'src', 'db', 'INVA', 'leaderboard.txt')
    const pilotsPath = path.resolve(process.cwd(), 'src', 'db', 'INVA', 'pilots.csv')

    if (!fs.existsSync(lbPath)) {
        console.error('leaderboard.txt not found')
        process.exit(1)
    }

    const lines = fs.readFileSync(lbPath, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    const pairs = parseLeaderboardLines(lines)
    console.log(`Parsed ${pairs.length} leaderboard entries`)

    // build pilots map username(lowercase) -> callsign and original username
    const pilotMap = new Map()
    if (fs.existsSync(pilotsPath)) {
        const pilotsRaw = fs.readFileSync(pilotsPath, 'utf8')
        const parsed = Papa.parse(pilotsRaw, { header: true, skipEmptyLines: true })
        for (const row of parsed.data) {
            const usernameRaw = ((row[ 'Username' ] || row[ 'username' ] || '') + '').trim()
            const username = usernameRaw.toLowerCase()
            const callsign = ((row[ 'Callsign' ] || row[ 'callSign' ] || '') + '').trim()
            if (username) pilotMap.set(username, { callsign: callsign || null, username: usernameRaw })
        }
    }

    // Prefetch users -> id map
    const allUsers = await db.select().from(users).execute()
    const idMap = new Map()
    for (const u of allUsers) idMap.set(u.id, { id: u.id, ifcName: u.ifcName })

    const updates = []
    const skipped = []

    for (const { name, ft } of pairs) {
        const nameKey = name.toLowerCase()
        const meta = pilotMap.get(nameKey)
        if (!meta || !meta.callsign) {
            skipped.push({ name, ft, reason: 'no username->callsign mapping' })
            continue
        }
        const callsign = meta.callsign
        const byId = idMap.get(callsign)
        if (!byId) {
            skipped.push({ name, ft, reason: `callsign ${callsign} not found in users` })
            continue
        }
        updates.push({ id: byId.id, interval: ftToInterval(ft) })
    }

    console.log(`Prepared ${updates.length} updates, skipped ${skipped.length}`)
    if (skipped.length) {
        const outDir = path.resolve(process.cwd(), 'tmp')
        try { fs.mkdirSync(outDir, { recursive: true }) } catch { }
        fs.writeFileSync(path.join(outDir, 'skipped_flighttime_unmapped.json'), JSON.stringify(skipped, null, 2), 'utf8')
        console.log(`Wrote skipped to tmp/skipped_flighttime_unmapped.json`)
    }

    if (!run) return { prepared: updates.length, skipped }

    const applied = []
    for (const u of updates) {
        try {
            await db.update(users).set({ flightTime: u.interval }).where(sql`${users.id} = ${u.id}`).execute()
            console.log(`Updated ${u.id} -> ${u.interval}`)
            applied.push({ id: u.id, interval: u.interval })
        } catch (err) {
            console.error(`Failed to update ${u.id}:`, err)
        }
    }

    if (applied.length) {
        const outDir = path.resolve(process.cwd(), 'tmp')
        try { fs.mkdirSync(outDir, { recursive: true }) } catch { }
        fs.writeFileSync(path.join(outDir, 'applied_flighttime_updates.json'), JSON.stringify(applied, null, 2), 'utf8')
        console.log(`Wrote applied to tmp/applied_flighttime_updates.json`)
    }

    console.log(`Done. Applied ${applied.length} / ${updates.length}`)
    return { applied: applied.length, skipped }
}

// CLI
if (process.argv[ 1 ] && process.argv[ 1 ].endsWith('updateFlightTimes.js')) {
    const run = process.argv.includes('--run')
    updateFlightTimes({ run }).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
}
