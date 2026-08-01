// Career-mode rank ladder, mirroring the canonical threshold table in
// Career-Mode-Portal-final2/rank-utils.js (the portal's single source of truth for
// deriving a rank from career hours). Kept in the same low->high order the profile
// ladder renders in.
//
// The portal additionally gates Captain and above behind a command course when
// that policy flag is on. The profile doesn't re-derive rank — it displays the
// rank Firestore already stores — so the gate is irrelevant here; this table only
// positions the pilot on the ladder and answers "how far to the next one".

export const CAREER_RANKS = [
  { rank: 'Cadet', hours: 0 },
  { rank: 'Junior FO', hours: 80 },
  { rank: 'First Officer', hours: 200 },
  { rank: 'Senior FO', hours: 500 },
  { rank: 'Captain', hours: 900 },
  { rank: 'Senior Captain', hours: 1500 },
  { rank: 'Chief Pilot', hours: 2200 },
]

// Firestore has held a few spellings of the same rank over time.
const ALIASES = {
  'junior first officer': 'Junior FO',
  'senior first officer': 'Senior FO',
  'first officer': 'First Officer',
  'chief pilot': 'Chief Pilot',
  'senior captain': 'Senior Captain',
  captain: 'Captain',
  cadet: 'Cadet',
  'junior fo': 'Junior FO',
  'senior fo': 'Senior FO',
}

export function normalizeCareerRank(rank) {
  if (!rank) return null
  const key = String(rank).trim().toLowerCase()
  return ALIASES[key] ?? String(rank).trim()
}

export function careerRankIndex(rank) {
  const normalized = normalizeCareerRank(rank)
  return CAREER_RANKS.findIndex((r) => r.rank === normalized)
}

/**
 * Ladder state for the career panel.
 *
 * `index` comes from the stored rank when we recognise it, otherwise it's derived
 * from hours — so a pilot whose Firestore rank is a label we don't know still
 * lands somewhere sensible on the ladder.
 *
 * `promotions` is how many rungs the pilot has climbed above Cadet. The portal
 * doesn't keep a promotion history, but the current rank implies every rank below
 * it was reached, which is what the ladder renders as "achieved".
 */
export function getCareerProgress(rank, hours) {
  const h = Number(hours) || 0

  let index = careerRankIndex(rank)
  if (index === -1) {
    index = 0
    for (let i = 0; i < CAREER_RANKS.length; i++) {
      if (h >= CAREER_RANKS[i].hours) index = i
    }
  }

  const current = CAREER_RANKS[index]
  const next = CAREER_RANKS[index + 1] ?? null

  return {
    index,
    current: current.rank,
    nextRank: next?.rank ?? null,
    hoursToNext: next ? Math.max(0, next.hours - h) : 0,
    percent: next
      ? Math.min(100, Math.max(0, ((h - current.hours) / (next.hours - current.hours)) * 100))
      : 100,
    promotions: index,
  }
}
