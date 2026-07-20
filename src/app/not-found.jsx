import Link from 'next/link'

export const metadata = {
  title: "You're flying solo here · Indian Virtual",
  robots: { index: false, follow: false },
}

// Self-contained, dependency-free 404 (no Chakra, no Tailwind runtime) so it renders
// cheaply and identically regardless of app config. Root-scoped on purpose: an
// unmatched /crew/* URL falls through here in the bare root layout, skipping
// CrewProviders/auth() rather than paying for crew chrome on a dead link.

// Placeholder graphic above the heading — swap the src for real art later.
const placeholderSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='190' viewBox='0 0 260 190'>
  <rect width='260' height='190' rx='22' fill='#e6eeff'/>
  <g fill='none' stroke='#9aa3bd' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'>
    <rect x='70' y='55' width='120' height='90' rx='12'/>
    <path d='M84 130 L114 100 L140 122'/>
    <path d='M136 114 L154 100 L178 124'/>
  </g>
  <circle cx='104' cy='84' r='9' fill='#9aa3bd'/>
</svg>`
const placeholder = 'data:image/svg+xml,' + encodeURIComponent(placeholderSvg)

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
  }
  .nf-inner { max-width: 672px; width: 100%; text-align: center; display: flex; flex-direction: column; align-items: center; }
  .nf-graphic { width: clamp(180px, 42vw, 260px); height: auto; margin-bottom: 32px; user-select: none; }
  .nf-title {
    font-family: 'Hanken Grotesk', system-ui, sans-serif;
    font-weight: 700; letter-spacing: -0.02em; color: #000000;
    font-size: 32px; line-height: 40px;
    margin: 0 auto 24px; max-width: 512px;
  }
  .nf-body {
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 400; font-size: 18px; line-height: 28px; color: #45464d;
    margin: 0 auto 40px; max-width: 448px;
  }
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
          {/* Graphic */}
          <img className="nf-graphic" src={placeholder} alt="" aria-hidden="true" />

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
        </div>
      </main>
    </>
  )
}
