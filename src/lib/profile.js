// Data layer for the pilot-profile pages (src/app/(main)/team, src/app/(crew)/crew/team).
//
// One Redis key per pilot — `profile:{callsign}` — holds the entire rendered-page
// payload (identity, edits, pireps aggregates, trail progress, career panel). A
// normal page render is a single Redis GET with no Neon/Firestore round trip.
// When the object is stale (>24h) it's still served immediately (still within
// tolerance) while a rebuild runs in the background via next/server's `after()`.
// A short SETNX lock keeps concurrent viewers of the same stale/missing profile
// from each kicking off their own Neon+Firestore rebuild.

import { cache } from 'react'
import { Redis } from '@upstash/redis'
import { after } from 'next/server'
import { sql, eq, and, gt } from 'drizzle-orm'
import db from '@/db/client'
import { users, pireps } from '@/db/schema'
import { db as fireDb } from '@/lib/firebase'
import { TRAIL_META, TRAIL_MULTIPLIER, matchTrailCode } from '@/app/shared/trails'
import { operatorIdFor } from '@/data/operators'
import { continentFor } from '@/lib/geo'
import { PASSING_GRADES } from '@/lib/landingQuality'
import { attachFlightTelemetry } from '@/lib/ifFlights'
import airportCities from '@/data/airport-cities.json'
import airportCoords from '@/data/airport-coords.json'

const FRESH_MS = 24 * 60 * 60 * 1000 // "up to a day is fine"
const LOCK_TTL_SECONDS = 10

// Bump when the shape of the cached object changes — a stored object with an older
// version is treated as a hard miss and rebuilt from scratch, so new aggregate
// fields get backfilled instead of staying permanently undefined.
const SCHEMA_VERSION = 5

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

// ICAO -> "City|State|Country" (src/data/airport-cities.json).
function cityCountryForIcao(icao) {
  const entry = airportCities[icao]
  if (!entry) return { city: null, country: null }
  const parts = entry.split('|')
  return { city: parts[0] || null, country: parts[parts.length - 1] || null }
}

function hoursFromInterval(interval) {
  if (!interval) return 0
  const [h, m, s] = String(interval).split(':').map(Number)
  return (h || 0) + (m || 0) / 60 + (s || 0) / 3600
}

