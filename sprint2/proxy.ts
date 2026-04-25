// Next.js 16: "proxy" replaces "middleware"
// Edge Runtime: cannot use Node.js 'crypto' — use Web Crypto API instead
import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'lilu_auth'
const SECRET = process.env.AUTH_SECRET ?? 'lilu-dev-secret-CHANGE-IN-PRODUCTION'

// Base64url → base64 conversion for atob
function b64url(str: string) {
    return str.replace(/-/g, '+').replace(/_/g, '/')
}

// Verify HMAC-SHA256 signature using Web Crypto (Edge-compatible)
async function verifyToken(token: string): Promise<{ userId: number; role: string } | null> {
    try {
        const decoded = atob(b64url(token))
        const lastColon = decoded.lastIndexOf(':')
        if (lastColon === -1) return null

        const payload = decoded.slice(0, lastColon)
        const hexSig = decoded.slice(lastColon + 1)

        const parts = payload.split(':')
        if (parts.length !== 3) return null
        const [userId, role, expiresStr] = parts
        if (parseInt(expiresStr) < Date.now()) return null

        // Import key for HMAC-SHA256 verification
        const enc = new TextEncoder()
        const keyMat = await crypto.subtle.importKey(
            'raw', enc.encode(SECRET),
            { name: 'HMAC', hash: 'SHA-256' },
            false, ['verify'],
        )

        // Convert hex signature → Uint8Array
        const sigBytes = new Uint8Array(
            hexSig.match(/.{2}/g)!.map(b => parseInt(b, 16))
        )

        const valid = await crypto.subtle.verify('HMAC', keyMat, sigBytes, enc.encode(payload))
        if (!valid) return null

        return { userId: parseInt(userId), role }
    } catch {
        return null
    }
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl
    const token = request.cookies.get(COOKIE_NAME)?.value

    const isAccount = pathname.startsWith('/account')
    const isAdmin = pathname.startsWith('/admin')

    if (!isAccount && !isAdmin) return NextResponse.next()

    if (!token) {
        const url = new URL('/login', request.url)
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
    }

    const payload = await verifyToken(token)

    if (!payload) {
        const res = NextResponse.redirect(new URL('/login?expired=1', request.url))
        res.cookies.delete(COOKIE_NAME)
        return res
    }

    if (isAdmin && payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/account/:path*', '/admin/:path*'],
}
