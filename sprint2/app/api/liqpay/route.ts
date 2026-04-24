import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

const PUBLIC_KEY = process.env.LIQPAY_PUBLIC_KEY ?? 'sandbox_i72471433810'
const PRIVATE_KEY = process.env.LIQPAY_PRIVATE_KEY ?? 'sandbox_U4M4WoO9DsIZSDqIBfoVkxkNYhPZNKiKnxpH'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'

function sign(str: string): string {
    return createHash('sha1')
        .update(PRIVATE_KEY + str + PRIVATE_KEY)
        .digest('base64')
}

export async function POST(request: NextRequest) {
    const { orderId, amount, description } = await request.json()

    const params = {
        public_key: PUBLIC_KEY,
        version: '3',
        action: 'pay',
        amount: String(amount),
        currency: 'UAH',
        description: description ?? `Замовлення LiLu #${orderId}`,
        order_id: `lilu_${orderId}_${Date.now()}`,
        sandbox: '1', // ← remove in production
        result_url: `${APP_URL}/order/${orderId}?payment=success`,
        server_url: `${APP_URL}/api/liqpay/callback`,
        language: 'uk',
    }

    const data = Buffer.from(JSON.stringify(params)).toString('base64')
    const signature = sign(data)

    return NextResponse.json({ data, signature })
}
