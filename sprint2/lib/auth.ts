import { createHmac } from 'crypto'

const SECRET = process.env.AUTH_SECRET ?? 'lilu-dev-secret-CHANGE-IN-PRODUCTION'
const TOKEN_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

// ── Password ─────────────────────────────────────────────
export function hashPassword(password: string): string {
    return createHmac('sha256', SECRET).update(password).digest('hex')
}

export function checkPassword(password: string, hash: string): boolean {
    return hashPassword(password) === hash
}

// ── Token ─────────────────────────────────────────────────
// Format (base64): userId:role:expires:signature
export function createToken(userId: number, role: string): string {
    const expires = Date.now() + TOKEN_TTL
    const payload = `${userId}:${role}:${expires}`
    const sig = createHmac('sha256', SECRET).update(payload).digest('hex')
    return Buffer.from(`${payload}:${sig}`).toString('base64url')
}

export type TokenPayload = { userId: number; role: string }

export function verifyToken(token: string): TokenPayload | null {
    try {
        const decoded = Buffer.from(token, 'base64url').toString('utf8')
        const lastColon = decoded.lastIndexOf(':')
        if (lastColon === -1) return null
        const payload = decoded.slice(0, lastColon)
        const sig = decoded.slice(lastColon + 1)

        const expectedSig = createHmac('sha256', SECRET).update(payload).digest('hex')
        if (sig !== expectedSig) return null

        const parts = payload.split(':')
        if (parts.length !== 3) return null
        const [userId, role, expiresStr] = parts

        if (parseInt(expiresStr) < Date.now()) return null
        return { userId: parseInt(userId), role }
    } catch {
        return null
    }
}

export const COOKIE_NAME = 'lilu_auth'
export const COOKIE_OPTS = {
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
}
