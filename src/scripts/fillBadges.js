import 'dotenv/config'
import admin from 'firebase-admin'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import {
  pgTable,
  char,
  varchar,
  bigint,
  interval,
  text,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core'
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

// users.badges is jsonb[] where:
// - 0 => badge1 (AIH Ace)
// - 1 => badge2 (IX Veteran)
// - 2 => badge3 (Career Power)
// - 3 => badge4 (Senior Pilot)
// - 4 => badge5 (Lotus Privé)  (this script does NOT derive it; kept as empty)
const users = pgTable('users', {
  id: char({ length: 7 }).primaryKey().notNull(),
  ifcName: varchar({ length: 20 }).notNull(),
  discordId: bigint({ mode: 'bigint' }),
  flightTime: interval({ precision: 0 }),
  // users.badges is jsonb[] (array of jsonb values)
  // We store badge indexes as numbers 0..4.
  badges: jsonb().array(),
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

function normalizeBadgeIndexes(badgePayload) {
  // badgePayload: { badge1: string[], badge2: string[], badge3: string[], badge4: string[] }
  // output: Map<ifcNameLower, number[]> indexes
  const map = new Map()
  const push = (name, idx) => {
    if (!name) return
    const key = String(name).trim().toLowerCase()
    const prev = map.get(key) ?? []
    if (!prev.includes(idx)) prev.push(idx)
    map.set(key, prev)
  }

  for (const n of badgePayload.badge1 ?? []) push(n, 0)
  for (const n of badgePayload.badge2 ?? []) push(n, 1)
  for (const n of badgePayload.badge3 ?? []) push(n, 2)
  for (const n of badgePayload.badge4 ?? []) push(n, 3)

  // Lotus badge5 (index 4) is derived elsewhere.
  // Keep it empty so this script doesn't accidentally grant lotus.
  // If you later want badge5 to be derived here, add it explicitly.

  return map
}

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

async function getExistingBadgeIndexesFromCrewcenter() {
  // In case you still have older badge membership in crewcenter module "badges",
  // we can optionally migrate Lotus badge5 from there later.
  const res = await db
    .select()
    .from(crewcenter)
    .where(sql`module = 'badges'`)

  const value = res?.[0]?.value
  return value && typeof value === 'object' ? value : null
}

async function updateUsersBadges(badgeIndexesByIfcLower) {
  // Reliable approach: update per-user.
  // Bulk UPDATE ... FROM (VALUES ...) was failing with Neon/drizzle type inference
  // around jsonb[] record mapping.
  const entries = Array.from(badgeIndexesByIfcLower.entries())

  const CHUNK = 100
  for (let i = 0; i < entries.length; i += CHUNK) {
    const chunk = entries.slice(i, i + CHUNK)

    await Promise.all(
      chunk.map(async ([ifcLower, badgesArr]) => {
        await db.execute(
          sql`
            UPDATE "users"
            SET badges = ${'{' + badgesArr.map((n) => JSON.stringify(n)).join(',') + '}' }::jsonb[]
            WHERE lower("ifcName") = ${ifcLower};

          `
        )

      })
    )
  }
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

  const badgeIndexesByIfcLower = normalizeBadgeIndexes(badgePayload)

  // If you want to migrate badge5(index 4) from existing crewcenter "badges" payload,
  // you can do it here. Currently we leave it empty to avoid accidentally granting Lotus.
  // const existing = await getExistingBadgeIndexesFromCrewcenter()

  await updateUsersBadges(badgeIndexesByIfcLower)
  console.log('Updated users.badges (jsonb[]) with badge indexes [0..4].')
}

main().catch((error) => {
  console.error('Filling badges failed:', error)
  process.exit(1)
})

