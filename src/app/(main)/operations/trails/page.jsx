export const metadata = {
  title: 'Maharaja Trails — Indian Virtual',
  description: 'Maharaja Trails: ten curated route collections across the Air India Group network on Infinite Flight — domestic durbars, Gulf corridors, heritage jumbos, and long-haul crossings to every continent INVA serves.',
  keywords: ['Indian Virtual trails', 'Air India virtual routes', 'Infinite Flight themed routes', 'INVA route collections', 'virtual airline flight tours'],
  openGraph: {
    title: 'Maharaja Trails | Indian Virtual',
    description: 'Ten curated route collections across the Air India Group network — pick a trail, fly it your way.',
    url: 'https://indianvirtual.site/operations/trails',
  },
  alternates: { canonical: 'https://indianvirtual.site/operations/trails' },
}

import {
  FaCrown,
  FaClockRotateLeft,
  FaSun,
  FaEarthOceania,
  FaBridge,
  FaLandmark,
  FaRoute,
  FaTree,
  FaCompass,
  FaBoxesPacking,
} from 'react-icons/fa6'

// ─── Data ─────────────────────────────────────────────────────────────────────
// Every sample leg below is a real row from the INVA `routes` table — flight
// number, ICAO city pair, block time and equipment as flown on the network.

function fmt(h) {
  const [ hh, mm ] = h.split(':')
  return `${parseInt(hh, 10)}h ${mm}m`
}

