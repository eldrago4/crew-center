'use client'

// Root error boundary for any page/segment that doesn't define its own. Renders
// inside the root layout only (not the (main)/(crew) group layouts), so it stays
// cheap and dependency-free. global-error.jsx handles failures of the root layout
// itself; this handles everything below it.
export default function Error({ error, reset }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '18px',
      background: '#0b1020', color: '#e5e7eb', textAlign: 'center', padding: '24px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ fontSize: '13px', letterSpacing: '0.35em', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
        Indian Virtual
      </div>
      <div style={{ fontSize: '56px', lineHeight: 1 }}>✈️</div>
      <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
        Something went wrong
      </h1>
      <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, maxWidth: '400px', lineHeight: 1.7 }}>
        We hit unexpected turbulence loading this page. Try again — if it keeps
        happening, let a staff member know.
      </p>
      <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => reset()} style={{
          background: '#2b4bee', color: '#fff', padding: '11px 22px', borderRadius: '999px',
          fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer',
        }}>
          Try again
        </button>
        <a href="/" style={{
          border: '1px solid #334155', color: '#e5e7eb', padding: '11px 22px', borderRadius: '999px',
          fontSize: '14px', fontWeight: 700, textDecoration: 'none',
        }}>
          Back home
        </a>
      </div>
    </div>
  )
}
