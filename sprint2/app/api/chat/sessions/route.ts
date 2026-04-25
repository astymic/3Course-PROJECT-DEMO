import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(request: NextRequest) {
    const { guestName, guestEmail } = await request.json()

    // Link to user account if logged in
    const token = request.cookies.get(COOKIE_NAME)?.value
    const payload = token ? verifyToken(token) : null
    const userId = payload?.userId ?? null

    const sessionToken = randomUUID()
    const session = await prisma.chatSession.create({
        data: {
            token: sessionToken,
            userId,
            guestName: guestName || 'Гість',
            guestEmail: guestEmail || '',
        },
    })
    return NextResponse.json({ id: session.id, token: sessionToken })
}

// GET /api/chat/sessions — user's own sessions (for account history tab)
export async function GET(request: NextRequest) {
    const authToken = request.cookies.get(COOKIE_NAME)?.value
    const payload = authToken ? verifyToken(authToken) : null
    if (!payload) return NextResponse.json([], { status: 401 })

    const sessions = await prisma.chatSession.findMany({
        where: { userId: payload.userId },
        include: {
            messages: { orderBy: { createdAt: 'asc' } },
            _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(sessions)
}
