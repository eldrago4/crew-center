import Link from 'next/link'

export const metadata = {
  title: "You're flying solo here · Indian Virtual",
  robots: { index: false, follow: false },
}

// Self-contained, dependency-free 404 (no Chakra, no Tailwind runtime) so it renders
// cheaply and identically regardless of app config. Root-scoped on purpose: an
// unmatched /crew/* URL falls through here in the bare root layout, skipping
// CrewProviders/auth() rather than paying for crew chrome on a dead link.
//
// Dark/light: this page is reachable from both the always-light public site and the
// toggleable /crew app, so it can't hardcode one theme. It stays a server component
// and switches purely in CSS off the `dark` class the root layout's parse-time script
// already puts on <html> — both WebPs render, the inactive one is display:none.

// Same Discord DM used by the "Need help?" apply-flow contact card
// (src/components/apply/NeedHelp.jsx) — kept as a literal here so this page has zero
// component/import dependencies.
const REPORT_ISSUE_URL = 'https://discord.com/users/433143285847031838'

const css = `
  .nf-root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    /* 20% above center: shrink the centering region from the bottom so the block's
       midpoint lands ~30vh from the top instead of 50vh. Degrades to a scroll (not a
       clip) on short viewports. */
    padding: 24px 20px 40vh;
    box-sizing: border-box;
    background: #f8f9ff;
    color: #0d1c2e;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    transition: background-color .2s ease;
  }
  html.dark .nf-root { background: #000000; color: #e5e7eb; }

  .nf-inner { max-width: 760px; width: 100%; text-align: center; display: flex; flex-direction: column; align-items: center; }

  /* Both WebPs render; CSS picks one based on the <html> class the theme script sets,
     so no client JS/hydration is needed to show the right one. Real corner colors were
     sampled — light is white (#fff), dark is black (#000) — matched to
     .nf-root's background above so the image blends in with no visible seam. */
  .nf-graphic { width: clamp(280px, 62vw, 620px); height: auto; margin-bottom: 32px; user-select: none; }
  .nf-graphic-dark { display: none; }
  html.dark .nf-graphic-light { display: none; }
  html.dark .nf-graphic-dark { display: block; }

  .nf-title {
    font-family: 'Hanken Grotesk', system-ui, sans-serif;
    font-weight: 700; letter-spacing: -0.02em; color: #000000;
    font-size: 32px; line-height: 40px;
    margin: 0 auto 24px; max-width: 512px;
  }
  html.dark .nf-title { color: #ffffff; }

  .nf-body {
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 400; font-size: 18px; line-height: 28px; color: #45464d;
    margin: 0 auto 40px; max-width: 448px;
  }
  html.dark .nf-body { color: #a3a3ad; }

  .nf-cta { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; }
  .nf-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: #000000; color: #ffffff; text-decoration: none;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-weight: 500; font-size: 13px; line-height: 16px; letter-spacing: 0.05em;
    padding: 16px 32px; border-radius: 999px;
    box-shadow: 0 1px 2px rgba(13, 28, 46, 0.08);
    transition: transform .3s ease, background-color .3s ease;
  }
  .nf-btn:hover { background: #131b2e; transform: scale(1.05); }
  html.dark .nf-btn { background: #ffffff; color: #000000; }
  html.dark .nf-btn:hover { background: #d5e3fc; }

  .nf-report {
    margin-top: 20px;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 13px; color: #76777d; text-decoration: none;
  }
  .nf-report:hover { color: #006591; text-decoration: underline; }
  html.dark .nf-report { color: #767c8c; }
  html.dark .nf-report:hover { color: #89ceff; }

  @media (min-width: 768px) {
    .nf-root { padding-left: 64px; padding-right: 64px; }
    .nf-title { font-size: 48px; line-height: 56px; }
    .nf-cta { flex-direction: row; }
  }
`

export default function NotFound() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@700&family=Inter:wght@400&family=JetBrains+Mono:wght@500&display=swap"
      />
      <style>{css}</style>

      <main className="nf-root">
        <div className="nf-inner">
          {/* Graphic — light/dark PNGs, CSS-swapped */}
          <img className="nf-graphic nf-graphic-light" src="/error/404light.webp" alt="" aria-hidden="true" />
          <img className="nf-graphic nf-graphic-dark" src="/error/404dark.webp" alt="" aria-hidden="true" />

          {/* Text Content */}
          <h1 className="nf-title">You&apos;re flying solo here.</h1>
          <p className="nf-body">
            We can&apos;t find the page you&apos;re looking for. It might have changed
            course or taken an early retirement.
          </p>

          {/* Call to Action */}
          <div className="nf-cta">
            <Link href="/" className="nf-btn">Back to Home Base</Link>
          </div>

          <a
            className="nf-report"
            href={REPORT_ISSUE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Think this is a bug? Report it on Discord →
          </a>
        </div>
      </main>
    </>
  )
}
