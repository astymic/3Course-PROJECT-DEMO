import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

// POST /api/chat/sessions — create new chat session
export async function POST(request: NextRequest) {
    const { guestName, guestEmail } = await request.json()
    const token = randomUUID()
    const session = await prisma.chatSession.create({
        data: {
            token,
            guestName: guestName || 'Гість',
            guestEmail: guestEmail || '',
        },
    })
    return NextResponse.json({ id: session.id, token })
}
