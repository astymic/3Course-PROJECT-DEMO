import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')   // slug
    const color = searchParams.get('color')
    const size = searchParams.get('size')        // e.g. "38"
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    const where: Record<string, unknown> = { isActive: true }

    if (category) where.category = { slug: category }
    if (color) where.color = color
    if (minPrice || maxPrice) {
        where.price = {}
        if (minPrice) (where.price as Record<string, number>).gte = parseFloat(minPrice)
        if (maxPrice) (where.price as Record<string, number>).lte = parseFloat(maxPrice)
    }
    if (size) {
        where.sizes = { some: { size: parseInt(size), quantity: { gt: 0 } } }
    }

    const products = await prisma.product.findMany({
        where,
        include: {
            category: true,
            sizes: { orderBy: { size: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { name, description, price, material, color, imageUrl, categoryId, sizes } = body

    const product = await prisma.product.create({
        data: {
            name, description, price: parseFloat(price), material, color,
            imageUrl: imageUrl || '/placeholder.jpg',
            categoryId: parseInt(categoryId),
            sizes: {
                create: (sizes as { size: number; quantity: number }[]).map(s => ({
                    size: s.size,
                    quantity: s.quantity,
                }))
            }
        },
        include: { sizes: true, category: true },
    })

    return NextResponse.json(product, { status: 201 })
}
