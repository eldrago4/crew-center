// Data layer for the pilot-profile pages (src/app/(main)/team, src/app/(crew)/crew/team).
//
// One Redis key per pilot — `profile:{callsign}` — holds the entire rendered-page
// payload (identity, edits, pireps aggregates, trail progress, career panel). A
// normal page render is a single Redis GET with no Neon/Firestore round trip.
// When the object is stale (>24h) it's still served immediately (still within
// tolerance) while a rebuild runs in the background via next/server's `after()`.
// A short SETNX lock keeps concurrent viewers of the same stale/missing profile
// from each kicking off their own Neon+Firestore rebuild.

import { Redis } from '@upstash/redis'
import { after } from 'next/server'
import { sql, eq, and, gt } from 'drizzle-orm'
import db from '@/db/client'
import { users, pireps } from '@/db/schema'
import { db as fireDb } from '@/lib/firebase'
import { TRAIL_META, TRAIL_MULTIPLIER, matchTrailCode } from '@/app/shared/trails'
import airportCities from '@/data/airport-cities.json'

const FRESH_MS = 24 * 60 * 60 * 1000 // "up to a day is fine"
const LOCK_TTL_SECONDS = 10

let _redis = null
function getRedis() {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return _redis
}

function profileKey(callsign) {
  return `profile:${callsign}`
}
function lockKey(callsign) {
  return `profile:${callsign}:lock`
}

// ── Operator bucketing for "Where the hours went" ──────────────────────────────
// INVA's 3 sub-brands + everything else (real-world codeshare partners flown on
// INVA). Simpler/coarser than the full per-flight CODESHARE_EMOJI_FILES map in
// users/pireps/route.js, which exists for a different purpose (thumbnail lookup).
const OPERATOR_PREFIXES = [
  ['airIndia', ['AI', 'AIC', 'AIH']],
  ['airIndiaExpress', ['IX', 'AIX', 'AXB', 'IXH']],
  ['vistara', ['UK', 'UKH']],
]

function bucketOperator(flightNumber) {
  const fn = String(flightNumber || '').toUpperCase().replace(/[\s-]/g, '')
  for (const [bucket, prefixes] of OPERATOR_PREFIXES) {
    if (prefixes.some((p) => fn.startsWith(p))) return bucket
  }
  return 'other'
}

// ICAO -> "City|State|Country" (src/data/airport-cities.json) — already has
// everything "countries" needs, no lat/lon required.
function countryForIcao(icao) {
  const entry = airportCities[icao]
  if (!entry) return null
  const parts = entry.split('|')
  return parts[parts.length - 1] || null
}

function hoursFromInterval(interval) {
  if (!interval) return 0
  const [h, m, s] = String(interval).split(':').map(Number)
  return (h || 0) + (m || 0) / 60 + (s || 0) / 3600
}

// ── Neon: identity + rank position ──────────────────────────────────────────────

async function fetchIdentity(callsign) {
  const rows = await db
    .select({
      ifcName: users.ifcName,
      discordId: users.discordId,
      rank: users.rank,
      careerMode: users.careerMode,
      badges: users.badges,
      lastActive: users.lastActive,
      flightTime: users.flightTime,
      rankPosition: sql`(
        SELECT COUNT(*) + 1 FROM users u2
        WHERE u2."flightTime" > users."flightTime"
           OR (u2."flightTime" = users."flightTime" AND u2."id" < users."id")
      )`.as('rankPosition'),
    })
    .from(users)
    .where(eq(users.id, callsign))
    .limit(1)

  if (!rows.length) return null
  const row = rows[0]
  return {
    ifcName: row.ifcName,
    discordId: row.discordId ? String(row.discordId) : null,
    rank: row.rank,
    careerMode: !!row.careerMode,
    badges: Array.isArray(row.badges) ? row.badges : [],
    lastActive: row.lastActive,
    flightTime: row.flightTime,
    hours: hoursFromInterval(row.flightTime),
    rankPosition: Number(row.rankPosition),
  }
}

