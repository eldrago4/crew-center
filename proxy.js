import { NextResponse } from 'next/server'

export function proxy(request) {
    const { pathname } = request.nextUrl

    // Redirect /crew/* to /maintenance
    if (pathname.startsWith('/crew/')) {
        return NextResponse.rewrite(new URL('/maintenance', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: '/crew/:path*',
}
