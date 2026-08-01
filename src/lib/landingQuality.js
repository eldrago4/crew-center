// Landing-quality grading for the profile logbook.
//
// This is the display half of the rubric the career portal uses
// (Career-Mode-Portal-final2/landingQuality.js) — the same weights, bands and
// tiers, so a landing graded "Smooth" there reads "Smooth" here. The portal's
// earnings/bonus logic is deliberately NOT ported: nothing on a profile page pays
// out, and duplicating money rules across two codebases invites drift.
//
// Input is Infinite Flight's raw `landingStats` array from
// GET /users/{userId}/flights/{flightId} — one entry per touchdown, SI units.

const MS_TO_FPM = 196.8504
const MS_TO_KTS = 1.943844

export const LANDING_GRADE_TIERS = [
  { key: 'butter', label: 'Butter', color: '#7ee0a8', minScore: 90 },
  { key: 'smooth', label: 'Smooth', color: '#9be59b', minScore: 75 },
  { key: 'firm', label: 'Firm', color: '#FFCB83', minScore: 55 },
  { key: 'hard', label: 'Hard', color: '#f0a35e', minScore: 30 },
  { key: 'veryhard', label: 'Very Hard', color: '#e0726a', minScore: 0 },
]

// Grades counted as a "pass" for the career panel's landing-rate figure.
export const PASSING_GRADES = new Set(['butter', 'smooth', 'firm'])

const WEIGHTS = {
  verticalSpeed: 0.35, // sink rate is the headline number
  gForce: 0.25,        // balances V/S for gear physics
  centerline: 0.20,    // lateral precision
  marker1kft: 0.20,    // longitudinal precision (touchdown zone)
}

// Rewards a REALISTIC touchdown: an ultra-soft <90 fpm float scores Fair, so
// maximum softness alone doesn't grade butter.
function scoreVerticalSpeed(absFpm) {
  if (absFpm >= 90 && absFpm <= 200) return 100
  if (absFpm < 90) return 55
  if (absFpm <= 300) return 85
  if (absFpm <= 400) return 55
  if (absFpm <= 500) return 30
  return 10
}

function scoreGForce(g) {
  if (g <= 1.30) return 100
  if (g <= 1.50) return 85
  if (g <= 1.70) return 55
  if (g <= 1.90) return 30
  return 10
}

function scoreCenterline(absM) {
  if (absM <= 3.0) return 100
  if (absM <= 6.0) return 80
  if (absM <= 10.0) return 50
  return 20
}

// Signed: negative is short of the 1,000 ft aiming marker. Landing short is the
// real hazard, so a >150 m undershoot is the worst case.
function scoreMarker1kft(m) {
  if (m < -150) return 10
  const abs = Math.abs(m)
  if (abs <= 100) return 100
  if (abs <= 200) return 85
  if (abs <= 350) return 55
  return 20
}

// Last entry in the array is the actual touchdown (earlier ones are bounces).
export function normalizeLandingStats(rawArray) {
  if (!Array.isArray(rawArray) || rawArray.length === 0) return null
  const last = rawArray[rawArray.length - 1]
  if (!last) return null

  const vs = last.verticalSpeed
  const g = last.maxGForce
  const gs = last.groundSpeed
  if (!Number.isFinite(vs) || !Number.isFinite(g)) return null

  return {
    verticalSpeedFpm: Math.round(vs * MS_TO_FPM),
    maxGForce: g,
    groundSpeedKts: Number.isFinite(gs) ? Math.round(gs * MS_TO_KTS) : null,
    indicatedAirspeedKts: Number.isFinite(last.indicatedAirspeed) ? Math.round(last.indicatedAirspeed) : null,
    centerlineDistanceM: Number.isFinite(last.centerlineDistance) ? last.centerlineDistance : null,
    groundRollDistanceM: Number.isFinite(last.groundRollDistance) ? last.groundRollDistance : null,
    distanceFrom1kftMarkerM: Number.isFinite(last.distanceFrom1kftMarker) ? last.distanceFrom1kftMarker : null,
    landingCount: rawArray.length,
  }
}

// V/S and G always participate; centerline and marker join the weighted average
// only when IF reported them, and the weights renormalise over what's present so
// missing data never penalises the grade.
export function gradeLanding(n) {
  if (!n || !Number.isFinite(n.verticalSpeedFpm) || !Number.isFinite(n.maxGForce)) {
    return { key: 'unknown', label: 'No Data', color: '#9097a1', score: null }
  }

  const scores = {
    verticalSpeed: scoreVerticalSpeed(Math.abs(n.verticalSpeedFpm)),
    gForce: scoreGForce(n.maxGForce),
  }
  if (Number.isFinite(n.centerlineDistanceM)) scores.centerline = scoreCenterline(Math.abs(n.centerlineDistanceM))
  if (Number.isFinite(n.distanceFrom1kftMarkerM)) scores.marker1kft = scoreMarker1kft(n.distanceFrom1kftMarkerM)

  let weightSum = 0
  let weighted = 0
  for (const [param, s] of Object.entries(scores)) {
    weightSum += WEIGHTS[param]
    weighted += WEIGHTS[param] * s
  }
  const score = Math.round(weighted / weightSum)
  const tier = LANDING_GRADE_TIERS.find((t) => score >= t.minScore) ?? LANDING_GRADE_TIERS[LANDING_GRADE_TIERS.length - 1]

  return { key: tier.key, label: tier.label, color: tier.color, score }
}

export function gradeFromRawStats(rawArray) {
  const normalized = normalizeLandingStats(rawArray)
  if (!normalized) return null
  return { ...normalized, grade: gradeLanding(normalized) }
}
