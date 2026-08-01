// Aircraft/livery + airline data — extracted from src/app/(main)/fleet/page.jsx
// so it can also be used as the favAircraft options source for pilot-profile
// pages (src/app/(main)/team, src/app/(crew)/crew/team). Pure data, no logic.

// ─── Data ─────────────────────────────────────────────────────────────────────

export const AIRLINES = [
  {
    id: 'air-india',
    name: 'Air India',
    iata: 'AI',
    tagline: 'The Maharaja Flies Again.',
    color: '#B91C1C',
    colorDim: '#991B1B',
    bg: '#FFF8F8',
    border: '#FECACA',
    description:
      'The flag carrier of India, reborn under Tata Sons. Air India\'s widebody-heavy fleet forms the backbone of INVA\'s long-haul programme — connecting the subcontinent to Europe, North America, and the Middle East aboard some of the most capable metal in commercial aviation.',
    badge: 'Flag Carrier',
  },
  {
    id: 'air-india-express',
    name: 'Air India Express',
    iata: 'IX',
    tagline: 'Low Cost. Full Commitment.',
    color: '#C2410C',
    colorDim: '#9A3412',
    bg: '#FFF7F0',
    border: '#FED7AA',
    description:
      'The low-cost arm of the Air India Group that built a franchise on 737s and tight turnarounds. Air India Express connects India\'s domestic network and Gulf corridors at a pace and a price that larger widebodies never could justify.',
    badge: 'Low-Cost Carrier',
  },
  {
    id: 'vistara',
    name: 'Vistara',
    iata: 'UK',
    tagline: 'Fly the New Feeling. Always.',
    color: '#6D28D9',
    colorDim: '#4C1D95',
    bg: '#F9F5FF',
    border: '#DDD6FE',
    description:
      'Vistara ceased operations in November 2024, absorbed into Air India after the Tata-SIA joint venture ran its course. But in the virtual skies of INVA, the purple tail still climbs — a standing tribute to the airline that proved India\'s passengers would choose quality when given the chance.',
    badge: 'Legacy Livery · 2013 – 2024',
    historical: true,
  },
]

