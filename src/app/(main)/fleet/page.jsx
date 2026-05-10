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
    copy: 'The centrepiece of Air India\'s Tata era. The A350 is what long-haul ambitions look like when the accountants and engineers finally agree — a carbon-fibre widebody that burns less, climbs higher, and carries more. On routes where the old 777 once spent its fuel budget freely, the A350 makes the case quietly and in numbers.',
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
    copy: 'The world\'s most commercially successful widebody for a reason. The 777-300ER doesn\'t ask for compromise between range and capacity — it delivers both. GE90-115Bs on the pylons, 7,370 nautical miles of proven range. Some aircraft earn their reputation; the Triple Seven builds its over decades.',
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
    copy: 'Air India was among the 787\'s launch customers, and the Dreamliner has since defined the Tata-era medium-haul story. Higher cabin humidity, larger windows, and a cruise passengers notice — not because something is wrong, but because something is finally right.',
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
    copy: 'The LR suffix isn\'t marketing. Delhi to San Francisco. Delhi to Chicago. Routes most aircraft cannot fly non-stop, powered by the GE90-115Bs that hold the record for the most powerful turbofan ever certified for commercial service.',
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
    copy: 'Few aircraft carry as much of Air India\'s identity as the 747. The Jumbo spent decades as the face of Indian aviation — Bombay and Delhi to London, New York, and beyond. On INVA it is a deliberate tribute to the era when four engines and an upper deck were the only way to cross an ocean.',
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
    copy: 'When density matters more than range the A321 steps up. Air India\'s stretched narrowbody handles the high-load domestic trunks — Delhi–Mumbai, Delhi–Bengaluru — where seat count and schedule frequency drive the economics.',
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
    copy: 'The aircraft Vistara ordered as its flag among flags. The 787-9 was the platform for its international expansion — London Heathrow, Frankfurt, Paris CDG. It flew just long enough to matter, before the merger completed in 2024. On INVA, the purple Dreamliner still climbs.',
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

// ─── Responsive CSS ────────────────────────────────────────────────────────────

const STYLES = `
  .fleet-hero { padding: 100px 24px 80px; }
  .fleet-hero-heading { font-size: clamp(64px, 11vw, 140px); }
  .fleet-hero-stats { display: flex; flex-wrap: wrap; gap: 0; }
  .fleet-stat-item { padding-right: 40px; margin-right: 40px; margin-bottom: 16px; }
  .fleet-stat-item:not(:last-child) { border-right: 1px solid rgba(255,255,255,0.1); }

  .fleet-section { padding: 80px 0; }
  .fleet-section-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

  .fleet-airline-header { display: flex; align-items: flex-start; gap: 24px; margin-bottom: 24px; }
  .fleet-airline-meta { flex: 1; }
  .fleet-airline-name { font-size: 48px; }
  .fleet-count-chip { flex-shrink: 0; }

  .fleet-featured-card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 20px;
    overflow: hidden;
    display: grid;
    grid-template-columns: 1fr 1fr;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    position: relative;
  }
  .fleet-featured-image {
    min-height: 340px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    position: relative;
    overflow: hidden;
  }
  .fleet-featured-info { padding: 36px 32px; display: flex; flex-direction: column; gap: 20px; }
  .fleet-specs-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }

  .fleet-compact-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }

  @media (max-width: 1023px) {
    .fleet-hero { padding: 80px 20px 60px; }
    .fleet-section { padding: 60px 0; }
    .fleet-section-inner { padding: 0 20px; }
    .fleet-airline-name { font-size: 38px; }
  }

  @media (max-width: 767px) {
    .fleet-hero { padding: 72px 16px 52px; }
    .fleet-hero-heading { font-size: clamp(52px, 15vw, 80px); }

    .fleet-hero-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
    .fleet-stat-item { padding-right: 0; margin-right: 0; border-right: none !important; padding-bottom: 20px; }
    .fleet-stat-item:nth-child(odd) { padding-right: 20px; }

    .fleet-section { padding: 48px 0; }
    .fleet-section-inner { padding: 0 16px; }

    .fleet-airline-header { gap: 10px; }
    .fleet-vertical-bar { display: none; }
    .fleet-airline-meta { min-width: 0; flex: 1; }
    .fleet-count-chip { flex-shrink: 0; padding: 8px 12px !important; align-self: flex-start; }
    .fleet-count-number { font-size: 22px !important; }
    .fleet-airline-name { font-size: 28px; }

    .fleet-featured-card { grid-template-columns: 1fr; }
    .fleet-featured-image {
      min-height: 220px !important;
      border-right: none !important;
      border-bottom: 1px solid #F1F5F9;
    }
    .fleet-featured-info { padding: 24px 20px; gap: 16px; }
    .fleet-specs-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }

    .fleet-compact-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 479px) {
    .fleet-hero { padding: 64px 16px 44px; }
    .fleet-section-inner { padding: 0 14px; }
    .fleet-specs-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  }

  @media (min-width: 640px) and (max-width: 1023px) {
    .fleet-featured-card { grid-template-columns: 1fr; }
    .fleet-featured-image {
      min-height: 260px !important;
      border-right: none !important;
      border-bottom: 1px solid #F1F5F9;
    }
    .fleet-featured-info { padding: 28px 28px; }
    .fleet-specs-grid { grid-template-columns: repeat(4, 1fr); }
    .fleet-compact-grid { grid-template-columns: repeat(2, 1fr); }
  }
`

