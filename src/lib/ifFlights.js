// Infinite Flight Live API v2 — pulls per-flight telemetry for the profile logbook.
//
// Only the profile rebuild calls this (once per pilot per 24h staleness window), so
// the cost is 1 lookup + 1 flight list + one detail fetch per matched logbook row:
// at most 5 calls against a 30/min budget. Everything fails soft — telemetry is a
// garnish, and a missing IF key or a 502 must never stop a profile rendering.

import { gradeFromRawStats } from '@/lib/landingQuality'

const IF_BASE = 'https://api.infiniteflight.com/public/v2'

// A PIREP stores a DATE with no time, so a flight is only accepted as the match
// when it sits within this window of that date. Anything looser starts attaching
// last week's landing to today's row.
const MATCH_WINDOW_DAYS = 2

async function ifFetch(url, options = {}) {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`IF API HTTP ${res.status}`)
  const json = await res.json()
  if (json.errorCode !== 0) throw new Error(`IF API errorCode ${json.errorCode}`)
  return json.result
}

async function resolveUserId(apiKey, ifcName) {
  const users = await ifFetch(`${IF_BASE}/users?apikey=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ discourseNames: [ifcName] }),
  })
  if (!Array.isArray(users)) return null
  const match = users.find((u) => u.discourseUsername?.toLowerCase() === String(ifcName).toLowerCase())
  return match?.userId ?? null
}

function daysApart(a, b) {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86400000
}

// Same sector, nearest date, inside the window. Ambiguity is resolved by taking
// the closest — and when two flights of the same route sit equally close, the
// match is simply wrong-but-plausible, which is why nothing downstream treats
// this as authoritative.
function matchFlight(flights, pirep) {
  if (!Array.isArray(flights) || !pirep?.date) return null
  const dep = String(pirep.departureIcao || '').toUpperCase()
  const arr = String(pirep.arrivalIcao || '').toUpperCase()

  return flights
    .filter((f) =>
      String(f.originAirport || '').toUpperCase() === dep &&
      String(f.destinationAirport || '').toUpperCase() === arr &&
      f.created)
    .map((f) => ({ flight: f, gap: daysApart(f.created, pirep.date) }))
    .filter((c) => c.gap <= MATCH_WINDOW_DAYS)
    .sort((a, b) => a.gap - b.gap)[0]?.flight ?? null
}

// Minutes -> the day/night split panel. IF reports these on the flight summary;
// when it doesn't, the panel is simply omitted rather than guessed at.
function dayNight(flight) {
  const day = Number(flight?.dayTime)
  const night = Number(flight?.nightTime)
  if (!Number.isFinite(day) || !Number.isFinite(night) || day + night <= 0) return null
  return { dayMinutes: day, nightMinutes: night }
}

/**
 * Attach landing telemetry to logbook rows.
 * Returns the rows unchanged (minus any `telemetry`) if IF can't be reached.
 */
export async function attachFlightTelemetry(ifcName, logbook) {
  const apiKey = process.env.INFINITE_FLIGHT_API_KEY
  if (!apiKey || !ifcName || !Array.isArray(logbook) || logbook.length === 0) return logbook

  try {
    const userId = await resolveUserId(apiKey, ifcName)
    if (!userId) return logbook

    const list = await ifFetch(`${IF_BASE}/users/${userId}/flights?page=1&apikey=${apiKey}`)
    const flights = Array.isArray(list?.data) ? list.data : []
    if (!flights.length) return logbook

    const matches = logbook.map((p) => matchFlight(flights, p))

    const details = await Promise.all(
      matches.map((f) =>
        f?.id
          ? ifFetch(`${IF_BASE}/users/${userId}/flights/${f.id}?apikey=${apiKey}`).catch(() => null)
          : Promise.resolve(null)
      )
    )

    return logbook.map((row, i) => {
      const flight = matches[i]
      if (!flight) return row

      const detail = details[i]
      const landing = gradeFromRawStats(detail?.landingStats)
      const split = dayNight(detail ?? flight)
      const violations = Number(detail?.violations ?? flight?.violations)

      if (!landing && !split && !Number.isFinite(violations)) return row

      return {
        ...row,
        telemetry: {
          landing,
          dayNight: split,
          violations: Number.isFinite(violations) ? violations : null,
        },
      }
    })
  } catch (err) {
    console.warn('IF telemetry fetch failed (non-fatal):', err.message)
    return logbook
  }
}