export const AIRCRAFT = [
  {
    id: 'a350-900',
    name: 'Airbus A350-900',
    type: 'A350-900',
    code: 'A359',
    airline: 'air-india',
    image: '/livery/air-india/A359.webp',
    role: 'Long-Haul Flagship',
    featured: true,
    copy: 'The centrepiece of Air India\'s Tata era. The A350 is what long-haul ambitions look like when the accountants and engineers finally agree — a carbon-fibre widebody that burns less, climbs higher, and carries more. On routes where the old 777 once spent its fuel budget freely, the A350 makes the case quietly and in numbers.',
    specs: { 'Range': '8,099 NM', 'Cruise': 'M 0.85', 'Ceiling': 'FL431', 'Passengers': '316', 'MTOW': '280,000 kg', 'Wingspan': '64.75 m', 'Engines': '2× RR Trent XWB' },
  },
  {
    id: 'a350-1000',
    name: 'Airbus A350-1000',
    type: 'A350-1000',
    code: 'A35K',
    // Shares the -900's render: the two are near-identical in profile, and there is
    // no -1000 livery artwork yet.
    airline: 'air-india',
    image: '/livery/air-india/A359.webp',
    role: 'Ultra-Long-Haul Flagship',
    featured: true,
    copy: 'The A350-900 stretched, and rethought where the stretch demanded it. The -1000 gives up a little ceiling and takes back a great deal of aeroplane: a six-wheel main bogie to carry forty tonnes more, a reworked wing trailing edge, and Trent XWB-97s pushing 97,000 lbs a side. Where the -900 opens a route, the -1000 is what you send once it fills.',
    specs: { 'Range': '9,000 NM', 'Cruise': 'M 0.85', 'Ceiling': 'FL415', 'Passengers': '375–400', 'MTOW': '322,000 kg', 'Wingspan': '64.75 m', 'Engines': '2× RR Trent XWB-97' },
  },
  {
    id: 'b777-300er',
    name: 'Boeing 777-300ER',
    type: '777-300ER',
    code: 'B77W',
    airline: 'air-india',
    image: '/livery/air-india/B77W.webp',
    role: 'High-Capacity Long-Haul',
    featured: true,
    copy: 'The world\'s most commercially successful widebody for a reason. The 777-300ER doesn\'t ask for compromise between range and capacity — it delivers both. GE90-115Bs on the pylons, 7,370 nautical miles of proven range. Some aircraft earn their reputation; the Triple Seven builds its over decades.',
    specs: { 'Range': '7,370 NM', 'Cruise': 'M 0.84', 'Ceiling': 'FL431', 'Passengers': '345', 'MTOW': '351,500 kg', 'Wingspan': '64.80 m', 'Engines': '2× GE GE90-115B' },
  },
  {
    id: 'b787-8',
    name: 'Boeing 787-8',
    type: '787-8',
    code: 'B788',
    airline: 'air-india',
    image: '/livery/air-india/B788.webp',
    role: 'Medium-Haul Widebody',
    featured: false,
    copy: 'Air India was among the 787\'s launch customers, and the Dreamliner has since defined the Tata-era medium-haul story. Higher cabin humidity, larger windows, and a cruise passengers notice — not because something is wrong, but because something is finally right.',
    specs: { 'Range': '7,354 NM', 'Cruise': 'M 0.85', 'Ceiling': 'FL430', 'Passengers': '256', 'MTOW': '227,930 kg', 'Wingspan': '60.12 m', 'Engines': '2× GEnx-1B / Trent 1000' },
  },
  {
    id: 'b777-200lr',
    name: 'Boeing 777-200LR',
    type: '777-200LR',
    code: 'B77L',
    airline: 'air-india',
    image: '/livery/air-india/B77L.webp',
    role: 'Ultra-Long-Haul',
    featured: false,
    copy: 'The LR suffix isn\'t marketing. Delhi to San Francisco. Delhi to Chicago. Routes most aircraft cannot fly non-stop, powered by the GE90-115Bs that hold the record for the most powerful turbofan ever certified for commercial service.',
    specs: { 'Range': '4,968 NM', 'Cruise': 'M 0.84', 'Ceiling': 'FL431', 'Passengers': '288', 'MTOW': '347,500 kg', 'Wingspan': '64.80 m', 'Engines': '2× GE GE90-115B' },
  },
  {
    id: 'b747-400',
    name: 'Boeing 747-400',
    type: '747-400',
    code: 'B744',
    airline: 'air-india',
    image: '/livery/air-india/b744-airindia.png',
    role: 'Heritage Widebody',
    featured: false,
    copy: 'Few aircraft carry as much of Air India\'s identity as the 747. The Jumbo spent decades as the face of Indian aviation — Bombay and Delhi to London, New York, and beyond. On INVA it is a deliberate tribute to the era when four engines and an upper deck were the only way to cross an ocean.',
    specs: { 'Range': '7,284 NM', 'Cruise': 'M 0.85', 'Ceiling': 'FL451', 'Passengers': '423', 'MTOW': '396,890 kg', 'Wingspan': '64.4 m', 'Engines': '4× P&W 4000 / GE CF6' },
  },
  {
    id: 'a321-200',
    name: 'Airbus A321-200',
    type: 'A321-200',
    code: 'A321',
    airline: 'air-india',
    image: '/livery/air-india/A321.webp',
    role: 'High-Density Narrowbody',
    featured: false,
    copy: 'When density matters more than range the A321 steps up. Air India\'s stretched narrowbody handles the high-load domestic trunks — Delhi–Mumbai, Delhi–Bengaluru — where seat count and schedule frequency drive the economics.',
    specs: { 'Range': '3,202 NM', 'Cruise': 'M 0.78', 'Ceiling': 'FL410', 'Passengers': '182', 'MTOW': '93,800 kg', 'Wingspan': '35.8 m', 'Engines': '2× CFM56-5B / IAE V2500' },
  },
  {
    id: 'a320-ai',
    name: 'Airbus A320-200',
    type: 'A320-200',
    code: 'A320',
    airline: 'air-india',
    image: '/livery/air-india/A320.webp',
    role: 'Domestic Workhorse',
    featured: false,
    copy: 'The domestic network runs on this twin. The A320 connects metros and tier-2 cities with a consistency that larger metal cannot match — 168 seats across two cabins, proven CFM56s, and four decades of operational reliability behind every departure.',
    specs: { 'Range': '3,300 NM', 'Cruise': 'M 0.78', 'Ceiling': 'FL410', 'Passengers': '168', 'MTOW': '78,000 kg', 'Wingspan': '35.8 m', 'Engines': '2× CFM56-5B / IAE V2500' },
  },
  {
    id: 'b737-max8',
    name: 'Boeing 737 MAX 8',
    type: '737 MAX 8',
    code: 'B38M',
    airline: 'air-india-express',
    image: '/livery/air-india-express/B38M.webp',
    role: 'Next-Gen Narrowbody',
    featured: true,
    copy: 'The successor with a nuanced résumé and a better fuel bill. CFM LEAP-1B engines shave the burn by the percentages that determine survival in ultra-competitive short-haul markets. Air India Express\'s answer to the next decade — same narrow fuselage, meaningfully different economics.',
    specs: { 'Range': '3,550 NM', 'Cruise': 'M 0.79', 'Ceiling': 'FL410', 'Passengers': '176–186', 'MTOW': '82,191 kg', 'Wingspan': '35.9 m', 'Engines': '2× CFM LEAP-1B27' },
  },
  {
    id: 'b737-800',
    name: 'Boeing 737-800',
    type: '737-800',
    code: 'B738',
    airline: 'air-india-express',
    image: '/livery/air-india-express/B738.webp',
    role: 'Express Fleet Backbone',
    featured: false,
    copy: 'Simple economics, executed without apology. The 737-800 is how Air India Express moved millions of passengers across Gulf corridors and domestic sectors without overcomplicating the operation. One type rating. Aggressive turnarounds. It works.',
    specs: { 'Range': '2,935 NM', 'Cruise': 'M 0.78', 'Ceiling': 'FL410', 'Passengers': '189', 'MTOW': '79,002 kg', 'Wingspan': '35.79 m', 'Engines': '2× CFM56-7B' },
  },
  {
    id: 'a321neo-airindiaexpress',
    name: 'Airbus A321neo',
    type: 'A321neo',
    code: 'A21N',
    airline: 'air-india-express',
    image: '/livery/air-india/A321.webp',
    role: 'High-Density Regional',
    featured: false,
    copy: 'The workhorse of Air India Express\'s expanding network. Designed to move nearly two hundred passengers efficiently across India, the Gulf, and Southeast Asia, the A321neo pairs Airbus\' latest engines with a stretched fuselage and Sharklets to deliver lower fuel burn without sacrificing range. It is the aircraft that quietly keeps the group\'s short- and medium-haul network moving at scale.',
    specs: { 'Range': '4,000 NM', 'Cruise': 'M 0.78', 'Ceiling': 'FL391', 'Passengers': '190', 'MTOW': '97,000 kg', 'Wingspan': '35.8 m', 'Engines': '2× CFM LEAP-1A' },
  },
  {
    id: 'b787-9',
    name: 'Boeing 787-9',
    type: '787-9',
    code: 'B789',
    airline: 'vistara',
    image: '/livery/vistara/B789.webp',
    role: 'International Flagship',
    featured: true,
    copy: 'The aircraft Vistara ordered as its flag among flags. The 787-9 was the platform for its international expansion — London Heathrow, Frankfurt, Paris CDG. It flew just long enough to matter, before the merger completed in 2024. On INVA, the purple Dreamliner still climbs.',
    specs: { 'Range': '7,635 NM', 'Cruise': 'M 0.85', 'Ceiling': 'FL430', 'Passengers': '296', 'MTOW': '254,011 kg', 'Wingspan': '60.12 m', 'Engines': '2× GEnx-1B / Trent 1000' },
  },
  {
    id: 'a320-vistara',
    name: 'Airbus A320-200',
    type: 'A320-200',
    code: 'A320',
    airline: 'vistara',
    image: '/livery/vistara/a320-vistara.png',
    role: 'Premium Narrowbody',
    featured: false,
    copy: 'Vistara\'s A320 was never just another narrowbody. A genuine business class. Real seat pitch in economy. The purple and gold livery turned every sector — however short — into a statement about what Indian aviation could be.',
    specs: { 'Range': '3,300 NM', 'Cruise': 'M 0.78', 'Ceiling': 'FL410', 'Passengers': '158', 'MTOW': '78,000 kg', 'Wingspan': '35.8 m', 'Engines': '2× CFM56-5B / IAE V2500' },
  },
]

