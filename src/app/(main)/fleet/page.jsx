export const metadata = {
  title: 'Fleet — Indian Virtual',
  description: 'The complete Indian Virtual fleet — Air India, Air India Express, and Vistara liveries operated across the virtual skies of Infinite Flight.',
  alternates: { canonical: 'https://indianvirtual.site/fleet' },
}

import Image from 'next/image'

// ─── Data ─────────────────────────────────────────────────────────────────────

const AIRLINES = [
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

const AIRCRAFT = [
  {
    id: 'a350-900',
    name: 'Airbus A350-900',
    type: 'A350-900',
    code: 'A359',
    airline: 'air-india',
    image: '/livery/air-india/a359-airindia.png',
    role: 'Long-Haul Flagship',
    featured: true,
    copy: 'The centrepiece of Air India\'s Tata era. The A350 is what the airline\'s long-haul ambitions look like when the accountants and the engineers finally agree — a carbon-fibre widebody that burns less, climbs higher, and carries more. On routes where the old 777 once spent its fuel budget freely, the A350 makes the case quietly, and in numbers.',
    specs: { 'Range': '8,099 NM', 'Cruise': 'M 0.85', 'Ceiling': 'FL431', 'Passengers': '440', 'MTOW': '280,000 kg', 'Wingspan': '64.75 m', 'Engines': '2× RR Trent XWB' },
  },
  {
    id: 'b777-300er',
    name: 'Boeing 777-300ER',
    type: '777-300ER',
    code: 'B77W',
    airline: 'air-india',
    image: '/livery/air-india/b777-300er-airindia.png',
    role: 'High-Capacity Long-Haul',
    featured: true,
    copy: 'The world\'s most commercially successful widebody for a reason. The 777-300ER doesn\'t ask for compromise between range and capacity — it simply delivers both. GE90-115Bs turning on their pylons and 7,370 nautical miles of proven range. Some aircraft earn their reputation; the Triple Seven builds its over decades.',
    specs: { 'Range': '7,370 NM', 'Cruise': 'M 0.84', 'Ceiling': 'FL431', 'Passengers': '503', 'MTOW': '351,500 kg', 'Wingspan': '64.80 m', 'Engines': '2× GE GE90-115B' },
  },
  {
    id: 'b787-8',
    name: 'Boeing 787-8',
    type: '787-8',
    code: 'B788',
    airline: 'air-india',
    image: '/livery/air-india/b788-airindia.png',
    role: 'Medium-Haul Widebody',
    featured: false,
    copy: 'Air India was among the 787\'s launch customers, and the Dreamliner has since defined the Tata-era medium-haul story. Higher cabin humidity, larger windows, and a cruise that passengers notice — not because something is wrong, but because something is finally right.',
    specs: { 'Range': '7,354 NM', 'Cruise': 'M 0.85', 'Ceiling': 'FL430', 'Passengers': '364', 'MTOW': '227,930 kg', 'Wingspan': '60.12 m', 'Engines': '2× GEnx-1B / Trent 1000' },
  },
  {
    id: 'b777-200lr',
    name: 'Boeing 777-200LR',
    type: '777-200LR',
    code: 'B77L',
    airline: 'air-india',
    image: '/livery/air-india/b777-200lr-airindia.png',
    role: 'Ultra-Long-Haul',
    featured: false,
    copy: 'The LR suffix isn\'t marketing. Delhi to San Francisco. Delhi to Chicago. Routes most aircraft cannot fly non-stop, on GE90-115Bs that hold the record for the most powerful turbofan ever certified for commercial service.',
    specs: { 'Range': '4,968 NM', 'Cruise': 'M 0.84', 'Ceiling': 'FL431', 'Passengers': '441', 'MTOW': '347,500 kg', 'Wingspan': '64.80 m', 'Engines': '2× GE GE90-115B' },
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
    copy: 'Few aircraft carry as much of Air India\'s identity as the 747. The Jumbo spent decades as the face of Indian aviation — Bombay and Delhi to London, New York, and beyond. On INVA, it is a deliberate tribute to the era when four engines and an upper deck were the only way to cross an ocean.',
    specs: { 'Range': '7,284 NM', 'Cruise': 'M 0.85', 'Ceiling': 'FL451', 'Passengers': '416', 'MTOW': '396,890 kg', 'Wingspan': '64.4 m', 'Engines': '4× P&W 4000 / GE CF6' },
  },
  {
    id: 'a321-200',
    name: 'Airbus A321-200',
    type: 'A321-200',
    code: 'A321',
    airline: 'air-india',
    image: '/livery/air-india/a321-airindia.png',
    role: 'High-Density Narrowbody',
    featured: false,
    copy: 'When density matters more than range, the A321 steps up. Air India\'s stretched narrowbody handles the high-load domestic trunks — Delhi–Mumbai, Delhi–Bengaluru — where seat count and schedule frequency drive the economics.',
    specs: { 'Range': '3,202 NM', 'Cruise': 'M 0.78', 'Ceiling': 'FL410', 'Passengers': '239', 'MTOW': '93,800 kg', 'Wingspan': '35.8 m', 'Engines': '2× CFM56-5B / IAE V2500' },
  },
  {
    id: 'a320-ai',
    name: 'Airbus A320-200',
    type: 'A320-200',
    code: 'A320',
    airline: 'air-india',
    image: '/livery/air-india/a320-airindia.png',
    role: 'Domestic Workhorse',
    featured: false,
    copy: 'The domestic network runs on this twin. The A320 connects metros and tier-2 cities with a consistency that larger metal cannot match — 175 seats, proven CFM56s, and four decades of operational reliability behind every departure.',
    specs: { 'Range': '3,300 NM', 'Cruise': 'M 0.78', 'Ceiling': 'FL410', 'Passengers': '175', 'MTOW': '78,000 kg', 'Wingspan': '35.8 m', 'Engines': '2× CFM56-5B / IAE V2500' },
  },
  {
    id: 'b737-max8',
    name: 'Boeing 737 MAX 8',
    type: '737 MAX 8',
    code: 'B38M',
    airline: 'air-india-express',
    image: '/livery/air-india-express/b38m-airndia-express.png',
    role: 'Next-Gen Narrowbody',
    featured: true,
    copy: 'The successor with a nuanced résumé and a better fuel bill. CFM LEAP-1B engines shave the burn by the percentages that determine survival in ultra-competitive short-haul markets. Air India Express\'s answer to the next decade — same narrow fuselage, meaningfully different economics.',
    specs: { 'Range': '3,550 NM', 'Cruise': 'M 0.79', 'Ceiling': 'FL410', 'Passengers': '178', 'MTOW': '82,191 kg', 'Wingspan': '35.9 m', 'Engines': '2× CFM LEAP-1B27' },
  },
  {
    id: 'b737-800',
    name: 'Boeing 737-800',
    type: '737-800',
    code: 'B738',
    airline: 'air-india-express',
    image: '/livery/air-india-express/737-800-airindia-express.png',
    role: 'Express Fleet Backbone',
    featured: false,
    copy: 'Simple economics, executed without apology. The 737-800 is how Air India Express moved millions of passengers across Gulf corridors and domestic sectors without overcomplicating the operation. One type rating. Aggressive turnarounds. It works.',
    specs: { 'Range': '2,935 NM', 'Cruise': 'M 0.78', 'Ceiling': 'FL410', 'Passengers': '189', 'MTOW': '79,002 kg', 'Wingspan': '35.79 m', 'Engines': '2× CFM56-7B' },
  },
  {
    id: 'b787-9',
    name: 'Boeing 787-9',
    type: '787-9',
    code: 'B789',
    airline: 'vistara',
    image: '/livery/vistara/b789-vistara.png',
    role: 'International Flagship',
    featured: true,
    copy: 'The aircraft Vistara ordered as its flag among flags. The 787-9 was the platform on which the airline planned its international expansion — London Heathrow, Frankfurt, Paris CDG. It flew just long enough to matter, before the merger completed in 2024. On INVA, the purple Dreamliner still climbs.',
    specs: { 'Range': '7,635 NM', 'Cruise': 'M 0.85', 'Ceiling': 'FL430', 'Passengers': '364', 'MTOW': '254,011 kg', 'Wingspan': '60.12 m', 'Engines': '2× GEnx-1B / Trent 1000' },
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

// ─── Sub-components ────────────────────────────────────────────────────────────

function SpecPill({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, minWidth: 0 }}>
      <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, color: '#0F172A', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
        {value}
      </span>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94A3B8', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  )
}

function FeaturedCard({ ac, airline }) {
  const specs = Object.entries(ac.specs)
  const primarySpecs = specs.slice(0, 4)
  const secondarySpecs = specs.slice(4)

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 20,
      overflow: 'hidden',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      position: 'relative',
    }}>
      {/* Accent top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: airline.color, zIndex: 2 }} />

      {/* Image pane */}
      <div style={{
        background: `linear-gradient(135deg, ${airline.bg} 0%, #FFFFFF 100%)`,
        position: 'relative',
        minHeight: 340,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        borderRight: `1px solid ${airline.border}`,
        overflow: 'hidden',
      }}>
        {/* Large faded type code watermark */}
        <span style={{
          position: 'absolute',
          bottom: -12,
          right: -8,
          fontSize: 96,
          fontWeight: 900,
          letterSpacing: '-0.05em',
          color: airline.color,
          opacity: 0.06,
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
          fontFamily: 'system-ui',
        }}>
          {ac.code}
        </span>
        <Image
          src={ac.image}
          alt={ac.name}
          width={520}
          height={280}
          style={{ objectFit: 'contain', width: '100%', height: 'auto', maxHeight: 280, filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.14))' }}
          priority
        />
      </div>

      {/* Info pane */}
      <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Role badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: airline.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: airline.color }}>
            {ac.role}
          </span>
        </div>

        {/* Aircraft name */}
        <div>
          <h3 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: '#0F172A', lineHeight: 1.1, margin: 0 }}>
            {ac.type}
          </h3>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0', fontWeight: 500, letterSpacing: '0.04em' }}>
            {ac.name}
          </p>
        </div>

        {/* Copy */}
        <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.75, margin: 0 }}>
          {ac.copy}
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: '#F1F5F9' }} />

        {/* Primary specs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {primarySpecs.map(([k, v]) => (
            <SpecPill key={k} label={k} value={v} />
          ))}
        </div>

        {/* Secondary specs */}
        {secondarySpecs.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px' }}>
            {secondarySpecs.map(([k, v]) => (
              <span key={k} style={{ fontSize: 11.5, color: '#64748B' }}>
                <span style={{ color: '#94A3B8', fontWeight: 500 }}>{k}: </span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CompactCard({ ac, airline }) {
  const keySpecs = Object.entries(ac.specs).slice(0, 3)

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 16,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      position: 'relative',
      transition: 'box-shadow 0.2s',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: airline.color }} />

      {/* Image area */}
      <div style={{
        background: `linear-gradient(145deg, ${airline.bg} 0%, #FAFAFA 100%)`,
        padding: '28px 20px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 180,
      }}>
        <span style={{
          position: 'absolute',
          bottom: -10,
          right: -4,
          fontSize: 64,
          fontWeight: 900,
          letterSpacing: '-0.05em',
          color: airline.color,
          opacity: 0.07,
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
          fontFamily: 'system-ui',
        }}>
          {ac.code}
        </span>
        <Image
          src={ac.image}
          alt={ac.name}
          width={340}
          height={180}
          style={{ objectFit: 'contain', width: '100%', height: 'auto', maxHeight: 160, filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.12))' }}
        />
      </div>

      {/* Info area */}
      <div style={{ padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: airline.color, flexShrink: 0 }} />
            <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: airline.color }}>
              {ac.role}
            </span>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.025em', color: '#0F172A', margin: 0, lineHeight: 1.15 }}>
            {ac.type}
          </h3>
        </div>

        <p style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.65, margin: 0, flex: 1 }}>
          {ac.copy}
        </p>

        <div style={{ height: 1, background: '#F1F5F9' }} />

        <div style={{ display: 'flex', gap: 0 }}>
          {keySpecs.map(([k, v], i) => (
            <div key={k} style={{
              flex: 1,
              borderLeft: i > 0 ? '1px solid #E2E8F0' : 'none',
              paddingLeft: i > 0 ? 12 : 0,
              marginLeft: i > 0 ? 0 : 0,
            }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {v}
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', marginTop: 3 }}>
                {k}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AirlineSection({ airline }) {
  const aircraft = AIRCRAFT.filter(a => a.airline === airline.id)
  const featured = aircraft.filter(a => a.featured)
  const compact = aircraft.filter(a => !a.featured)

  return (
    <section style={{ padding: '80px 0', borderBottom: '1px solid #E2E8F0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* Section header */}
        <div style={{ marginBottom: 52 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 24 }}>
            {/* Colored left bar */}
            <div style={{ width: 4, background: airline.color, borderRadius: 2, flexShrink: 0, alignSelf: 'stretch', minHeight: 80 }} />

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{
                  background: airline.color,
                  color: '#FFFFFF',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: 4,
                }}>
                  {airline.iata}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: airline.colorDim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {airline.badge}
                </span>
                {airline.historical && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#64748B',
                    border: '1px solid #CBD5E1',
                    borderRadius: 4,
                    padding: '2px 8px',
                  }}>
                    HISTORICAL
                  </span>
                )}
              </div>

              <h2 style={{
                fontSize: 48,
                fontWeight: 900,
                letterSpacing: '-0.04em',
                color: '#0F172A',
                margin: '0 0 4px',
                lineHeight: 1,
              }}>
                {airline.name}
              </h2>

              <p style={{
                fontSize: 16,
                fontWeight: 500,
                color: airline.color,
                margin: '6px 0 0',
                letterSpacing: '-0.01em',
                fontStyle: 'italic',
              }}>
                {airline.tagline}
              </p>
            </div>

            {/* Aircraft count chip */}
            <div style={{
              background: airline.bg,
              border: `1px solid ${airline.border}`,
              borderRadius: 12,
              padding: '12px 20px',
              textAlign: 'center',
              flexShrink: 0,
            }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: airline.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {aircraft.length}
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#94A3B8', marginTop: 4 }}>
                {aircraft.length === 1 ? 'Aircraft' : 'Aircraft'}
              </div>
            </div>
          </div>

          <p style={{ fontSize: 14.5, color: '#475569', lineHeight: 1.8, maxWidth: 680, margin: 0 }}>
            {airline.description}
          </p>
        </div>

        {/* Featured aircraft */}
        {featured.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: compact.length > 0 ? 20 : 0 }}>
            {featured.map(ac => (
              <FeaturedCard key={ac.id} ac={ac} airline={airline} />
            ))}
          </div>
        )}

        {/* Compact grid */}
        {compact.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}>
            {compact.map(ac => (
              <CompactCard key={ac.id} ac={ac} airline={airline} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function FleetPage() {
  const totalAircraft = AIRCRAFT.length

  return (
    <main style={{ background: '#F8F7F5', minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{
        background: '#080D1A',
        position: 'relative',
        overflow: 'hidden',
        padding: '100px 24px 80px',
      }}>
        {/* Grid overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />

        {/* Gradient glow left */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(185,28,28,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Gradient glow right */}
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          right: '-5%',
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(109,40,217,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.3)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
              Indian Virtual · Infinite Flight
            </span>
          </div>

          {/* Main heading */}
          <h1 style={{
            fontSize: 'clamp(72px, 12vw, 140px)',
            fontWeight: 900,
            letterSpacing: '-0.055em',
            color: '#FFFFFF',
            lineHeight: 0.9,
            margin: '0 0 32px',
          }}>
            THE<br />
            <span style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,0.25)' }}>FLEET</span>
          </h1>

          <p style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.7,
            maxWidth: 520,
            margin: '0 0 52px',
          }}>
            Every aircraft in the INVA fleet has been selected to mirror real-world operations — Air India, Air India Express, and Vistara liveries flown across the virtual skies of Infinite Flight.
          </p>

          {/* Stats strip */}
          <div style={{
            display: 'flex',
            gap: 0,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 32,
            flexWrap: 'wrap',
          }}>
            {[
              { value: totalAircraft.toString(), label: 'Aircraft Types' },
              { value: '3', label: 'Livery Families' },
              { value: '5', label: 'Widebody Variants' },
              { value: '6', label: 'Narrowbody Variants' },
            ].map((stat, i) => (
              <div key={stat.label} style={{
                paddingRight: 40,
                marginRight: 40,
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
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

      {/* ── Airline sections ──────────────────────────────────────────────── */}
      <div style={{ background: '#F8F7F5' }}>
        {AIRLINES.map(airline => (
          <AirlineSection key={airline.id} airline={airline} />
        ))}
      </div>

      {/* ── Attribution ───────────────────────────────────────────────────── */}
      <section style={{
        background: '#F1F5F9',
        borderTop: '1px solid #E2E8F0',
        padding: '28px 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>
            Aircraft specifications sourced from{' '}
            <a href="https://infiniteflight.com/fleet" target="_blank" rel="noopener noreferrer"
              style={{ color: '#64748B', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Infinite Flight Fleet
            </a>
            . INVA is not affiliated with Air India, Air India Express, Vistara, Infinite Flight LLC, or any real-world carrier.
          </p>
          <p style={{ fontSize: 12, color: '#CBD5E1', margin: 0, letterSpacing: '0.06em' }}>
            INDIANVIRTUAL.SITE · 2026
          </p>
        </div>
      </section>

    </main>
  )
}
