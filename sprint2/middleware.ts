import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/auth'

// Middleware runs on Edge Runtime — no crypto module
// We do a lightweight "token exists + not-expired" check.
// Full HMAC verification happens inside API routes / pages via lib/auth.ts.

function quickDecode(token: string): { userId: number; role: string; expires: number } | null {
    try {
        const decoded = Buffer.from(token, 'base64url').toString('utf8')
        const lastColon = decoded.lastIndexOf(':')
        const payload = decoded.slice(0, lastColon)
        const parts = payload.split(':')
        if (parts.length !== 3) return null
        return { userId: parseInt(parts[0]), role: parts[1], expires: parseInt(parts[2]) }
    } catch {
        return null
    }
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const token = request.cookies.get(COOKIE_NAME)?.value

    const isAccountRoute = pathname.startsWith('/account')
    const isAdminRoute = pathname.startsWith('/admin')

    if (!isAccountRoute && !isAdminRoute) return NextResponse.next()

    if (!token) {
        const url = new URL('/login', request.url)
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
    }

    const payload = quickDecode(token)

    if (!payload || payload.expires < Date.now()) {
        const res = NextResponse.redirect(new URL('/login?expired=1', request.url))
        res.cookies.delete(COOKIE_NAME)
        return res
    }

    if (isAdminRoute && payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/account/:path*', '/admin/:path*'],
}