// ── Neon: pireps aggregate (hard-miss full scan, or delta merge) ────────────────

function emptyAgg() {
  return {
    airportsVisited: [],
    countries: [],
    uniqueRoutes: [],
    approvedCount: 0,
    longestFlight: null, // { flightNumber, departureIcao, arrivalIcao, hours }
    eventsFlown: 0,
    joinedDate: null,
    operatorHours: { airIndia: 0, airIndiaExpress: 0, vistara: 0, other: 0 },
  }
}

async function fetchApprovedPireps(callsign, since) {
  const conditions = [eq(pireps.userId, callsign), eq(pireps.valid, true)]
  if (since) conditions.push(gt(pireps.updatedAt, since))
  return db
    .select({
      flightNumber: pireps.flightNumber,
      date: pireps.date,
      flightTime: pireps.flightTime,
      departureIcao: pireps.departureIcao,
      arrivalIcao: pireps.arrivalIcao,
      multiplier: pireps.multiplier,
      comments: pireps.comments,
      updatedAt: pireps.updatedAt,
    })
    .from(pireps)
    .where(and(...conditions))
}

function mergePirepsIntoAgg(agg, rows) {
  const airports = new Set(agg.airportsVisited)
  const countries = new Set(agg.countries)
  const routes = new Set(agg.uniqueRoutes)
  let longest = agg.longestFlight
  let lastUpdatedAt = null

  for (const row of rows) {
    airports.add(row.departureIcao)
    airports.add(row.arrivalIcao)
    const depCountry = countryForIcao(row.departureIcao)
    const arrCountry = countryForIcao(row.arrivalIcao)
    if (depCountry) countries.add(depCountry)
    if (arrCountry) countries.add(arrCountry)
    routes.add(`${row.departureIcao}-${row.arrivalIcao}`)
    agg.approvedCount += 1

    const hrs = hoursFromInterval(row.flightTime)
    if (!longest || hrs > longest.hours) {
      longest = { flightNumber: row.flightNumber, departureIcao: row.departureIcao, arrivalIcao: row.arrivalIcao, hours: hrs }
    }

    const isEvent = Number(row.multiplier) > 3 || !!matchTrailCode(row.comments)
    if (isEvent) agg.eventsFlown += 1

    const bucket = bucketOperator(row.flightNumber)
    agg.operatorHours[bucket] = (agg.operatorHours[bucket] || 0) + hrs

    if (!lastUpdatedAt || (row.updatedAt && row.updatedAt > lastUpdatedAt)) lastUpdatedAt = row.updatedAt
  }

  agg.airportsVisited = Array.from(airports)
  agg.countries = Array.from(countries)
  agg.uniqueRoutes = Array.from(routes)
  agg.longestFlight = longest
  return lastUpdatedAt
}

// ── Redis: trails progress, pipelined ────────────────────────────────────────────

async function fetchTrailsProgress(callsign) {
  const redis = getRedis()
  const slugs = Object.keys(TRAIL_META)
  const pipeline = redis.pipeline()
  for (const slug of slugs) pipeline.scard(`trail:${slug}:${callsign}`)
  const counts = await pipeline.exec()
  const trails = {}
  slugs.forEach((slug, i) => {
    trails[slug] = Math.min(Number(counts[i]) || 0, TRAIL_META[slug].legs)
  })
  return trails
}

// ── Neon: logbook (last 3 approved pireps — top-N, not incrementally merged) ────

async function fetchLogbook(callsign) {
  return db
    .select({
      flightNumber: pireps.flightNumber,
      date: pireps.date,
      flightTime: pireps.flightTime,
      departureIcao: pireps.departureIcao,
      arrivalIcao: pireps.arrivalIcao,
      aircraft: pireps.aircraft,
    })
    .from(pireps)
    .where(and(eq(pireps.userId, callsign), eq(pireps.valid, true)))
    .orderBy(sql`${pireps.updatedAt} DESC`)
    .limit(3)
}