function monthKey(date) {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function quarterKey(date) {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`
}

// Unordered city-pair key so a route and its return leg count as the same sector
// (matches the design, where VABB–VOCI is one line worth 22 flights).
function pairKey(a, b) {
  return [a, b].sort().join('-')
}

const MAX_RECENT_EVENTS = 6

// Visits before an airport counts as a base the pilot actually works out of.
const BASE_VISIT_THRESHOLD = 20

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
      totalPilots: sql`(SELECT COUNT(*) FROM users)`.as('totalPilots'),
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
    totalPilots: Number(row.totalPilots),
  }
}

// ── Neon: pireps aggregate (hard-miss full scan, or delta merge) ────────────────

function emptyAgg() {
  return {
    airportCounts: {},      // ICAO -> visits (dep+arr), gives count + home hub
    countries: [],
    uniqueRoutes: [],       // ordered "DEP-ARR"
    routePairs: {},         // unordered "A-B" -> flights, for top routes + map
    fleetHours: {},         // aircraft -> hours
    monthlyHours: {},       // "YYYY-MM" -> hours
    operatorHours: {},      // operator id -> hours
    eventsByQuarter: {},    // "YYYY-Qn" -> count
    recentEvents: [],
    approvedCount: 0,
    longestFlight: null,
    eventsFlown: 0,
    joinedDate: null,
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
      aircraft: pireps.aircraft,
      multiplier: pireps.multiplier,
      comments: pireps.comments,
      updatedAt: pireps.updatedAt,
    })
    .from(pireps)
    .where(and(...conditions))
}

function mergePirepsIntoAgg(agg, rows) {
  const countries = new Set(agg.countries)
  const routes = new Set(agg.uniqueRoutes)
  let longest = agg.longestFlight
  let lastUpdatedAt = null

  for (const row of rows) {
    const dep = row.departureIcao
    const arr = row.arrivalIcao

    agg.airportCounts[dep] = (agg.airportCounts[dep] || 0) + 1
    agg.airportCounts[arr] = (agg.airportCounts[arr] || 0) + 1

    const depCountry = cityCountryForIcao(dep).country
    const arrCountry = cityCountryForIcao(arr).country
    if (depCountry) countries.add(depCountry)
    if (arrCountry) countries.add(arrCountry)

    routes.add(`${dep}-${arr}`)
    const pk = pairKey(dep, arr)
    agg.routePairs[pk] = (agg.routePairs[pk] || 0) + 1

    agg.approvedCount += 1

    const hrs = hoursFromInterval(row.flightTime)
    if (!longest || hrs > longest.hours) {
      longest = { flightNumber: row.flightNumber, departureIcao: dep, arrivalIcao: arr, hours: hrs }
    }

    if (row.aircraft) agg.fleetHours[row.aircraft] = (agg.fleetHours[row.aircraft] || 0) + hrs

    const mk = monthKey(row.date)
    if (mk) agg.monthlyHours[mk] = (agg.monthlyHours[mk] || 0) + hrs

    const opId = operatorIdFor(row.flightNumber)
    agg.operatorHours[opId] = (agg.operatorHours[opId] || 0) + hrs

    // Event heuristic: any boosted multiplier (2x and up is already an event
    // rate at INVA), or a trail code in the comments.
    const trail = matchTrailCode(row.comments)
    const multiplier = Number(row.multiplier) || 1
    const isEvent = multiplier >= 2 || !!trail
    if (isEvent) {
      agg.eventsFlown += 1
      const qk = quarterKey(row.date)
      if (qk) agg.eventsByQuarter[qk] = (agg.eventsByQuarter[qk] || 0) + 1
      agg.recentEvents.push({
        date: row.date,
        name: trail?.name || row.flightNumber,
        departureIcao: dep,
        arrivalIcao: arr,
        aircraft: row.aircraft,
        hours: hrs,
        multiplier,
      })
    }

    if (!lastUpdatedAt || (row.updatedAt && row.updatedAt > lastUpdatedAt)) lastUpdatedAt = row.updatedAt
  }

  agg.countries = Array.from(countries)
  agg.uniqueRoutes = Array.from(routes)
  agg.longestFlight = longest
  agg.recentEvents = agg.recentEvents
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, MAX_RECENT_EVENTS)

  return lastUpdatedAt
}

// Derives the map payload from the aggregate — only the pilot's own airports and
// sectors, so the 5,800-entry coords table stays server-side and the client gets a
// few dozen points instead.
// `careerRoutePairs` folds in the pilot's career-mode sectors from Firestore, so
// the map is every unique route they've flown across both ledgers rather than the
// Neon half only.
function buildNetwork(agg, careerRoutePairs = {}) {
  const combinedPairs = { ...agg.routePairs }
  for (const [pk, count] of Object.entries(careerRoutePairs)) {
    combinedPairs[pk] = (combinedPairs[pk] || 0) + count
  }

  // Airports come from the sectors themselves, not just Neon's visit counts —
  // a career-only airport still needs a dot on the map.
  const airportCodes = new Set(Object.keys(agg.airportCounts))
  for (const pk of Object.keys(combinedPairs)) {
    for (const code of pk.split('-')) airportCodes.add(code)
  }

  const airports = {}
  const continents = new Set()

  for (const icao of airportCodes) {
    const entry = airportCoords[icao]
    if (!entry) continue
    const [lng, lat, cc] = entry
    airports[icao] = [lng, lat]
    const continent = continentFor(cc)
    if (continent) continents.add(continent)
  }

  const sectors = Object.entries(combinedPairs)
    .map(([pk, count]) => {
      const [from, to] = pk.split('-')
      return { from, to, count }
    })
    // Same-airport PIREPs (pattern work, or a leg filed with one field copied)
    // aren't sectors: they draw as a zero-length arc, and being numerous they
    // were topping the "most flown" chip as a meaningless VABB–VABB.
    .filter((s) => s.from !== s.to && airports[s.from] && airports[s.to])
    .sort((a, b) => b.count - a.count)

  const hub = Object.entries(agg.airportCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    airports,
    sectors,
    hub,
    hubCity: hub ? cityCountryForIcao(hub).city : null,
    continents: continents.size,
  }
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
  const rows = await db
    .select({
      flightNumber: pireps.flightNumber,
      date: pireps.date,
      flightTime: pireps.flightTime,
      departureIcao: pireps.departureIcao,
      arrivalIcao: pireps.arrivalIcao,
      aircraft: pireps.aircraft,
      multiplier: pireps.multiplier,
      comments: pireps.comments,
    })
    .from(pireps)
    .where(and(eq(pireps.userId, callsign), eq(pireps.valid, true)))
    .orderBy(sql`${pireps.updatedAt} DESC`)
    .limit(3)

  return rows.map((r) => {
    const trail = matchTrailCode(r.comments)
    return {
      flightNumber: r.flightNumber,
      date: r.date,
      flightTime: r.flightTime,
      departureIcao: r.departureIcao,
      arrivalIcao: r.arrivalIcao,
      aircraft: r.aircraft,
      multiplier: Number(r.multiplier) || 1,
      trailName: trail?.name || null,
    }
  })
}

// ── Firestore: career panel ──────────────────────────────────────────────────────

// Approved career flights live in the `flights` collection (written at approval by
// the portal's pirep-actions), which is where the per-flight landingGrade and the
// month-by-month history come from — the `users` doc only carries totals.
async function fetchCareerFlights(pilotId) {
  try {
    const snapshot = await fireDb
      .collection('flights')
      .where('pilotId', '==', pilotId)
      .select('flightTime', 'landingGrade', 'approvedAt', 'departure', 'arrival')
      .get()

    const monthlyHours = {}
    const routePairs = {}
    let graded = 0
    let passed = 0

    snapshot.forEach((doc) => {
      const d = doc.data()

      const approvedAt = d.approvedAt?.toDate?.() ?? (d.approvedAt ? new Date(d.approvedAt) : null)
      if (approvedAt && !Number.isNaN(approvedAt.getTime())) {
        const key = `${approvedAt.getUTCFullYear()}-${String(approvedAt.getUTCMonth() + 1).padStart(2, '0')}`
        monthlyHours[key] = (monthlyHours[key] || 0) + (Number(d.flightTime) || 0)
      }

      // Landings IF never verified are stored as 'unknown' — they'd drag the pass
      // rate down as if they'd failed, so they're left out of the denominator.
      const grade = d.landingGrade
      if (grade && grade !== 'unknown') {
        graded += 1
        if (PASSING_GRADES.has(grade)) passed += 1
      }

      const dep = String(d.departure || '').toUpperCase()
      const arr = String(d.arrival || '').toUpperCase()
      if (dep && arr) {
        const pk = pairKey(dep, arr)
        routePairs[pk] = (routePairs[pk] || 0) + 1
      }
    })

    return {
      monthlyHours,
      routePairs,
      landingsGraded: graded,
      landingPassRate: graded > 0 ? Math.round((passed / graded) * 100) : null,
    }
  } catch (err) {
    console.warn('Career flight history fetch failed (non-fatal):', err.message)
    return { monthlyHours: {}, routePairs: {}, landingsGraded: 0, landingPassRate: null }
  }
}

async function fetchCareer(callsign, agg) {
  try {
    const snapshot = await fireDb.collection('users').where('callsign', '==', callsign).limit(1).get()
    if (snapshot.empty) return null
    const doc = snapshot.docs[0]
    const data = doc.data()
    const homeBase = data.currentLocation ?? data.homeBase ?? null

    const history = await fetchCareerFlights(doc.id)

    // "Bases served": an airport the pilot has worked often enough to count as one
    // — 20+ visits across their approved flying — plus the home base Firestore
    // records, which counts whether or not it clears the threshold.
    const bases = new Set(
      Object.entries(agg?.airportCounts || {})
        .filter(([, visits]) => visits > BASE_VISIT_THRESHOLD)
        .map(([icao]) => icao)
    )
    if (homeBase) bases.add(homeBase)

    return {
      flightHours: data.flightHours ?? 0,
      rank: data.rank ?? null,
      homeBase,
      homeBaseCity: homeBase ? cityCountryForIcao(homeBase).city : null,
      typeRatings: Array.isArray(data.typeRatings) ? data.typeRatings : [],
      totalFlights: data.totalFlights ?? 0,
      careerEarnings: data.careerEarnings ?? 0,
      completedEvents: Array.isArray(data.completedEvents) ? data.completedEvents.length : 0,
      basesServed: bases.size,
      ...history,
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

  // Losing the lock is not a reason to fail. If there's something cached, serve it;
  // otherwise wait briefly for the winner's write, and if that doesn't land, build
  // it here anyway. Duplicated work on a cold profile is cheap next to rendering a
  // 404 for a pilot who plainly exists — which is what returning null did, because
  // the page can't tell "rebuild timed out" from "no such callsign".
  if (!gotLock) {
    if (previous) return previous
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 250))
      const raw = await redis.get(profileKey(callsign))
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (parsed?.version === SCHEMA_VERSION) return parsed
      }
    }
    console.warn(`[profile] ${callsign}: lock held elsewhere and nothing written; building without it`)
  }

  try {
    const identity = await fetchIdentity(callsign)
    if (!identity) return null

    const since = previous?.lastPirepUpdatedAt ? new Date(previous.lastPirepUpdatedAt) : null
    const agg = previous?.agg
      ? {
          ...emptyAgg(),
          ...previous.agg,
          airportCounts: { ...previous.agg.airportCounts },
          routePairs: { ...previous.agg.routePairs },
          fleetHours: { ...previous.agg.fleetHours },
          monthlyHours: { ...previous.agg.monthlyHours },
          operatorHours: { ...previous.agg.operatorHours },
          eventsByQuarter: { ...previous.agg.eventsByQuarter },
          recentEvents: [...(previous.agg.recentEvents || [])],
        }
      : emptyAgg()

    const rows = await fetchApprovedPireps(callsign, since)
    const lastRowUpdatedAt = mergePirepsIntoAgg(agg, rows)

    if (!previous) {
      const joined = await db
        .select({ date: sql`MIN(${pireps.date})`.as('date') })
        .from(pireps)
        .where(and(eq(pireps.userId, callsign), eq(pireps.valid, true)))
      agg.joinedDate = joined?.[0]?.date ?? null
    }

    const [trails, career, rawLogbook] = await Promise.all([
      fetchTrailsProgress(callsign),
      identity.careerMode ? fetchCareer(callsign, agg) : Promise.resolve(null),
      fetchLogbook(callsign),
    ])

    // Landing telemetry comes from the IF Live API and is matched to these rows by
    // sector + date; it fails soft, so a missing key or a bad day at IF just means
    // the logbook renders without its detail panels.
    const logbook = await attachFlightTelemetry(identity.ifcName, rawLogbook)

    const next = {
      version: SCHEMA_VERSION,
      computedAt: Date.now(),
      lastPirepUpdatedAt: lastRowUpdatedAt
        ? new Date(lastRowUpdatedAt).toISOString()
        : previous?.lastPirepUpdatedAt ?? null,
      identity,
      edits: previous?.edits ?? {},
      agg,
      network: buildNetwork(agg, career?.routePairs),
      trails,
      career,
      logbook,
    }

    await redis.set(profileKey(callsign), JSON.stringify(next))
    return next
  } finally {
    // Only release a lock we actually hold — the fall-through path above runs
    // without one, and deleting it there would free the real holder's lock.
    if (gotLock) await redis.del(lock).catch(() => {})
  }
}

// ── Public entrypoint ────────────────────────────────────────────────────────────

// react `cache()` dedupes within a single request, so generateMetadata and the page
// body share one resolution instead of racing each other into two rebuilds.
export const getProfileData = cache(async function getProfileData(callsign) {
  const redis = getRedis()
  const raw = await redis.get(profileKey(callsign))
  const stored = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
  const cached = stored?.version === SCHEMA_VERSION ? stored : null

  if (cached && Date.now() - cached.computedAt < FRESH_MS) {
    return cached
  }

  if (cached) {
    // Stale but present: serve it now, refresh off the request path.
    after(() => rebuildProfile(callsign, cached).catch((e) => console.error('Profile rebuild failed:', e)))
    return cached
  }

  // Hard miss (or a superseded schema): nothing usable to serve, rebuild inline.
  return rebuildProfile(callsign, null)
})

// Used by PATCH /api/users/profile — merges only the `edits` sub-object into the
// cached profile object and writes it straight back, so a display-name/bio/aircraft
// change is visible on the very next render without touching computedAt/agg/trails.
export async function updateProfileEdits(callsign, patch) {
  const current = await getProfileData(callsign)
  if (!current) return null

  const next = { ...current, edits: { ...current.edits, ...patch } }
  await getRedis().set(profileKey(callsign), JSON.stringify(next))
  return next.edits
}

export { TRAIL_MULTIPLIER, TRAIL_META }
