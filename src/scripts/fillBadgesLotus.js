import 'dotenv/config'
import admin from 'firebase-admin'
import fs from 'node:fs'
import path from 'node:path'

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { pgTable, char, varchar, jsonb, text } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

const required = [ 'DATABASE_URL' ]
for (const key of required) {
    if (!process.env[ key ]) {
        console.error(`Missing env var: ${key}`)
        process.exit(1)
    }
}

function loadServiceAccount() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON && process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim()) {
        return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    }

    const jsonPath = path.resolve(
        process.cwd(),
        'inva-career-mode-firebase-adminsdk-fbsvc-b64515f527.json'
    )
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
}

const firebaseServiceAccount = loadServiceAccount()

const crewcenter = pgTable('crewcenter', {
    module: text().primaryKey().notNull(),
    value: jsonb(),
})

const neonSql = neon(process.env.DATABASE_URL)
const db = drizzle(neonSql, { schema: { crewcenter } })

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(firebaseServiceAccount),
    })
}

const fireDb = admin.firestore()

async function queryLotus() {
    // The Lotus Privé membership is stored under Firestore using the data structure used in /api/chanda/_lotus.js
    // There isn't a single explicit identifier here in this repo for "lotus" membership mapping.
    // For now, we use a conservative heuristic:
    // - any user doc with `lotus: { active: true }` or `lotusActive === true` or `tier === 'lotus'`.
    // Adjust this mapping if your Firestore schema differs.

    const rows = []
    const snapshot = await fireDb.collection('users').get()
    snapshot.forEach((doc) => {
        const data = doc.data()
        if (!data) return

        const isLotusActive =
            data?.lotus?.active === true ||
            data?.lotusActive === true ||
            String(data?.tier || '').toLowerCase() === 'lotus' ||
            String(data?.membership || '').toLowerCase().includes('lotus')

        if (isLotusActive && data?.name) rows.push(data.name)
    })

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
    const lotusMembers = await queryLotus()

    // Keep existing badge modules structure used by BasicInfo.jsx
    // (badge1,badge2,badge3,badge4 arrays)
    // Here we only update badge5 while keeping others intact.
    const existing = await db.select().from(crewcenter).where(sql`module = 'badges'`)
    const existingValue = existing?.[ 0 ]?.value || {}

    const updated = {
        ...existingValue,
        badge5: lotusMembers,
    }

    await writeBadges(updated)
    console.log('Saved lotus badge membership under crewcenter module "badges" as badge5.')
    console.log(`badge5 (lotus): ${lotusMembers.length}`)
}

main().catch((err) => {
    console.error('fillBadgesLotus failed:', err)
    process.exit(1)
})