const TRAILS = [
  {
    id: 'durbar',
    name: 'The Durbar Trail',
    tagline: 'Where the Maharaja holds court.',
    icon: FaCrown,
    color: '#2b4bee',
    bg: '#EFF3FF',
    border: '#C7D2FE',
    region: 'Domestic India',
    stat: '516 legs',
    description:
      "Every network needs a spine. The Durbar Trail is INVA's — the metro trunks and regional spokes that Air India and Air India Express fly between Delhi, Mumbai, Bengaluru, Chennai, Kolkata and the tier-two cities in between. Short sectors, tight turns, and the busiest ATC you'll find anywhere on the map. This is where new recruits earn their stripes and veterans stay sharp.",
    routes: [
      { fn: 'AI183', from: 'Delhi', to: 'Kolkata', ac: 'Boeing 777-300ER', t: '01:40:00' },
      { fn: 'AI179', from: 'Mumbai', to: 'Delhi', ac: 'Boeing 777-200LR/-300ER', t: '01:50:00' },
      { fn: 'IX1023', from: 'Mumbai', to: 'Vijayawada', ac: 'Boeing 737 MAX', t: '02:15:00' },
      { fn: 'AI1470', from: 'Nagpur', to: 'Delhi', ac: 'A320', t: '01:50:00' },
      { fn: 'IX1012', from: 'Delhi', to: 'Bhopal', ac: 'A320', t: '02:05:00' },
    ],
  },
  {
    id: 'retro',
    name: 'The Retro Trail',
    tagline: 'Some liveries never really retire.',
    icon: FaClockRotateLeft,
    color: '#B45309',
    bg: '#FFFBEB',
    border: '#FDE68A',
    region: 'Heritage & Nostalgia',
    stat: '350 legs',
    description:
      "AIH is INVA's living museum — a heritage callsign flying the Boeing 747-400 and classic 777 rotations that defined Air India's jumbo era, upper deck and all. Fly alongside it under the 9W banner, resurrecting Jet Airways' A330s on the long-haul routes it never got to finish. Two grounded liveries, kept airborne on the virtual network for pilots who fly for the history as much as the horizon.",
    routes: [
      { fn: 'AIH01', from: 'Delhi', to: 'Adelaide', ac: 'Boeing 747-400', t: '11:00:00' },
      { fn: 'AIH104', from: 'New York JFK', to: 'Delhi', ac: 'Boeing 747-400', t: '14:00:00' },
      { fn: 'AIH11', from: 'Delhi', to: 'Moscow', ac: 'Boeing 747-400', t: '06:00:00' },
      { fn: '9W110', from: 'Delhi', to: 'Kochi', ac: 'A330-300', t: '03:15:00' },
      { fn: '9W222', from: 'Brussels', to: 'Toronto', ac: 'A330-300/777-300ER', t: '07:45:00' },
    ],
  },
  {
    id: 'golden-sands',
    name: 'The Golden Sands Trail',
    tagline: "The corridor that never sleeps.",
    icon: FaSun,
    color: '#C2410C',
    bg: '#FFF7ED',
    border: '#FED7AA',
    region: 'Middle East & the Gulf',
    stat: '412 legs',
    description:
      'No corridor on the INVA map carries more real-world weight than this one. Air India and Air India Express fly it daily — Delhi, Mumbai and the Gulf hubs bound together by decades of diaspora, trade and labour migration. Add in Emirates, Qatar Airways, Etihad and Saudia on the partner side and the Golden Sands Trail becomes a genuine crossroads: narrowbody hops next to A380s, all converging on the same stretch of desert.',
    routes: [
      { fn: 'AI2243', from: 'Delhi', to: 'Riyadh', ac: 'A320', t: '05:00:00' },
      { fn: 'AI2233', from: 'Mumbai', to: 'Muscat', ac: 'A320', t: '02:10:00' },
      { fn: 'AI2255', from: 'Delhi', to: 'Jeddah', ac: 'A320', t: '05:50:00' },
      { fn: '9W116', from: 'Mumbai', to: 'Johannesburg', ac: 'A330-300', t: '09:00:00' },
      { fn: '9W117', from: 'Johannesburg', to: 'Mumbai', ac: 'A330-300', t: '09:25:00' },
    ],
  },
  {
    id: 'southern-cross',
    name: 'The Southern Cross Trail',
    tagline: 'Down under, non-stop.',
    icon: FaEarthOceania,
    color: '#0F766E',
    bg: '#F0FDFA',
    border: '#99F6E4',
    region: 'Australia & the Pacific',
    stat: '150 legs',
    description:
      "Eleven-plus hours in the air before the coast even comes into view. The Southern Cross Trail is Air India's ultra-long-haul answer to the Kangaroo Route — Delhi and Mumbai to Sydney, Melbourne and Adelaide, joined by the Boeing 787 on the modern roster and the 747-400 under the AIH heritage banner. Bring your fuel planning and your patience; this is a full-sector, real-fatigue kind of flight.",
    routes: [
      { fn: 'AI301', from: 'Sydney', to: 'Delhi', ac: 'Boeing 787-8', t: '11:45:00' },
      { fn: 'AI310', from: 'Mumbai', to: 'Melbourne', ac: 'Boeing 787-8', t: '11:00:00' },
      { fn: 'AI308', from: 'Delhi', to: 'Melbourne', ac: 'Boeing 787-8/777-300ER', t: '11:25:00' },
      { fn: 'AIH01', from: 'Delhi', to: 'Adelaide', ac: 'Boeing 747-400', t: '11:00:00' },
      { fn: 'AIH1306', from: 'Delhi', to: 'Auckland', ac: 'Boeing 787-8', t: '16:30:00' },
    ],
  },
  {
    id: 'trans-atlantic',
    name: 'The Trans-Atlantic Trail',
    tagline: 'The old world, then the new.',
    icon: FaBridge,
    color: '#1E3A8A',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    region: 'North America',
    stat: '168 legs',
    description:
      "Air India's flagship A350s and 777-200LRs built their reputation on sectors like this — Delhi direct to New York, Washington and beyond, with the odd European tech-stop for the older birds. Air Canada joins from the north with its own Atlantic crossings out of Toronto and Vancouver. Sixteen hours, one time zone crossing after another, and a night that never quite ends: this is the trail for pilots who want to feel the ocean go by beneath them.",
    routes: [
      { fn: 'AI101', from: 'Delhi', to: 'New York JFK', ac: 'A350-900/-1000', t: '16:05:00' },
      { fn: 'AC850', from: 'Calgary', to: 'London Heathrow', ac: 'Boeing 787-8', t: '08:10:00' },
      { fn: 'AC860', from: 'Vancouver', to: 'London Heathrow', ac: 'Boeing 777-300ER', t: '08:55:00' },
      { fn: 'AIH104', from: 'New York JFK', to: 'Delhi', ac: 'Boeing 747-400', t: '14:00:00' },
      { fn: '9W222', from: 'Brussels', to: 'Toronto', ac: 'A330-300/777-300ER', t: '07:45:00' },
    ],
  },
  {
    id: 'grand-european',
    name: 'The Grand European Trail',
    tagline: "INVA's largest overseas theatre.",
    icon: FaLandmark,
    color: '#6D28D9',
    bg: '#F9F5FF',
    border: '#DDD6FE',
    region: 'Europe',
    stat: '517 legs',
    description:
      "More than any other continent, Europe is where the INVA network gets crowded — Air India's own long-haul rotations to Rome, Vienna and beyond, Jet Airways' revived widebodies, Air Canada's transatlantic tails touching down at Heathrow, and easyJet-style intra-European hops filling in the rest. From continental capitals to Mediterranean coastlines, the Grand European Trail rewards pilots who like variety in the same afternoon of flying.",
    routes: [
      { fn: 'AI105', from: 'Delhi', to: 'Rome', ac: 'A350-900', t: '09:20:00' },
      { fn: '9W114', from: 'Mumbai', to: 'Manchester', ac: 'A330-300', t: '09:25:00' },
      { fn: 'AC860', from: 'Vancouver', to: 'London Heathrow', ac: 'Boeing 777-300ER', t: '08:55:00' },
      { fn: 'U21545', from: 'Geneva', to: 'Antalya', ac: 'A320', t: '03:30:00' },
      { fn: 'AIH36', from: 'Newark', to: 'London Heathrow', ac: 'Boeing 787-8', t: '06:45:00' },
    ],
  },
  {
    id: 'silk-route',
    name: 'The Silk Route Trail',
    tagline: 'Ancient trade paths, modern jet bridges.',
    icon: FaRoute,
    color: '#15803D',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    region: 'East & Southeast Asia',
    stat: '256 legs',
    description:
      "India's oldest trading partners get the newest metal. The Silk Route Trail runs east from Delhi and Mumbai to Hanoi, Tokyo and beyond, riding alongside partner-carrier rotations from EVA Air, Vietnam Airlines, Singapore Airlines, Thai Airways, Korean Air and more. It's the most airline-diverse trail on the network — a different tail on the ramp at every stop.",
    routes: [
      { fn: 'BR211', from: 'Taipei', to: 'Bangkok', ac: 'Boeing 777-300ER/787-10', t: '03:30:00' },
      { fn: 'VN980', from: 'Delhi', to: 'Hanoi', ac: 'A350-900/787-9', t: '03:45:00' },
      { fn: 'VN981', from: 'Hanoi', to: 'Delhi', ac: 'A350-900/787-9', t: '04:15:00' },
      { fn: 'UK83H', from: 'Delhi', to: 'Tokyo Haneda', ac: 'Boeing 787-9', t: '07:45:00' },
    ],
  },
  {
    id: 'baobab',
    name: 'The Baobab Trail',
    tagline: "India's oldest bridge to Africa, rebuilt.",
    icon: FaTree,
    color: '#4D7C0F',
    bg: '#F7FEE7',
    border: '#D9F99D',
    region: 'Africa',
    stat: '113 legs',
    description:
      "Long before Gulf hubs dominated the map, dhows and later DC-3s tied the Indian Ocean's two coasts together. The Baobab Trail keeps that link alive — Ethiopian, Kenya Airways, EgyptAir and South African Airways connecting Addis Ababa, Nairobi and Johannesburg into the INVA network, with Air India's own tail joining on select sectors. Fewer pilots fly this trail, which is exactly its appeal.",
    routes: [
      { fn: 'ET610', from: 'Addis Ababa', to: 'Mumbai', ac: 'Boeing 777-200LR/787-8', t: '05:30:00' },
      { fn: 'ET506', from: 'Addis Ababa', to: 'Sao Paulo', ac: 'Boeing 777-200LR', t: '12:20:00' },
      { fn: 'KQ352', from: 'Nairobi', to: 'Kinshasa', ac: 'ERJ-190', t: '01:20:00' },
      { fn: '9W116', from: 'Mumbai', to: 'Johannesburg', ac: 'A330-300', t: '09:00:00' },
    ],
  },
  {
    id: 'far-frontier',
    name: 'The Far Frontier Trail',
    tagline: 'For pilots chasing the routes no one else flies.',
    icon: FaCompass,
    color: '#BE185D',
    bg: '#FDF2F8',
    border: '#FBCFE8',
    region: 'Latin America',
    stat: '82 legs',
    description:
      "No Indian carrier serves Latin America directly — which is exactly what makes this trail such a find. Riding Avianca, Copa Airlines and GOL/LATAM-family partner metal, the Far Frontier Trail threads Bogota, Sao Paulo, Santiago and Mexico City into reach of the same route database that opens with Delhi-Mumbai hops. A genuine collector's trail for pilots who've already logged the rest of the map.",
    routes: [
      { fn: 'AV120', from: 'Bogota', to: 'London Heathrow', ac: 'Boeing 787-8', t: '10:00:00' },
      { fn: 'VRG8670', from: 'Sao Paulo', to: 'Mexico City', ac: 'Boeing 777-200ER', t: '09:30:00' },
      { fn: 'VRG8703', from: 'Lisbon', to: 'Rio de Janeiro', ac: 'Boeing 777-200ER', t: '09:30:00' },
    ],
  },
  {
    id: 'heavy-metal',
    name: 'The Heavy Metal Trail',
    tagline: 'Behind every passenger route, the metal that keeps it alive.',
    icon: FaBoxesPacking,
    color: '#334155',
    bg: '#F8FAFC',
    border: '#CBD5E1',
    region: 'Cargo & Regional Feeder Ops',
    stat: '48 legs',
    description:
      "Not every mission carries passengers. The Heavy Metal Trail is INVA's operations sampler — Boeing 777 and MD-11 freighters hauling cargo across Saudia, EVA and independent operators, paired with the Dash 8-Q400s and regional jets working the short, unglamorous feeder legs that make the rest of the network possible. Different checklists, different priorities, same professionalism required.",
    routes: [
      { fn: 'SV978', from: 'Riyadh', to: 'Guangzhou', ac: 'Boeing 777F', t: '08:15:00' },
      { fn: 'VLO7432', from: 'Guayaquil', to: 'Mexico City', ac: 'MD-11F', t: '05:30:00' },
      { fn: 'BW430', from: 'Port of Spain', to: 'Georgetown', ac: 'Dash 8-Q400', t: '00:31:00' },
      { fn: 'KQ352', from: 'Nairobi', to: 'Kinshasa', ac: 'ERJ-190', t: '01:20:00' },
    ],
  },
]

