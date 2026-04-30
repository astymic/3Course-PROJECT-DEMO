import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

function requireAdmin(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    const payload = token ? verifyToken(token) : null
    return payload?.role === 'admin' ? payload : null
}

// GET /api/admin/chat/[id] — get full session with all messages
export async function GET(request: NextRequest, { params }: Params) {
    if (!requireAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params
    const after = request.nextUrl.searchParams.get('after')

    const session = await prisma.chatSession.findUnique({ where: { id: parseInt(id) } })
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const messages = await prisma.chatMessage.findMany({
        where: {
            sessionId: parseInt(id),
            ...(after ? { createdAt: { gt: new Date(after) } } : {}),
        },
        orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ session, messages })
}

// POST /api/admin/chat/[id] — admin sends a message
export async function POST(request: NextRequest, { params }: Params) {
    if (!requireAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params
    const { text } = await request.json()

    const msg = await prisma.chatMessage.create({
        data: { sessionId: parseInt(id), text, sender: 'admin' },
    })
    await prisma.chatSession.update({ where: { id: parseInt(id) }, data: { updatedAt: new Date() } })
    return NextResponse.json(msg)
}

// PUT /api/admin/chat/[id] — close session
export async function PUT(request: NextRequest, { params }: Params) {
    if (!requireAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params
    const { status } = await request.json()
    const session = await prisma.chatSession.update({
        where: { id: parseInt(id) },
        data: { status },
    })
    return NextResponse.json(session)
}