// ─── Sub-components ────────────────────────────────────────────────────────────

function FeaturedCard({ ac, airline }) {
  const specs = Object.entries(ac.specs)
  const primarySpecs = specs.slice(0, 4)
  const secondarySpecs = specs.slice(4)

  return (
    <div className="fleet-featured-card" style={{ '--card-border': airline.border }}>
      {/* Accent top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: airline.color, zIndex: 2 }} />

      {/* Image pane */}
      <div
        className="fleet-featured-image"
        style={{
          background: `linear-gradient(135deg, ${airline.bg} 0%, #FFFFFF 100%)`,
          borderRight: `1px solid ${airline.border}`,
        }}
      >
        <span style={{
          position: 'absolute', bottom: -12, right: -8,
          fontSize: 96, fontWeight: 900, letterSpacing: '-0.05em',
          color: airline.color, opacity: 0.06, lineHeight: 1,
          userSelect: 'none', pointerEvents: 'none', fontFamily: 'system-ui',
        }}>
          {ac.code}
        </span>
        <Image
          src={ac.image} alt={ac.name} width={520} height={280}
          style={{ objectFit: 'contain', width: '100%', height: 'auto', maxHeight: 280, filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.14))' }}
          priority
        />
      </div>

      {/* Info pane */}
      <div className="fleet-featured-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: airline.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: airline.color }}>
            {ac.role}
          </span>
        </div>

        <div>
          <h3 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: '#0F172A', lineHeight: 1.1, margin: 0 }}>
            {ac.type}
          </h3>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0', fontWeight: 500, letterSpacing: '0.04em' }}>
            {ac.name}
          </p>
        </div>

        <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.75, margin: 0 }}>
          {ac.copy}
        </p>

        <div style={{ height: 1, background: '#F1F5F9' }} />

        <div className="fleet-specs-grid">
          {primarySpecs.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: '#0F172A', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {v}
              </span>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94A3B8' }}>
                {k}
              </span>
            </div>
          ))}
        </div>

        {secondarySpecs.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 18px' }}>
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
      background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)', position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: airline.color }} />

      <div style={{
        background: `linear-gradient(145deg, ${airline.bg} 0%, #FAFAFA 100%)`,
        padding: '28px 20px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', minHeight: 180,
      }}>
        <span style={{
          position: 'absolute', bottom: -10, right: -4,
          fontSize: 64, fontWeight: 900, letterSpacing: '-0.05em',
          color: airline.color, opacity: 0.07, lineHeight: 1,
          userSelect: 'none', pointerEvents: 'none', fontFamily: 'system-ui',
        }}>
          {ac.code}
        </span>
        <Image
          src={ac.image} alt={ac.name} width={340} height={180}
          style={{ objectFit: 'contain', width: '100%', height: 'auto', maxHeight: 160, filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.12))' }}
        />
      </div>

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

        <div style={{ display: 'flex' }}>
          {keySpecs.map(([k, v], i) => (
            <div key={k} style={{
              flex: 1,
              borderLeft: i > 0 ? '1px solid #E2E8F0' : 'none',
              paddingLeft: i > 0 ? 12 : 0,
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
  // Airlines with ≤ 3 aircraft get all cards full-width for visual weight
  const allFeatured = aircraft.length <= 3
  const featured = allFeatured ? aircraft : aircraft.filter(a => a.featured)
  const compact  = allFeatured ? [] : aircraft.filter(a => !a.featured)

  return (
    <section className="fleet-section" style={{ borderBottom: '1px solid #E2E8F0' }}>
      <div className="fleet-section-inner">

        {/* Header */}
        <div style={{ marginBottom: 52 }}>
          <div className="fleet-airline-header">
            {/* Left colour bar */}
            <div className="fleet-vertical-bar" style={{ width: 4, background: airline.color, borderRadius: 2, flexShrink: 0, alignSelf: 'stretch', minHeight: 72 }} />

            <div className="fleet-airline-meta">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ background: airline.color, color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 4 }}>
                  {airline.iata}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: airline.colorDim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {airline.badge}
                </span>
                {airline.historical && (
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#64748B', border: '1px solid #CBD5E1', borderRadius: 4, padding: '2px 8px' }}>
                    HISTORICAL
                  </span>
                )}
              </div>

              <h2 className="fleet-airline-name" style={{ fontWeight: 900, letterSpacing: '-0.04em', color: '#0F172A', margin: '0 0 6px', lineHeight: 1 }}>
                {airline.name}
              </h2>
              <p style={{ fontSize: 15, fontWeight: 500, color: airline.color, margin: 0, letterSpacing: '-0.01em', fontStyle: 'italic' }}>
                {airline.tagline}
              </p>
            </div>

            {/* Aircraft count */}
            <div className="fleet-count-chip" style={{ background: airline.bg, border: `1px solid ${airline.border}`, borderRadius: 12, padding: '12px 20px', textAlign: 'center' }}>
              <div className="fleet-count-number" style={{ fontSize: 32, fontWeight: 900, color: airline.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {aircraft.length}
              </div>
              <div className="fleet-count-label" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#94A3B8', marginTop: 4 }}>
                Aircraft
              </div>
            </div>
          </div>

          <p style={{ fontSize: 14.5, color: '#475569', lineHeight: 1.8, maxWidth: 680, margin: 0 }}>
            {airline.description}
          </p>
        </div>

        {/* Featured (full-width) */}
        {featured.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: compact.length > 0 ? 20 : 0 }}>
            {featured.map(ac => <FeaturedCard key={ac.id} ac={ac} airline={airline} />)}
          </div>
        )}

        {/* Compact grid */}
        {compact.length > 0 && (
          <div className="fleet-compact-grid">
            {compact.map(ac => <CompactCard key={ac.id} ac={ac} airline={airline} />)}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function FleetPage() {
  return (
    <main style={{ background: '#F8F7F5', minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <style>{STYLES}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="fleet-hero" style={{ background: '#080D1A', position: 'relative', overflow: 'hidden' }}>
        {/* Blueprint overlay — invert + screen so only etched lines glow on dark bg */}
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
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(185,28,28,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(109,40,217,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.3)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
              Indian Virtual · Infinite Flight
            </span>
          </div>

          <h1 className="fleet-hero-heading" style={{
            fontWeight: 900, letterSpacing: '-0.055em', color: '#FFFFFF',
            lineHeight: 0.9, margin: '0 0 32px',
          }}>
            THE<br />
            <span style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,0.25)' }}>FLEET</span>
          </h1>

          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 520, margin: '0 0 52px' }}>
            Every aircraft in the INVA fleet has been selected to mirror real-world Indian carrier operations — three livery families flown across the virtual skies of Infinite Flight.
          </p>

          {/* Stats */}
          <div className="fleet-hero-stats" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 32 }}>
            {[
              { value: String(AIRCRAFT.length), label: 'Aircraft Types' },
              { value: '3', label: 'Livery Families' },
              { value: '5', label: 'Widebody Variants' },
              { value: '6', label: 'Narrowbody Variants' },
            ].map((stat) => (
              <div key={stat.label} className="fleet-stat-item">
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
        {AIRLINES.map(airline => <AirlineSection key={airline.id} airline={airline} />)}
      </div>

      {/* ── Attribution ───────────────────────────────────────────────────── */}
      <section style={{ background: '#F1F5F9', borderTop: '1px solid #E2E8F0', padding: '24px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>
            Specifications sourced from{' '}
            <a href="https://infiniteflight.com/fleet" target="_blank" rel="noopener noreferrer"
              style={{ color: '#64748B', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Infinite Flight Fleet
            </a>
            . INVA is not affiliated with Air India, Air India Express, Vistara, Infinite Flight LLC, or any real-world carrier.
          </p>
          <p style={{ fontSize: 12, color: '#CBD5E1', margin: 0, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            INDIANVIRTUAL.SITE · 2026
          </p>
        </div>
      </section>
    </main>
  )
}
