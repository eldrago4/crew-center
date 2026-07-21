'use client'

// Root error boundary for any page/segment that doesn't define its own. Renders
// inside the root layout only (not the (main)/(crew) group layouts), so it stays
// cheap and dependency-free (no Chakra, no Tailwind runtime). global-error.jsx
// handles failures of the root layout itself; this handles everything below it.

// Same Discord DM used by the "Need help?" apply-flow contact card
// (src/components/apply/NeedHelp.jsx) — kept as a literal so this page has zero
// component/import dependencies.
const REPORT_ISSUE_URL = 'https://discord.com/users/433143285847031838'

const css = `
  .err-root {
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
    text-align: center;
  }
  /* 500.webp is a wide (~2:1) transparent illustration, not a small icon — sized to
     match the scale of the 404 page's hero graphics. */
  .err-graphic { width: clamp(320px, 78vw, 760px); height: auto; margin-bottom: 32px; user-select: none; }
  .err-text { max-width: 512px; }
  .err-title {
    font-family: 'Hanken Grotesk', system-ui, sans-serif;
    font-weight: 700; letter-spacing: -0.02em; color: #000000;
    font-size: 32px; line-height: 40px;
    margin: 0 0 16px;
  }
  .err-body {
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 400; font-size: 18px; line-height: 28px; color: #45464d;
    margin: 0;
  }
  .err-cta {
    margin-top: 40px;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
  }
  .err-btn {
    font-family: 'Hanken Grotesk', system-ui, sans-serif;
    font-weight: 600; font-size: 16px; line-height: 24px;
    padding: 12px 32px; border-radius: 8px; cursor: pointer;
    transition: background-color .2s ease, border-color .2s ease, color .2s ease;
    width: 100%;
  }
  .err-btn-primary {
    background: #000000; color: #ffffff; border: none;
  }
  .err-btn-primary:hover { background: #006591; }
  .err-btn-secondary {
    background: transparent; color: #000000; border: 1px solid #000000;
    text-decoration: none; display: inline-block;
  }
  .err-btn-secondary:hover { background: #eff4ff; border-color: #006591; color: #006591; }
  .err-code {
    margin-top: 64px;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-weight: 500; font-size: 13px; line-height: 16px; letter-spacing: 0.05em;
    color: #76777d; background: #d5e3fc;
    padding: 4px 12px; border-radius: 999px;
    display: inline-block;
  }
  .err-home {
    margin-top: 20px;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 13px; color: #76777d; text-decoration: none;
    display: block;
  }
  .err-home:hover { color: #006591; text-decoration: underline; }

  @media (min-width: 640px) {
    .err-cta { flex-direction: row; gap: 24px; }
    .err-btn { width: auto; }
  }
  @media (min-width: 768px) {
    .err-root { padding-left: 64px; padding-right: 64px; }
    .err-title { font-size: 48px; line-height: 56px; }
  }
`

export default function Error({ error, reset }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap"
      />
      <style>{css}</style>

      <main className="err-root">
        <img className="err-graphic" src="/error/500.webp" alt="" aria-hidden="true" />

        <div className="err-text">
          <h1 className="err-title">Signal Lost.</h1>
          <p className="err-body">
            We&apos;ve lost connection with our flight systems. Our technicians are
            recalibrating the instruments.
          </p>
        </div>

        <div className="err-cta">
          <button className="err-btn err-btn-primary" onClick={() => reset()}>
            Retry Flight
          </button>
          <a
            className="err-btn err-btn-secondary"
            href={REPORT_ISSUE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact Dispatch
          </a>
        </div>

        <a className="err-home" href="/">Back to Home Base</a>

        <span className="err-code">Error Code: 500</span>
      </main>
    </>
  )
}
