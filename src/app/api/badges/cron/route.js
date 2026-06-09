import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import db from '@/db/client'
import { db as fireDb } from '@/lib/firebase'

// firebase-admin (Firestore) requires the Node.js runtime, not Edge.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Scans the whole career-mode users collection; allow headroom.
// (Hobby caps at 60s; raise to 300 on Pro if the collection grows large.)
export const maxDuration = 60

// users.badges is jsonb[] of indexes:
//   0 => badge1 (AIH Ace)      1 => badge2 (IX Veteran)
//   2 => badge3 (Career Power) 3 => badge4 (Senior Pilot)
//   4 => badge5 (Lotus Privé)  — derived live from Lotus status, NOT set here.

// ── Auth ────────────────────────────────────────────────────
// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is
// configured. We only enforce the check when the secret exists, so the route
// stays callable in environments where it isn't set.
function isAuthorized(request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const header = request.headers.get('authorization') || ''
  return header === `Bearer ${secret}`
}

// ── Badge queries ───────────────────────────────────────────
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
  const excludedRanks = new Set(['Cadet', 'Junior First Officer', 'Trainee', 'Junior Pilot'])
  const snapshot = await fireDb.collection('users').get()
  snapshot.forEach((doc) => {
    const data = doc.data()
    if (!data) return
    const rank = String(data.rank || '').trim()
    if (!rank) return
    if (!excludedRanks.has(rank) && data.name) rows.push(data.name)
  })
  return rows
}

// ── Index mapping ───────────────────────────────────────────
function normalizeBadgeIndexes(badgePayload) {
  // -> Map<ifcNameLower, number[]>
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
  // badge5 (index 4 / Lotus) intentionally left out — derived from Lotus status.

  return map
}

// ── Write ───────────────────────────────────────────────────
async function updateUsersBadges(badgeIndexesByIfcLower) {
  // Per-user raw UPDATE. Bulk UPDATE ... FROM (VALUES ...) was unreliable with
  // Neon/drizzle jsonb[] type inference, so we chunk individual updates.
  // Raw SQL also sidesteps the missing `badges` column in the Drizzle schema.
  const entries = Array.from(badgeIndexesByIfcLower.entries())
  const CHUNK = 100
  let updated = 0

  for (let i = 0; i < entries.length; i += CHUNK) {
    const chunk = entries.slice(i, i + CHUNK)
    await Promise.all(
      chunk.map(async ([ifcLower, badgesArr]) => {
        await db.execute(sql`
          UPDATE "users"
          SET badges = ${'{' + badgesArr.map((n) => JSON.stringify(n)).join(',') + '}'}::jsonb[]
          WHERE lower("ifcName") = ${ifcLower};
        `)
        updated += 1
      })
    )
  }

  return updated
}

// ── GET /api/badges/cron  (monthly Vercel Cron) ─────────────
export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [badge1, badge2, badge3, badge4] = await Promise.all([
      queryBadge1(),
      queryBadge2(),
      queryBadge3(),
      queryBadge4(),
    ])

    const badgeIndexesByIfcLower = normalizeBadgeIndexes({ badge1, badge2, badge3, badge4 })
    const usersUpdated = await updateUsersBadges(badgeIndexesByIfcLower)

    const counts = {
      badge1: badge1.length,
      badge2: badge2.length,
      badge3: badge3.length,
      badge4: badge4.length,
    }
    console.log('Monthly badge update complete:', { ...counts, usersUpdated })

    return NextResponse.json({
      success: true,
      message: 'User badges updated successfully',
      counts,
      usersUpdated,
    })
  } catch (error) {
    console.error('Error updating user badges:', error)
    return NextResponse.json({ error: 'Failed to update user badges' }, { status: 500 })
  }
}
