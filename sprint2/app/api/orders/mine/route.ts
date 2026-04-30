import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export async function GET(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    const payload = token ? verifyToken(token) : null
    if (!payload) return NextResponse.json([], { status: 401 })

    const orders = await prisma.order.findMany({
        where: { userId: payload.userId },
        include: {
            items: { include: { product: { select: { name: true, color: true } } } },
        },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(orders)
}
