import 'dotenv/config'
import admin from 'firebase-admin'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { pgTable, char, varchar, bigint, interval, text, boolean, jsonb } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import fs from 'node:fs'
import path from 'node:path'

const required = ['DATABASE_URL']

for (const key of required) {
    if (!process.env[key]) {
        console.error(`Missing env var: ${key}`)
        process.exit(1)
    }
}

// Load inva-career-mode service account JSON.
// If FIREBASE_SERVICE_ACCOUNT_JSON is set, use it instead.
function loadServiceAccount() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON && process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim()) {
        return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    }

    const jsonPath = path.resolve(
        process.cwd(),
        'inva-career-mode-firebase-adminsdk-fbsvc-b64515f527.json'
    )
    const raw = fs.readFileSync(jsonPath, 'utf8')
    return JSON.parse(raw)
}

const firebaseServiceAccount = loadServiceAccount()

const users = pgTable('users', {
    id: char({ length: 7 }).primaryKey().notNull(),
    ifcName: varchar({ length: 20 }).notNull(),
    discordId: bigint({ mode: 'bigint' }),
    flightTime: interval({ precision: 0 }),
})

const pireps = pgTable('pireps', {
    pirepId: text().primaryKey(),
    flightNumber: text().notNull(),
    date: text().notNull(),
    flightTime: text().notNull(),
    departureIcao: text().notNull(),
    arrivalIcao: text().notNull(),
    operator: text().default('Indian Virtual').notNull(),
    aircraft: text().notNull(),
    multiplier: text(),
    comments: text(),
    userId: text().notNull(),
    valid: boolean(),
    updatedAt: text(),
    adminComments: text(),
})

const crewcenter = pgTable('crewcenter', {
    module: text().primaryKey().notNull(),
    value: jsonb(),
})

const neonSql = neon(process.env.DATABASE_URL)
const db = drizzle(neonSql, { schema: { users, pireps, crewcenter } })

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(firebaseServiceAccount),
    })
}

const fireDb = admin.firestore()

async function queryBadge1() {
    const result = await db.execute(sql`
    SELECT DISTINCT u."ifcName"
    FROM users u
    JOIN pireps p ON u.id = p."userId"
    WHERE p."flightNumber" LIKE 'AIH%'
      AND p.valid = true
    GROUP BY u.id, u."ifcName"
    HAVING COUNT(*) > 15
  `)

    return Array.isArray(result.rows) ? result.rows.map((row) => row.ifcName).filter(Boolean) : []
}

async function queryBadge2() {
    const result = await db.execute(sql`
    SELECT u."ifcName"
    FROM users u
    WHERE u.id IN (
      SELECT p."userId"
      FROM pireps p
      WHERE p."flightNumber" LIKE 'IX%'
      GROUP BY p."userId"
      HAVING COUNT(*) >= 20
    )
  `)

    return Array.isArray(result.rows) ? result.rows.map((row) => row.ifcName).filter(Boolean) : []
}

async function queryBadge3() {
    const rows = []
    const snapshot = await fireDb.collection('users').where('flightHours', '>=', 40).get()

    snapshot.forEach((doc) => {
        const data = doc.data()
        if (data?.name) rows.push(data.name)
    })

    return rows
}

async function queryBadge4() {
    const rows = []
    const rankCandidates = new Set()
    const excludedRanks = new Set(['Cadet', 'Junior First Officer', 'Trainee', 'Junior Pilot'])

    const snapshot = await fireDb.collection('users').get()

    snapshot.forEach((doc) => {
        const data = doc.data()
        if (!data) return
        const rank = String(data.rank || '').trim()
        if (!rank) return

        rankCandidates.add(rank)

        if (!excludedRanks.has(rank)) {
            if (data.name) rows.push(data.name)
        }
    })

    console.log('Detected career-mode rank values:', Array.from(rankCandidates).sort())
    return rows
}

async function writeBadges(badgeData) {
    await db
        .insert(crewcenter)
        .values({ module: 'badges', value: badgeData })
        .onConflictDoUpdate({
            target: crewcenter.module,
            set: { value: badgeData },
        })
}

async function main() {
    console.log('Querying Neon DB and Firestore for badge members...')

    const [badge1, badge2, badge3, badge4] = await Promise.all([
        queryBadge1(),
        queryBadge2(),
        queryBadge3(),
        queryBadge4(),
    ])

    const badgePayload = { badge1, badge2, badge3, badge4 }

    console.log('Badge counts:')
    console.log(`  badge1: ${badge1.length}`)
    console.log(`  badge2: ${badge2.length}`)
    console.log(`  badge3: ${badge3.length}`)
    console.log(`  badge4: ${badge4.length}`)

    await writeBadges(badgePayload)
    console.log('Saved badge membership to crewcenter module "badges".')
}

main().catch((error) => {
    console.error('Filling badges failed:', error)
    process.exit(1)
})

