// Guard worker — sits in FRONT of the crew-center (OpenNext) worker via a service
// binding, so that a Cloudflare 1102 ("Worker exceeded resource limits") never
// reaches the visitor as Cloudflare's branded error page.
//
// How it works: every request is proxied to crew-center via env.MAIN.fetch().
// When crew-center is killed mid-render (1102 / OOM) or throws an unhandled
// exception, the service-binding call REJECTS here — verified empirically: a
// downstream 1102 surfaces to the caller as `Worker exceeded CPU time limit.`.
// We catch it and serve our own dark fallback (with a reload button) instead.
//
// Why proxy everything (assets included) rather than give the guard its own
// ASSETS binding: an assets snapshot on the guard would go stale on every
// crew-center redeploy (hashed filenames change) and 404 the app. Proxying keeps
// crew-center the single source of truth for assets. At this app's traffic
// (~1k requests/day) the extra guard invocation per request is negligible.
//
// The fallback HTML is INLINE (not read from an asset) on purpose: when
// crew-center is down we can't fetch anything from it, so the guard must be able
// to answer entirely on its own. Keep it in sync with public/1102.html.

const FALLBACK_HTML = `<!doctype html>
<html lang="en"><head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Signal Lost · Indian Virtual</title>
<meta name="robots" content="noindex" />
<style>
  *{box-sizing:border-box}html,body{margin:0;padding:0}:root{color-scheme:dark}
  body{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
    padding:24px 20px 22vh;background:#0b1020;color:#e6ebf5;
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center}
  .glyph{width:56px;height:56px;margin-bottom:28px;color:#f43f5e;opacity:.9}
  .title{font-weight:700;letter-spacing:-.02em;font-size:clamp(28px,6vw,44px);line-height:1.15;margin:0 0 14px;color:#fff}
  .body{font-size:clamp(15px,3.6vw,18px);line-height:1.55;color:#9aa4b8;margin:0 auto;max-width:30rem}
  .btn{font:inherit;font-weight:600;font-size:16px;margin-top:34px;padding:12px 34px;border-radius:10px;
    cursor:pointer;border:0;background:#e11d48;color:#fff;transition:background-color .18s}
  .btn:hover{background:#be123c}
  .home{display:block;font-size:13px;color:#6b7280;text-decoration:none;margin-top:18px}
  .code{margin-top:56px;font-family:ui-monospace,Menlo,monospace;font-size:12px;letter-spacing:.06em;
    color:#6b7280;background:rgba(255,255,255,.05);padding:4px 12px;border-radius:999px}
</style></head><body>
  <svg class="glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
  <h1 class="title">Signal Lost.</h1>
  <p class="body">Our flight systems are handling heavy traffic right now and couldn&rsquo;t load this page. Give it a moment, then try again.</p>
  <button class="btn" onclick="location.reload()">Reload the page</button>
  <a class="home" href="/crew">Back to the crew center</a>
  <span class="code">Error 1102</span>
</body></html>`;

function fallbackResponse() {
  return new Response(FALLBACK_HTML, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "retry-after": "5",
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    // No MAIN binding configured (misdeploy) → don't hard-fail; show the fallback.
    if (!env.MAIN) return fallbackResponse();
    try {
      return await env.MAIN.fetch(request);
    } catch (err) {
      // crew-center was killed by a 1102/OOM or threw an unhandled exception.
      console.error("guard: upstream failed:", err && err.message);
      return fallbackResponse();
    }
  },
};
