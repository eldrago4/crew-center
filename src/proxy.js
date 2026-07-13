export { proxyAuth as proxy } from "@/auth"

// Only run on crew pages, where the rolling session cookie needs refreshing.
// API routes authenticate themselves via auth()/requireUser, and public pages
// don't need a session — running here site-wide burns fluid CPU for nothing.
export const config = {
  matcher: ['/crew/:path*'],
}
