import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// GET /api/chat/sessions/[id]/messages?token=...&after=ISO_DATE
export async function GET(request: NextRequest, { params }: Params) {
    const { id } = await params
    const token = request.nextUrl.searchParams.get('token') ?? ''
    const after = request.nextUrl.searchParams.get('after')

    const session = await prisma.chatSession.findFirst({
        where: { id: parseInt(id), token },
    })
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const messages = await prisma.chatMessage.findMany({
        where: {
            sessionId: parseInt(id),
            ...(after ? { createdAt: { gt: new Date(after) } } : {}),
        },
        orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ messages, status: session.status })
}

// POST /api/chat/sessions/[id]/messages — user sends a message
export async function POST(request: NextRequest, { params }: Params) {
    const { id } = await params
    const { token, text } = await request.json()

    const session = await prisma.chatSession.findFirst({
        where: { id: parseInt(id), token },
    })
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session.status === 'closed') return NextResponse.json({ error: 'Closed' }, { status: 400 })

    const msg = await prisma.chatMessage.create({
        data: { sessionId: parseInt(id), text, sender: 'user' },
    })
    // touch updatedAt so admin dashboard sorts by activity
    await prisma.chatSession.update({ where: { id: parseInt(id) }, data: { updatedAt: new Date() } })
    return NextResponse.json(msg)
}
