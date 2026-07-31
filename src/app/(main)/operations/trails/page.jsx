export const metadata = {
  title: 'Maharaja Trails — Indian Virtual',
  description: 'Maharaja Trails: forty hand-picked flight itineraries across the Air India Group network on Infinite Flight — chained mountain circuits, tech-stop long-hauls, a round-the-world A380 chase, cargo relays, and more, each with real legs and a suggested flight plan.',
  keywords: ['Indian Virtual trails', 'Air India virtual routes', 'Infinite Flight themed routes', 'INVA route collections', 'virtual airline flight itinerary'],
  openGraph: {
    title: 'Maharaja Trails | Indian Virtual',
    description: 'Forty hand-picked route itineraries across the Air India Group network — real chained legs, suggested departure times, and a story behind every one.',
    url: 'https://indianvirtual.com/operations/trails',
  },
  alternates: { canonical: 'https://indianvirtual.com/operations/trails' },
}

import Image from 'next/image'
import TrailsDirectory from './TrailsDirectory'

// ─── Hero styles ────────────────────────────────────────────────────────────────

const STYLES = `
  .trails-hero { padding: 100px 24px 80px; }
  .trails-hero-heading { font-size: clamp(56px, 10vw, 120px); }
  .trails-hero-wordmark { display: block; width: clamp(280px, 40vw, 480px); max-width: 100%; height: auto; margin-bottom: 10px; }
  .trails-hero-stats { display: flex; flex-wrap: wrap; gap: 0; }
  .trails-stat-item { padding-right: 40px; margin-right: 40px; margin-bottom: 16px; }
  .trails-stat-item:not(:last-child) { border-right: 1px solid rgba(255,255,255,0.1); }

  @media (max-width: 1023px) {
    .trails-hero { padding: 80px 20px 60px; }
  }

  @media (max-width: 767px) {
    .trails-hero { padding: 72px 16px 52px; }
    .trails-hero-heading { font-size: clamp(44px, 14vw, 72px); }
    .trails-hero-wordmark { width: clamp(220px, 62vw, 320px); }
    .trails-hero-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
    .trails-stat-item { padding-right: 0; margin-right: 0; border-right: none !important; padding-bottom: 20px; }
    .trails-stat-item:nth-child(odd) { padding-right: 20px; }
  }
`

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TrailsPage() {
  return (
    <main style={{ background: '#F8F7F5', minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <style>{STYLES}</style>

      {/* ── Hero (unchanged) ──────────────────────────────────────────────── */}
      <section className="trails-hero" style={{ background: '#080D1A', position: 'relative', overflow: 'hidden' }}>
        {/* Maharaja backdrop. next/image serves an AVIF/WebP transform of the 2 MB
            PNG, decoded once — and unlike the old blueprint layer there's no filter()
            or mix-blend-mode here, both of which force a per-pixel recomposite of a
            full-bleed element on every scroll frame. */}
        <Image
          src="/hero-maharaja-trails.png"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center', opacity: 0.4, pointerEvents: 'none', userSelect: 'none' }}
        />
        {/* Dark wash so the white headline stays legible over the art. */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,13,26,0.55) 0%, rgba(8,13,26,0.78) 55%, rgba(8,13,26,0.92) 100%)', pointerEvents: 'none' }} />
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
            {/* Gold Vistaar wordmark stands in for the "MAHARAJA" line; served as an
                optimized WebP/AVIF transform and sized responsively to sit over TRAILS. */}
            <Image
              className="trails-hero-wordmark"
              src="/fonts/hero-vistaar.png"
              alt="Vistaar"
              width={677}
              height={369}
              priority
              sizes="(max-width: 767px) 320px, 480px"
            />
            <span style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,0.25)' }}>TRAILS</span>
          </h1>

          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, maxWidth: 640, margin: '0 0 52px' }}>
            2,294 routes across 380-plus airports is a route database. These forty trails are what happens when you go through it by hand. Ten are chained itineraries — one leg&apos;s arrival airport is the next leg&apos;s departure, verified against the live network, with a suggested flight plan and departure times. The rest are hand-picked highlight reels: the routes that don&apos;t just fill a map, but tell you something about the network they&apos;re on.
          </p>

          <div className="trails-hero-stats" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 32 }}>
            {[
              { value: '40', label: 'Trails' },
              { value: '10', label: 'Chained Itineraries' },
              { value: '3', label: 'A380 Sectors' },
              { value: '51h', label: 'Longest Trail Block Time' },
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

      {/* ── Directory (split view) ────────────────────────────────────────── */}
      <TrailsDirectory />

      {/* ── Attribution ───────────────────────────────────────────────────── */}
      <section style={{ background: '#F1F5F9', borderTop: '1px solid #E2E8F0', padding: '24px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>
            Route data sourced live from the INVA network database; sequenced itineraries are verified leg-to-leg against it. Suggested departure times are curatorial, not scheduled data.
            INVA is not affiliated with Air India, Air India Express, Jet Airways, Vistara, Infinite Flight LLC, or any real-world carrier named above.
          </p>
        </div>
      </section>
    </main>
  )
}
