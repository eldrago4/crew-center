import Link from 'next/link'

export const metadata = {
  title: 'Page not found · Indian Virtual',
  robots: { index: false, follow: false },
}

// Root-level 404. Deliberately NOT placed inside (crew) so that unmatched /crew/*
// URLs fall through to here — rendered in the bare root layout, skipping
// CrewProviders/auth() — instead of paying for the crew chrome on a dead link.
// Dependency-free (no Chakra) so it stays a cheap static render.
export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '20px',
      background: '#0b1020', color: '#e5e7eb', textAlign: 'center', padding: '24px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ fontSize: '13px', letterSpacing: '0.35em', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
        Indian Virtual
      </div>
      <div style={{
        fontSize: 'clamp(72px, 18vw, 140px)', fontWeight: 900, lineHeight: 0.9,
        letterSpacing: '-0.04em',
        background: 'linear-gradient(90deg,#2b4bee,#ff6b35)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>
        404
      </div>
      <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
        This route isn&apos;t on our map
      </h1>
      <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, maxWidth: '380px', lineHeight: 1.7 }}>
        The page you&apos;re looking for has been moved, retired, or never existed.
      </p>
      <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" style={btnPrimary}>Back home</Link>
        <Link href="/crew/dashboard" style={btnGhost}>Crew Center</Link>
      </div>
    </div>
  )
}

const btnPrimary = {
  background: '#2b4bee', color: '#fff', padding: '11px 22px', borderRadius: '999px',
  fontSize: '14px', fontWeight: 700, textDecoration: 'none',
}
const btnGhost = {
  border: '1px solid #334155', color: '#e5e7eb', padding: '11px 22px', borderRadius: '999px',
  fontSize: '14px', fontWeight: 700, textDecoration: 'none',
}