// ── Firestore: career panel ──────────────────────────────────────────────────────

async function fetchCareer(callsign) {
  try {
    const snapshot = await fireDb.collection('users').where('callsign', '==', callsign).limit(1).get()
    if (snapshot.empty) return null
    const data = snapshot.docs[0].data()
    return {
      flightHours: data.flightHours ?? 0,
      rank: data.rank ?? null,
      homeBase: data.currentLocation ?? data.homeBase ?? null,
      typeRatings: Array.isArray(data.typeRatings) ? data.typeRatings : [],
      totalFlights: data.totalFlights ?? 0,
      careerEarnings: data.careerEarnings ?? 0,
    }
  } catch (err) {
    console.error('Career panel fetch failed (non-fatal):', err)
    return null
  }
}

// ── Rebuild ───────────────────────────────────────────────────────────────────

async function rebuildProfile(callsign, previous) {
  const redis = getRedis()
  const lock = lockKey(callsign)
  const gotLock = await redis.set(lock, '1', { nx: true, ex: LOCK_TTL_SECONDS })
  if (!gotLock) return previous // someone else is already rebuilding

  try {
    const identity = await fetchIdentity(callsign)
    if (!identity) return null

    const since = previous?.lastPirepUpdatedAt ? new Date(previous.lastPirepUpdatedAt) : null
    const agg = previous?.agg ? { ...previous.agg, operatorHours: { ...previous.agg.operatorHours } } : emptyAgg()
    const rows = await fetchApprovedPireps(callsign, since)
    const lastRowUpdatedAt = mergePirepsIntoAgg(agg, rows)

    if (!previous) {
      const joined = await db
        .select({ date: sql`MIN(${pireps.date})`.as('date') })
        .from(pireps)
        .where(and(eq(pireps.userId, callsign), eq(pireps.valid, true)))
      agg.joinedDate = joined?.[0]?.date ?? null
    }

    const [trails, career, logbook] = await Promise.all([
      fetchTrailsProgress(callsign),
      identity.careerMode ? fetchCareer(callsign) : Promise.resolve(null),
      fetchLogbook(callsign),
    ])

    const next = {
      computedAt: Date.now(),
      lastPirepUpdatedAt: lastRowUpdatedAt
        ? new Date(lastRowUpdatedAt).toISOString()
        : previous?.lastPirepUpdatedAt ?? null,
      identity,
      edits: previous?.edits ?? {},
      agg,
      trails,
      career,
      logbook,
    }

    await redis.set(profileKey(callsign), JSON.stringify(next))
    return next
  } finally {
    await redis.del(lock).catch(() => {})
  }
}

// ── Public entrypoint ────────────────────────────────────────────────────────────

export async function getProfileData(callsign) {
  const redis = getRedis()
  const raw = await redis.get(profileKey(callsign))
  const cached = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null

  if (cached && Date.now() - cached.computedAt < FRESH_MS) {
    return cached
  }

  if (cached) {
    // Stale but present: serve it now, refresh off the request path.
    after(() => rebuildProfile(callsign, cached).catch((e) => console.error('Profile rebuild failed:', e)))
    return cached
  }

  // Hard miss: nothing to serve yet, must rebuild inline.
  return rebuildProfile(callsign, null)
}

// Used by PATCH /api/users/profile — merges only the `edits` sub-object into the
// cached profile object and writes it straight back, so a display-name/bio/aircraft
// change is visible on the very next render without touching computedAt/agg/trails.
export async function updateProfileEdits(callsign, patch) {
  const current = (await getProfileData(callsign)) || (await rebuildProfile(callsign, null))
  if (!current) return null

  const next = { ...current, edits: { ...current.edits, ...patch } }
  await getRedis().set(profileKey(callsign), JSON.stringify(next))
  return next.edits
}

export { TRAIL_MULTIPLIER, TRAIL_META }
