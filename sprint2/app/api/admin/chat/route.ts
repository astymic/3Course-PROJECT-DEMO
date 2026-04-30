import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

function requireAdmin(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    const payload = token ? verifyToken(token) : null
    return payload?.role === 'admin' ? payload : null
}

// GET /api/admin/chat — list all sessions
export async function GET(request: NextRequest) {
    if (!requireAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const sessions = await prisma.chatSession.findMany({
        include: {
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
            _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(sessions)
}
