import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'

const PRIVATE_KEY = process.env.LIQPAY_PRIVATE_KEY ?? ''

// LiqPay sends a POST to this URL after payment
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const data = formData.get('data') as string
        const signature = formData.get('signature') as string

        // Verify signature
        const expected = createHash('sha1')
            .update(PRIVATE_KEY + data + PRIVATE_KEY)
            .digest('base64')

        if (expected !== signature) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        const payload = JSON.parse(Buffer.from(data, 'base64').toString('utf8'))
        const orderId = parseInt(payload.order_id?.split('_')[1] ?? '0')
        const status = payload.status // 'success' | 'failure' | 'sandbox'

        if (orderId) {
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: status === 'success' || status === 'sandbox' ? 'paid' : 'failed',
                    status: status === 'success' || status === 'sandbox' ? 'processing' : 'new',
                    liqpayOrderId: payload.order_id,
                },
            })
        }

        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error('LiqPay callback error:', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
