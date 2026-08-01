// Flight-number prefix -> operator, for the profile page's "Where the hours went"
// breakdown. Derived from the codeshare-emoji prefix map in
// src/app/api/users/pireps/route.js (which uses the same prefixes to pick a Discord
// webhook thumbnail), with one deliberate difference: INVA's own flying is NOT one
// "Indian Virtual" bucket — it splits into the three Air India Group sub-brands the
// VA actually operates, because that's the split a pilot cares about on their profile.
//
// Prefixes are matched longest-first against the normalised flight number.

export const OPERATORS = [
  // ── Air India Group (INVA's own three brands) ──
  { id: 'air-india', label: 'Air India', color: '#C9A96E', prefixes: ['AIC', 'AIH', 'AI'] },
  { id: 'air-india-express', label: 'Air India Express', color: '#5FAFB8', prefixes: ['AIX', 'AXB', 'IXH', 'IX'] },
  { id: 'vistara', label: 'Vistara', color: '#8B7FD1', prefixes: ['UKH', 'UK'] },

  // ── Codeshare / partner metal flown on INVA ──
  { id: '6E', label: 'IndiGo', color: '#4A6FA5', prefixes: ['6E'] },
  { id: '9W', label: 'Jet Airways', color: '#7A8B99', prefixes: ['9W'] },
  { id: 'AC', label: 'Air Canada', color: '#B5555A', prefixes: ['AC'] },
  { id: 'AV', label: 'Avianca', color: '#B5484F', prefixes: ['AV'] },
  { id: 'AZ', label: 'ITA Airways', color: '#4E7FA8', prefixes: ['AZ'] },
  { id: 'BR', label: 'EVA Air', color: '#5E8B6E', prefixes: ['BR'] },
  { id: 'BW', label: 'Caribbean Airlines', color: '#6FA88E', prefixes: ['BW'] },
  { id: 'CI', label: 'China Airlines', color: '#8E6FA8', prefixes: ['CI'] },
  { id: 'CM', label: 'Copa Airlines', color: '#4F6FA0', prefixes: ['CM'] },
  { id: 'CX', label: 'Cathay Pacific', color: '#4E8578', prefixes: ['CX'] },
  { id: 'EK', label: 'Emirates', color: '#B5606A', prefixes: ['EK'] },
  { id: 'ET', label: 'Ethiopian', color: '#8FA85E', prefixes: ['ET'] },
  { id: 'EY', label: 'Etihad', color: '#9E8158', prefixes: ['EY'] },
  { id: 'FI', label: 'Icelandair', color: '#5A8EA8', prefixes: ['FI'] },
  { id: 'FR', label: 'Ryanair', color: '#4C6FB5', prefixes: ['FR'] },
  { id: 'GA', label: 'Garuda Indonesia', color: '#6FA5B5', prefixes: ['GA'] },
  { id: 'HU', label: 'Hainan Airlines', color: '#A85E7A', prefixes: ['HU'] },
  { id: 'KE', label: 'Korean Air', color: '#5E7FA8', prefixes: ['KE'] },
  { id: 'KQ', label: 'Kenya Airways', color: '#7A9E5E', prefixes: ['KQ'] },
  { id: 'LH', label: 'Lufthansa', color: '#7E8FA5', prefixes: ['LH'] },
  { id: 'LO', label: 'LOT Polish', color: '#5E8FA0', prefixes: ['LO'] },
  { id: 'LX', label: 'SWISS', color: '#A85E5E', prefixes: ['LX'] },
  { id: 'MK', label: 'Air Mauritius', color: '#8E9E5E', prefixes: ['MK'] },
  { id: 'MS', label: 'EgyptAir', color: '#9E8E5E', prefixes: ['MS'] },
  { id: 'NH', label: 'ANA', color: '#5E6FA8', prefixes: ['NH'] },
  { id: 'JT', label: 'Lion Air group', color: '#6F8EA5', prefixes: ['OD', 'ID', 'SL', 'JT'] },
  { id: 'QF', label: 'Qantas', color: '#A85E6F', prefixes: ['QF'] },
  { id: 'QR', label: 'Qatar Airways', color: '#8E4E6F', prefixes: ['QR'] },
  { id: 'SA', label: 'South African', color: '#5EA87F', prefixes: ['SA'] },
  { id: 'SN', label: 'Brussels Airlines', color: '#5E8EA8', prefixes: ['SN'] },
  { id: 'SQ', label: 'Singapore Airlines', color: '#A8925E', prefixes: ['SQ'] },
  { id: 'SV', label: 'Saudia', color: '#5E9E7A', prefixes: ['SV'] },
  { id: 'TG', label: 'Thai Airways', color: '#8E5EA8', prefixes: ['TG'] },
  { id: 'TK', label: 'Turkish Airlines', color: '#A85E5E', prefixes: ['TK'] },
  { id: 'TP', label: 'TAP Air Portugal', color: '#7FA85E', prefixes: ['TP'] },
  { id: 'U2', label: 'easyJet', color: '#D08A4E', prefixes: ['U2'] },
  { id: 'UA', label: 'United', color: '#5E7EA8', prefixes: ['UA'] },
  { id: 'VN', label: 'Vietnam Airlines', color: '#5EA8A0', prefixes: ['VN'] },
  { id: 'IFATC', label: 'IFATC', color: '#6E7C82', prefixes: ['IFATC'] },
]

// Longest-first so "AIH" wins over "AI", "IXH" over "IX", "UKH" over "UK".
const PREFIX_INDEX = OPERATORS
  .flatMap((op) => op.prefixes.map((p) => [p, op.id]))
  .sort((a, b) => b[0].length - a[0].length)

export const OPERATOR_BY_ID = Object.fromEntries(OPERATORS.map((op) => [op.id, op]))

export const OTHER_OPERATOR = { id: 'other', label: 'Other', color: '#3A4A50' }

export function operatorIdFor(flightNumber) {
  const fn = String(flightNumber || '').toUpperCase().replace(/[\s-]/g, '')
  if (!fn) return OTHER_OPERATOR.id
  for (const [prefix, id] of PREFIX_INDEX) {
    if (fn.startsWith(prefix)) return id
  }
  return OTHER_OPERATOR.id
}