// ─── Responsive CSS ────────────────────────────────────────────────────────────

const STYLES = `
  .trails-hero { padding: 100px 24px 80px; }
  .trails-hero-heading { font-size: clamp(56px, 10vw, 120px); }
  .trails-hero-stats { display: flex; flex-wrap: wrap; gap: 0; }
  .trails-stat-item { padding-right: 40px; margin-right: 40px; margin-bottom: 16px; }
  .trails-stat-item:not(:last-child) { border-right: 1px solid rgba(255,255,255,0.1); }

  .trails-section { padding: 64px 0; }
  .trails-section-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
  .trails-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 24px; }

  .trail-card { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); position: relative; display: flex; flex-direction: column; }
  .trail-card-body { padding: 28px 28px 24px; display: flex; flex-direction: column; gap: 16px; flex: 1; }
  .trail-routes { display: flex; flex-direction: column; gap: 8px; }
  .trail-route-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; font-size: 12.5px; padding: 7px 0; border-top: 1px solid #F1F5F9; }

  @media (max-width: 1023px) {
    .trails-hero { padding: 80px 20px 60px; }
    .trails-section { padding: 52px 0; }
    .trails-section-inner { padding: 0 20px; }
  }

  @media (max-width: 767px) {
    .trails-hero { padding: 72px 16px 52px; }
    .trails-hero-heading { font-size: clamp(44px, 14vw, 72px); }
    .trails-hero-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
    .trails-stat-item { padding-right: 0; margin-right: 0; border-right: none !important; padding-bottom: 20px; }
    .trails-stat-item:nth-child(odd) { padding-right: 20px; }
    .trails-section { padding: 44px 0; }
    .trails-section-inner { padding: 0 16px; }
    .trails-grid { grid-template-columns: 1fr; gap: 18px; }
    .trail-card-body { padding: 22px 20px 20px; }
  }
`

