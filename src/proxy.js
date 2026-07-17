import { NextResponse } from 'next/server'
import { proxyAuth } from "@/auth"
import { isQuotaFlagRaised } from '@/lib/maintenance-flag'

// Kill switch: set MAINTENANCE_MODE=1 in the Vercel env and redeploy to take the
// crew app offline. /maintenance imports no db/auth, so it still renders when the
// database is the thing that's broken.
//
// This has to live in src/proxy.js. Next resolves the proxy relative to the app
// directory (rootDir = <appDir>/.., and appDir is src/app here), so src/proxy.js
// is the only one it ever loads. The root-level proxy.js used to hold this same
// switch and was never loaded by anything — uncommenting it did nothing, which is
// not what you want to find out while trying to take the site down.
//
// Read per-request, not at module scope, so a warm instance can't go on serving
// the pre-flip value.
function maintenance(request) {
  // Rewrite rather than redirect: the URL stays put, so flipping back doesn't
  // leave anyone holding a cached 3xx to /maintenance.
  return NextResponse.rewrite(new URL('/maintenance', request.url))
}

export async function proxy(request, event) {
  // Manual switch first — it's free, and if you've deliberately taken the site
  // down we shouldn't spend a Redis read to confirm it.
  if (process.env.MAINTENANCE_MODE === '1') return maintenance(request)

  // Automatic: Neon has told us the project's quota is spent, so every page here
  // would fail its queries anyway. Cached per warm instance and fails open, so a
  // Redis problem can't black out a healthy site. src/db/client.js raises this.
  if (await isQuotaFlagRaised()) return maintenance(request)

  return proxyAuth(request, event)
}

// Only run on crew pages, where the rolling session cookie needs refreshing.
// API routes authenticate themselves via auth()/requireUser, and public pages
// don't need a session — running here site-wide burns fluid CPU for nothing.
export const config = {
  matcher: ['/crew/:path*'],
}
