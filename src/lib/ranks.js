// Shared rank/tier constants for the pilot profile pages (src/app/(main)/team,
// src/app/(crew)/crew/team). Deliberately separate from the duplicated threshold
// copies in UserProfileModal.jsx / pireps/route.js's PATCH handler — those aren't
// touched here, this is a fresh source of truth just for the profile UI.

// Mirrors the CASE thresholds on users.rank (schema.ts's generated column).
export const RANKS = [
  { rank: 'Yuvraj', hours: 0 },
  { rank: 'Rajkumar', hours: 80 },
  { rank: 'Rajvanshi', hours: 160 },
  { rank: 'Rajdhiraj', hours: 450 },
  { rank: 'Maharaja', hours: 900 },
  { rank: 'Samrat', hours: 1500 },
  { rank: 'Chhatrapati', hours: 2000 },
]

// The club tier above Chhatrapati itself (also used by admin/statistics/constants.js).
export const AKASHARATHA_HOURS = 2500
export const RAJMATYA_HOURS = 1500

// Four background tiers, basic -> premium, per the user's explicit split (overrides
// the imported design file's own inline-comment grouping):
//   1. Yuvraj, Rajkumar       -> basic
//   2. Rajvanshi              -> standard
//   3. Rajdhiraj, Maharaja    -> elite
//   4. Samrat, Chhatrapati    -> premium
export const RANK_TIER = {
  Yuvraj: 1,
  Rajkumar: 1,
  Rajvanshi: 2,
  Rajdhiraj: 3,
  Maharaja: 3,
  Samrat: 4,
  Chhatrapati: 4,
}

const TIER_HEX = {
  1: ['#1E2528', '#14181A'], // basic — graphite
  2: ['#1B2A33', '#0F161A'], // standard — steel
  3: ['#23223A', '#12131C'], // elite — indigo
  4: ['#17242A', '#0E1417'], // premium — ink teal
}

export const TIER_BG = Object.fromEntries(
  Object.entries(TIER_HEX).map(([tier, [outer, inner]]) => [
    tier,
    `radial-gradient(1200px 600px at 50% -120px, ${outer} 0%, ${inner} 62%)`,
  ])
)

// One accent per rank — used for the rank pill text and the climb-ladder bars.
export const RANK_COLOR = {
  Yuvraj: '#7C8B85',
  Rajkumar: '#B08D57',
  Rajvanshi: '#5FAFB8',
  Rajdhiraj: '#6E8FB5',
  Maharaja: '#8B7FD1',
  Samrat: '#C9A96E',
  Chhatrapati: '#E7CE96',
}

export function getRankTier(rank) {
  return RANK_TIER[rank] ?? 1
}

export function getRankBg(rank) {
  return TIER_BG[getRankTier(rank)] ?? TIER_BG[1]
}

export function getRankColor(rank) {
  return RANK_COLOR[rank] ?? RANK_COLOR.Yuvraj
}

// hours: decimal flight hours. Returns the climb-ladder progression shape.
export function getRankProgress(hours) {
  const h = Number(hours) || 0
  let currentIdx = 0
  for (let i = 0; i < RANKS.length; i++) {
    if (h >= RANKS[i].hours) currentIdx = i
  }
  const current = RANKS[currentIdx]
  const next = RANKS[currentIdx + 1] ?? null

  if (!next) {
    return { rank: current.rank, tier: getRankTier(current.rank), nextRank: null, hoursToNext: 0, percent: 100 }
  }

  const span = next.hours - current.hours
  const percent = Math.min(100, Math.max(0, ((h - current.hours) / span) * 100))
  return {
    rank: current.rank,
    tier: getRankTier(current.rank),
    nextRank: next.rank,
    hoursToNext: Math.max(0, next.hours - h),
    percent,
  }
}
