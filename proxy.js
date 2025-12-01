import { NextResponse } from 'next/server'
import { auth } from "@/auth"

export function proxy(request) {
    const { pathname } = request.nextUrl

    // Redirect /crew and /crew/* to /maintenance
    // if (pathname === '/crew' || pathname.startsWith('/crew/')) {
     //    return NextResponse.rewrite(new URL('/maintenance', request.url))
  //   }

  //  return NextResponse.next()
// }

export const config = {
    matcher: '/crew/:path*',
}
