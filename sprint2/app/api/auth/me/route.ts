import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export async function GET(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) return NextResponse.json(null)

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json(null)

    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, name: true, phone: true, email: true, role: true, createdAt: true },
    })

    return NextResponse.json(user)
}

export async function DELETE() {
    const res = NextResponse.json({ ok: true })
    res.cookies.delete(COOKIE_NAME)
    return res
}
