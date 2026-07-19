// Trail codes + leg counts — the single source of truth shared by the public
// Trails page (which displays the copyable code) and the PIREP API (which matches
// a code in a pilot's comments to credit a trail leg).
//
// This file is deliberately plain data with NO imports: the rich presentational
// data lives in src/app/(main)/operations/trails/trailsData.jsx, but that pulls in
// react-icons, so importing it into a serverless API route would bloat the function
// bundle. Keeping the code/leg table here means the route stays tiny.
//
// `legs` MUST equal the trail's legs[].length in trailsData.jsx. If you add/remove a
// leg there, update the count here. Codes are 6 uppercase letters, unique, and chosen
// to avoid everyday English words so they don't false-match in free-text comments.

// Bonus multiplier a pilot earns for each counted leg of a trail (up to the trail's
// leg count). Shared verbatim by the Trails page, the filing form, and the PIREP API
// so the number a pilot sees is exactly the number that gets applied.
export const TRAIL_MULTIPLIER = 1.25

export const TRAIL_META = {
  durbar:                 { code: 'DURBAR', legs: 4, name: 'The Durbar Day Shuttle' },
  himalayan:              { code: 'HIMALY', legs: 4, name: 'The Himalayan Frontier Circuit' },
  malabar:                { code: 'MALBAR', legs: 4, name: 'The Malabar Tabletop Circuit' },
  retro:                  { code: 'RETROJ', legs: 6, name: 'The Retro Trail' },
  'european-relay':       { code: 'EURELY', legs: 6, name: 'The European Relay' },
  'kolkata-relay':        { code: 'KOLKAT', legs: 4, name: 'The Kolkata Relay' },
  circumnavigator:        { code: 'CIRCUM', legs: 5, name: 'The Circumnavigator' },
  'istanbul-samba':       { code: 'SAMBRG', legs: 4, name: 'The Samba Bridge' },
  'trans-pacific':        { code: 'PACHOP', legs: 2, name: 'The Trans-Pacific Island Hop' },
  'golden-sands':         { code: 'GLDSND', legs: 5, name: 'The Golden Sands & Haj Bridge' },
  'southern-cross':       { code: 'SOUCRS', legs: 4, name: 'The Southern Cross Trail' },
  'silk-route':           { code: 'SILKRT', legs: 5, name: 'The Silk Route Trail' },
  baobab:                 { code: 'BAOBAB', legs: 5, name: 'The Baobab Trail' },
  'far-frontier':         { code: 'FRONTR', legs: 4, name: 'The Far Frontier Trail' },
  'toughest-approaches':  { code: 'APPRCH', legs: 5, name: "World's Toughest Approaches" },
  'seven-sisters':        { code: 'SEVSIS', legs: 5, name: 'The Seven Sisters Circuit' },
  'pink-city':            { code: 'PINKCT', legs: 6, name: 'The Pink City & Thar Desert Trail' },
  'pilgrims-path':        { code: 'PILGRM', legs: 4, name: "The Pilgrim's Path" },
  andaman:                { code: 'ANDMAN', legs: 4, name: 'The Andaman Island Escape' },
  'punjab-diaspora':      { code: 'PNJDIA', legs: 4, name: 'The Punjab Diaspora Bridge' },
  'indian-ocean-idylls':  { code: 'IDYLLS', legs: 5, name: 'Indian Ocean Idylls' },
  'silk-road-gateway':    { code: 'SILKRD', legs: 2, name: 'The Silk Road Gateway' },
  'alpine-express':       { code: 'ALPXPR', legs: 3, name: 'The Alpine Express' },
  'brussels-africa':      { code: 'BRUAFR', legs: 3, name: "Brussels' African Line" },
  'istanbul-crossroads':  { code: 'ISTANB', legs: 4, name: 'Istanbul Crossroads' },
  'rising-sun':           { code: 'RISSUN', legs: 3, name: 'The Rising Sun Network' },
  'indonesian-archipelago':{ code: 'ARCHPL', legs: 4, name: 'The Indonesian Archipelago' },
  'hainan-silk-road':     { code: 'HAINSR', legs: 3, name: "Hainan's Silk Road" },
  'etihad-web':           { code: 'ETHWEB', legs: 4, name: "Etihad's Abu Dhabi Web" },
  'ryanair-chaos':        { code: 'RYNCHS', legs: 3, name: 'The Ryanair Chaos Trail' },
  'lot-long-reach':       { code: 'LOTLNG', legs: 4, name: "LOT's Long Reach" },
  'egyptair-nile':        { code: 'EGYPTN', legs: 4, name: "EgyptAir's Nile Network" },
  'springbok-south':      { code: 'SPGBOK', legs: 4, name: 'Springbok Deep South' },
  'caribbean-circuit':    { code: 'CARCIR', legs: 5, name: 'The Caribbean Circuit' },
  'heavy-metal':          { code: 'HEAVYM', legs: 5, name: 'The Heavy Metal Trail' },
  'refuelling-stops':     { code: 'RFLSTP', legs: 3, name: 'The Refuelling Stops' },
  'qantaslink-outback':   { code: 'QLOUTB', legs: 2, name: 'The QantasLink Outback Hopper' },
  'indigo-frontier':      { code: 'INDGFR', legs: 6, name: 'The IndiGo Frontier' },
  'united-uncommon':      { code: 'UAUNCM', legs: 5, name: 'The United Uncommon' },
  'dhl-scenic-freight':   { code: 'YELRIB', legs: 4, name: 'The Yellow Ribbon' },
}

// code -> slug, for O(1) lookup during comment matching.
export const CODE_TO_SLUG = Object.fromEntries(
  Object.entries(TRAIL_META).map(([slug, m]) => [m.code, slug]),
)

// Returns the trail matched by a 6-letter code appearing as a whole word anywhere in
// `text` (case-insensitive), or null. Only exact 6-letter tokens are considered, so
// ordinary words and flight numbers can't collide. If several codes appear, the first
// wins. Pure/synchronous — no I/O — so it's free to call on every PIREP.
export function matchTrailCode(text) {
  if (!text) return null
  const tokens = String(text).toUpperCase().match(/\b[A-Z]{6}\b/g)
  if (!tokens) return null
  for (const tok of tokens) {
    const slug = CODE_TO_SLUG[tok]
    if (slug) return { slug, code: tok, ...TRAIL_META[slug] }
  }
  return null
}
