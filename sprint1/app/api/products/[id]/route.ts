import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const product = await prisma.product.findUnique({
        where: { id: parseInt(id) },
        include: { category: true, sizes: { orderBy: { size: 'asc' } } },
    })
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(product)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const body = await req.json()
    const { name, description, price, material, color, imageUrl, categoryId, isActive, sizes } = body

    // Update product fields
    const product = await prisma.product.update({
        where: { id: parseInt(id) },
        data: {
            name, description,
            price: parseFloat(price),
            material, color,
            imageUrl,
            categoryId: parseInt(categoryId),
            isActive,
        },
    })

    // Update stock per size
    if (sizes) {
        for (const s of sizes as { size: number; quantity: number }[]) {
            await prisma.productSize.upsert({
                where: { id: (await prisma.productSize.findFirst({ where: { productId: parseInt(id), size: s.size } }))?.id ?? 0 },
                update: { quantity: s.quantity },
                create: { productId: parseInt(id), size: s.size, quantity: s.quantity },
            })
        }
    }

    const updated = await prisma.product.findUnique({
        where: { id: parseInt(id) },
        include: { category: true, sizes: { orderBy: { size: 'asc' } } },
    })
    return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    await prisma.product.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ success: true })
}