// ─── Sub-components ────────────────────────────────────────────────────────────

function TrailCard({ trail }) {
  const Icon = trail.icon
  return (
    <div className="trail-card">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: trail.color, zIndex: 2 }} />

      <div className="trail-card-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: trail.bg, border: `1px solid ${trail.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: trail.color, fontSize: 18,
          }}>
            <Icon />
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: trail.color }}>
              {trail.region}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{trail.stat} in network</div>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: '#0F172A', margin: '0 0 4px', lineHeight: 1.15 }}>
            {trail.name}
          </h3>
          <p style={{ fontSize: 13.5, fontWeight: 600, fontStyle: 'italic', color: trail.color, margin: 0 }}>
            {trail.tagline}
          </p>
        </div>

        <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.75, margin: 0 }}>
          {trail.description}
        </p>

        <div style={{ height: 1, background: '#F1F5F9', marginTop: 4 }} />

        <div className="trail-routes">
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94A3B8' }}>
            Sample legs
          </div>
          {trail.routes.map(r => (
            <div className="trail-route-row" key={r.fn}>
              <span style={{ fontWeight: 700, color: '#0F172A', flexShrink: 0 }}>{r.fn}</span>
              <span style={{ color: '#475569', flex: 1, textAlign: 'left', paddingLeft: 10 }}>
                {r.from} <span style={{ color: '#CBD5E1' }}>→</span> {r.to}
              </span>
              <span style={{ color: '#94A3B8', flexShrink: 0, fontSize: 11 }}>{fmt(r.t)}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 10.5, color: '#94A3B8', margin: 0 }}>{trail.routes.length} of {trail.stat.split(' ')[0]} legs shown · aircraft as filed on the route</p>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TrailsPage() {
  return (
    <main style={{ background: '#F8F7F5', minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <style>{STYLES}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="trails-hero" style={{ background: '#080D1A', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('/hero-blueprint.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'invert(1) grayscale(1)',
          mixBlendMode: 'screen',
          opacity: 0.09,
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(43,75,238,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.3)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
              Indian Virtual · Infinite Flight
            </span>
          </div>

          <h1 className="trails-hero-heading" style={{
            fontWeight: 900, letterSpacing: '-0.05em', color: '#FFFFFF',
            lineHeight: 0.95, margin: '0 0 32px',
          }}>
            MAHARAJA<br />
            <span style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,0.25)' }}>TRAILS</span>
          </h1>

          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, maxWidth: 620, margin: '0 0 52px' }}>
            2,294 routes across 380-plus airports is a route database. A trail is what happens when you give that database a reason. Each Maharaja Trail is a themed slice of the INVA network — a region, an era, or a mission — with real flight numbers pulled straight off the route sheet, ready to fly in whatever order suits you.
          </p>

          <div className="trails-hero-stats" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 32 }}>
            {[
              { value: '10', label: 'Trails' },
              { value: '2,294', label: 'Total Routes' },
              { value: '380+', label: 'Airports Served' },
              { value: '6', label: 'Continents' },
            ].map((stat) => (
              <div key={stat.label} className="trails-stat-item">
                <div style={{ fontSize: 36, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trails grid ──────────────────────────────────────────────────── */}
      <section className="trails-section">
        <div className="trails-section-inner">
          <div className="trails-grid">
            {TRAILS.map(trail => <TrailCard key={trail.id} trail={trail} />)}
          </div>
        </div>
      </section>

      {/* ── Attribution ───────────────────────────────────────────────────── */}
      <section style={{ background: '#F1F5F9', borderTop: '1px solid #E2E8F0', padding: '24px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>
            Route data sourced live from the INVA network database. Codeshare and partner-carrier legs are included where they run alongside Air India Group operations.
            INVA is not affiliated with Air India, Air India Express, Jet Airways, Infinite Flight LLC, or any real-world carrier named above.
          </p>
          <p style={{ fontSize: 12, color: '#CBD5E1', margin: 0, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            INDIANVIRTUAL.SITE · 2026
          </p>
        </div>
      </section>
    </main>
  )
}
