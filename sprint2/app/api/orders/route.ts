import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            customerName, customerPhone, customerEmail,
            deliveryMethod, paymentMethod,
            npCity, npWarehouse, npWarehouseRef, address, notes,
            items,
        } = body

        if (!customerName || !customerPhone || !items?.length) {
            return NextResponse.json({ error: 'Відсутні обов\'язкові поля' }, { status: 400 })
        }

        // Try to link order to logged-in user
        const token = request.cookies.get(COOKIE_NAME)?.value
        const authPayload = token ? verifyToken(token) : null
        const userId = authPayload?.userId ?? null

        const total = items.reduce((acc: number, i: { price: number; quantity: number }) =>
            acc + i.price * i.quantity, 0)

        const order = await prisma.order.create({
            data: {
                userId,                                              // ← link to user if logged in
                customerName, customerPhone, customerEmail: customerEmail ?? '',
                deliveryMethod, paymentMethod,
                npCity: npCity ?? '', npWarehouse: npWarehouse ?? '',
                npWarehouseRef: npWarehouseRef ?? '',
                address: address ?? '', notes: notes ?? '',
                total,
                items: {
                    create: items.map((i: { productId: number; size: number; quantity: number; price: number }) => ({
                        productId: i.productId,
                        size: i.size,
                        quantity: i.quantity,
                        price: i.price,
                    })),
                },
            },
            include: { items: { include: { product: true } } },
        })

        // Decrement stock
        for (const item of items) {
            await prisma.productSize.updateMany({
                where: { productId: item.productId, size: item.size },
                data: { quantity: { decrement: item.quantity } },
            })
        }

        return NextResponse.json(order, { status: 201 })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    const status = request.nextUrl.searchParams.get('status') ?? ''
    const payment = request.nextUrl.searchParams.get('payment') ?? ''

    const orders = await prisma.order.findMany({
        where: {
            ...(status ? { status } : {}),
            ...(payment ? { paymentMethod: payment } : {}),
        },
        include: { items: { include: { product: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(orders)
}
