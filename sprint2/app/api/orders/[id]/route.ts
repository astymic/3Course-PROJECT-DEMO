import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const order = await prisma.order.findUnique({
        where: { id: parseInt(id) },
        include: { items: { include: { product: { select: { name: true, color: true } } } } },
    })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(order)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const body = await request.json()
    const order = await prisma.order.update({
        where: { id: parseInt(id) },
        data: { status: body.status, paymentStatus: body.paymentStatus },
    })
    return NextResponse.json(order)
}
