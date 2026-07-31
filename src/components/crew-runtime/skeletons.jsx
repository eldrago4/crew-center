// Plain-CSS placeholders for the crew app's three client-only boundaries.
//
// These are the ONLY thing the Worker renders for a /crew/* request, so they must
// stay free of Chakra (and of anything that drags Emotion into the server module
// graph) — importing a single Chakra component here would re-introduce the
// cold-start cost the boundaries exist to remove. Theme comes from the `dark`
// class the root layout's parse-time script sets before paint, so one markup
// serves both colour modes.

const SHARED_CSS = `
  .crew-sk { --crew-sk-bg: #fff; --crew-sk-line: rgba(0,0,0,0.07); --crew-sk-accent: #006591; }
  html.dark .crew-sk { --crew-sk-bg: #111; --crew-sk-line: rgba(255,255,255,0.08); --crew-sk-accent: #89ceff; }
  .crew-sk-block { background: var(--crew-sk-line); border-radius: 10px; animation: crew-sk-pulse 1.4s ease-in-out infinite; }
  @keyframes crew-sk-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.45 } }
  @keyframes crew-sk-spin { to { transform: rotate(360deg) } }
`

// Boundary 1 — the providers. Shown for a full page load of any /crew route
// (including the login page, which has no chrome), so it stays neutral: a spinner
// on the themed background, nothing that presumes a nav or a sidebar.
export function ShellSkeleton() {
  return (
    <div className="crew-sk crew-sk-shell">
      <div className="crew-sk-spinner" aria-label="Loading" />
      <style>{`
        ${SHARED_CSS}
        .crew-sk-shell {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background: var(--crew-sk-bg);
        }
        .crew-sk-spinner {
          width: 36px; height: 36px; border-radius: 50%;
          border: 3px solid var(--crew-sk-line); border-top-color: var(--crew-sk-accent);
          animation: crew-sk-spin 0.8s linear infinite;
        }
      `}</style>
    </div>
  )
}

// Boundary 2 — the chrome (nav + sidebar). Mirrors the space ResponsiveCrewLayout
// reserves (60px top bar, 250px sidebar on md+) so the real chrome drops in
// without shifting anything.
export function ChromeSkeleton() {
  return (
    <div className="crew-sk crew-sk-chrome">
      <div className="crew-sk-topbar" />
      <div className="crew-sk-side" />
      <div className="crew-sk-body">
        <PageSkeleton />
      </div>
      <style>{`
        ${SHARED_CSS}
        .crew-sk-chrome { min-height: 100vh; background: var(--crew-sk-bg); }
        .crew-sk-topbar { position: fixed; top: 0; left: 0; width: 100vw; height: 60px; background: var(--crew-sk-line); z-index: 20; }
        .crew-sk-side { display: none; }
        .crew-sk-body { padding-top: 8.5em; }
        @media (min-width: 48em) {
          .crew-sk-side { display: block; position: fixed; left: 0; top: 60px; width: 250px; height: calc(100vh - 60px); background: var(--crew-sk-line); z-index: 10; }
          .crew-sk-body { padding-top: 60px; padding-left: 250px; padding-right: 1rem; }
        }
      `}</style>
    </div>
  )
}

// Boundary 3 — the page itself. A few bars sized like the cards most crew pages
// open with; deliberately generic so every route can share one chunk-free
// fallback.
export function PageSkeleton() {
  return (
    <div className="crew-sk crew-sk-page">
      <div className="crew-sk-block" style={{ height: 44, maxWidth: 520 }} />
      <div className="crew-sk-block" style={{ height: 160 }} />
      <div className="crew-sk-block" style={{ height: 220 }} />
      <style>{`
        ${SHARED_CSS}
        .crew-sk-page { display: flex; flex-direction: column; gap: 1.5rem; padding: 1rem; }
      `}</style>
    </div>
  )
}

export default ShellSkeleton
