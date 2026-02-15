import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { pgTable, char, varchar, bigint, interval } from 'drizzle-orm/pg-core'
import { isNotNull, sql } from 'drizzle-orm'
import { pgEnum } from 'drizzle-orm/pg-core'

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL env var is required. Run as:\n  DATABASE_URL="postgres://..." node src/scripts/syncRankRoles.js')
    process.exit(1)
}

const rankenum = pgEnum('rankenum', ['Yuvraj', 'Rajkumar', 'Rajvanshi', 'Rajdhiraj', 'Maharaja', 'Samrat', 'Chhatrapati'])

const users = pgTable('users', {
    id: char({ length: 7 }).primaryKey().notNull(),
    ifcName: varchar({ length: 20 }).notNull(),
    discordId: bigint({ mode: 'bigint' }),
    flightTime: interval({ precision: 0 }),
    rank: rankenum().generatedAlwaysAs(sql`
CASE
    WHEN ("flightTime" >= '2000:00:00'::interval) THEN 'Chhatrapati'::rankenum
    WHEN ("flightTime" >= '1500:00:00'::interval) THEN 'Samrat'::rankenum
    WHEN ("flightTime" >= '900:00:00'::interval) THEN 'Maharaja'::rankenum
    WHEN ("flightTime" >= '450:00:00'::interval) THEN 'Rajdhiraj'::rankenum
    WHEN ("flightTime" >= '160:00:00'::interval) THEN 'Rajvanshi'::rankenum
    WHEN ("flightTime" >= '80:00:00'::interval) THEN 'Rajkumar'::rankenum
    ELSE 'Yuvraj'::rankenum
END`),
})

const neonSql = neon(process.env.DATABASE_URL)
const db = drizzle(neonSql, { schema: { users } })

const BOT_TOKEN = 'Njk4MzA5MDYxMTIwMzYwNTA4.GxFNGi.L00v5B1OulKZzPN9sK_dM2dw5Cn_rVVhYcALwQ'
const GUILD_ID = '1246895842581938276'

const RANK_ROLE_MAP = {
    Yuvraj: '1246900301747716177',
    Rajkumar: '1246900207971471462',
    Rajvanshi: '1247929704791543900',
    Rajdhiraj: '1247929825335967806',
    Maharaja: '1247929948958756874',
    Samrat: '1247930020509515847',
    Chhatrapati: '1273687809861091368',
}

const ROLE_TO_RANK = Object.fromEntries(
    Object.entries(RANK_ROLE_MAP).map(([ rank, roleId ]) => [ roleId, rank ])
)

const ALL_RANK_ROLE_IDS = new Set(Object.values(RANK_ROLE_MAP))

const headers = { Authorization: `Bot ${BOT_TOKEN}` }

async function discord(method, path, body) {
    const opts = { method, headers: { ...headers, 'Content-Type': 'application/json' } }
    if (body) opts.body = JSON.stringify(body)
    const res = await fetch(`https://discord.com/api/v10${path}`, opts)
    if (res.status === 429) {
        const data = await res.json()
        const wait = (data.retry_after || 1) * 1000
        console.log(`  rate limited, waiting ${Math.ceil(wait / 1000)}s...`)
        await new Promise(r => setTimeout(r, wait))
        return discord(method, path, body)
    }
    if (res.status === 204) return null
    return res.json()
}

async function main() {
    console.log('Fetching users with discordId from DB...')
    const allUsers = await db.select({
        id: users.id,
        ifcName: users.ifcName,
        discordId: users.discordId,
        rank: users.rank,
    }).from(users).where(isNotNull(users.discordId))

    console.log(`Found ${allUsers.length} users with discordId\n`)

    let fixed = 0, skipped = 0, notFound = 0, errors = 0

    for (const user of allUsers) {
        const discordId = user.discordId.toString()
        const dbRank = user.rank || 'Yuvraj'
        const expectedRoleId = RANK_ROLE_MAP[ dbRank ]

        // Fetch guild member
        const member = await discord('GET', `/guilds/${GUILD_ID}/members/${discordId}`)

        if (member?.message || member?.code) {
            console.log(`[SKIP] ${user.ifcName} (${user.id}) - not in guild (discord ${discordId})`)
            notFound++
            continue
        }

        const memberRoleIds = member.roles || []
        const currentRankRoles = memberRoleIds.filter(r => ALL_RANK_ROLE_IDS.has(r))
        const hasCorrectRole = currentRankRoles.includes(expectedRoleId)
        const hasOnlyCorrectRole = hasCorrectRole && currentRankRoles.length === 1

        if (hasOnlyCorrectRole) {
            console.log(`[OK]   ${user.ifcName} (${user.id}) - ${dbRank} ✓`)
            skipped++
            continue
        }

        // Remove wrong rank roles
        const rolesToRemove = currentRankRoles.filter(r => r !== expectedRoleId)
        for (const roleId of rolesToRemove) {
            const oldRank = ROLE_TO_RANK[ roleId ] || roleId
            await discord('DELETE', `/guilds/${GUILD_ID}/members/${discordId}/roles/${roleId}`)
            console.log(`  - removed ${oldRank}`)
        }

        // Add correct role if missing
        if (!hasCorrectRole) {
            await discord('PUT', `/guilds/${GUILD_ID}/members/${discordId}/roles/${expectedRoleId}`)
            console.log(`  + added ${dbRank}`)
        }

        const from = rolesToRemove.map(r => ROLE_TO_RANK[ r ] || '?').join(', ') || 'none'
        console.log(`[FIX]  ${user.ifcName} (${user.id}) - ${from} → ${dbRank}`)
        fixed++
    }

    console.log(`\nDone! Fixed: ${fixed} | OK: ${skipped} | Not in guild: ${notFound} | Errors: ${errors}`)
}

main().catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
})
