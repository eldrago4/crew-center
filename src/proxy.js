import { NextResponse } from 'next/server'
import { proxyAuth } from "@/auth"
import { getSiteFlags } from '@/lib/maintenance-flag'

// Maintenance takes the crew app offline. Three sources, any of which turns it on:
//   - the switch on /crew/admin/server-config (Redis, MAINTENANCE_KEY)
//   - Neon's quota running out (Redis, QUOTA_FLAG_KEY; src/db/client.js raises it,
//     but only when there's no Supabase standby to move queries to instead)
//   - MAINTENANCE_MODE=1 in the Vercel env, for when Redis itself is the problem
// /maintenance imports no db/auth, so it still renders when the database is the
// thing that's broken.
//
// This has to live in src/proxy.js. Next resolves the proxy relative to the app
// directory (rootDir = <appDir>/.., and appDir is src/app here), so src/proxy.js
// is the only one it ever loads. The root-level proxy.js used to hold this same
// switch and was never loaded by anything — uncommenting it did nothing, which is
// not what you want to find out while trying to take the site down.
function maintenance(request) {
  // Rewrite rather than redirect: the URL stays put, so flipping back doesn't
  // leave anyone holding a cached 3xx to /maintenance.
  return NextResponse.rewrite(new URL('/maintenance', request.url))
}

// While the site is down, CEOs still get through — to end maintenance from the
// server console, and to check the site before reopening it. The sign-in page
// stays open so a CEO whose session lapsed can get back in; everyone else who
// signs in lands on the maintenance page as usual.
const holdForMaintenance = proxyAuth((request) => {
  if (request.auth?.user?.permissions?.includes('ceo')) return
  if (request.nextUrl.pathname === '/crew') return
  return maintenance(request)
})

export async function proxy(request, event) {
  // LAST-RESORT SWITCH — for when sign-in itself is broken (so nobody can reach
  // the server console) and the Vercel env can't be changed either. Uncomment,
  // commit and push: every /crew page goes to maintenance, CEOs included. Comment
  // it out again to reopen.
  // return maintenance(request)

  const forced = process.env.MAINTENANCE_MODE === '1'
  // Cached per warm instance and fails open, so a Redis problem can't black out
  // a healthy site.
  const { maintenance: manual, quota } = forced ? {} : await getSiteFlags()

  // Same session read as the plain path below, so the CEO check costs nothing extra.
  if (forced || manual || quota) return holdForMaintenance(request, event)

  return proxyAuth(request, event)
}

// Only run on crew pages, where the rolling session cookie needs refreshing.
// API routes authenticate themselves via auth()/requireUser, and public pages
// don't need a session — running here site-wide burns fluid CPU for nothing.
export const config = {
  matcher: ['/crew/:path*'],
}
