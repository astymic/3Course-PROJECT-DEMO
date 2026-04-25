import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const phone = request.nextUrl.searchParams.get('phone') ?? ''

    if (!phone) return NextResponse.json([])

    // Normalize phone: strip spaces, dashes for flexible matching
    const normalized = phone.replace(/[\s\-\(\)]/g, '')

    const orders = await prisma.order.findMany({
        where: {
            OR: [
                { customerPhone: { contains: normalized } },
                { customerPhone: phone },
            ],
        },
        include: {
            items: {
                include: { product: { select: { name: true, color: true } } },
            },
        },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(orders)
}