export function getAirlineById(id) {
  return AIRLINES.find((a) => a.id === id) || null
}

export function getAircraftById(id) {
  return AIRCRAFT.find((a) => a.id === id) || null
}

// Career mode names its type ratings with its own code set:
//   A320 A321 A350 A359 B38M B738 B744 B77L B77W B788 B789
// All of those match a fleet `code` directly except these two, which are family
// designators rather than specific variants and so have no entry of their own.
// Mapped to the variant INVA actually operates.
const CODE_ALIASES = {
  A350: 'A359', // A350 family -> the -900 we fly
  B737: 'B738', // 737 family  -> the -800 Air India Express flies
}

// Resolve a bare type designator (e.g. a career-mode type rating like "A320" or
// "B738") to a fleet entry so its livery art can be shown inline. Matches the ICAO
// code first, then the marketing type; where two liveries share a code (A320 flies
// in both Air India and Vistara colours) the first entry wins, which is the
// Air India one — the group's primary brand.
export function getAircraftByCode(code) {
  if (!code) return null
  const raw = String(code).trim().toUpperCase().replace(/[\s-]/g, '')
  const needle = CODE_ALIASES[raw] ?? raw
  return (
    AIRCRAFT.find((a) => a.code.toUpperCase() === needle) ||
    AIRCRAFT.find((a) => a.type.toUpperCase().replace(/[\s-]/g, '') === needle) ||
    null
  )
}
