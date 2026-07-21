'use client'

// Catches errors thrown by the ROOT layout itself. It replaces the entire document,
// so it must render its own <html>/<body> and cannot rely on any provider, font, or
// CSS from the app. Kept fully self-contained with inline styles.

// Same Discord DM used by the "Need help?" apply-flow contact card
// (src/components/apply/NeedHelp.jsx) — kept as a literal so this page has zero
// component/import dependencies (it must survive even if the rest of the app is broken).
const REPORT_ISSUE_URL = 'https://discord.com/users/433143285847031838'

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '18px',
          background: '#0b1020', color: '#e5e7eb', textAlign: 'center', padding: '24px',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}>
          <div style={{ fontSize: '13px', letterSpacing: '0.35em', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
            Indian Virtual
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            The site hit a snag
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, maxWidth: '400px', lineHeight: 1.7 }}>
            Something failed while loading the app. Reloading usually fixes it.
          </p>
          <button onClick={() => reset()} style={{
            background: '#2b4bee', color: '#fff', padding: '11px 22px', borderRadius: '999px',
            fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: '4px',
          }}>
            Reload
          </button>
          <a
            href={REPORT_ISSUE_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none', marginTop: '4px' }}
          >
            Report this issue on Discord →
          </a>
        </div>
      </body>
    </html>
  )
}
