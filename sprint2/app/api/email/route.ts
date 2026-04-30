import { NextRequest, NextResponse } from 'next/server'

// Email templates
function orderConfirmationTemplate(order: {
    id: number; customerName: string; total: number
    deliveryMethod: string; npCity: string; npWarehouse: string
    address: string; paymentMethod: string; estimatedDelivery?: string
    items: { name: string; size: number; quantity: number; price: number }[]
}) {
    const delivery = order.deliveryMethod === 'nova_poshta'
        ? `📦 Нова Пошта: ${order.npCity}, ${order.npWarehouse}`
        : `🚴 Кур'єр: ${order.address}${order.estimatedDelivery ? ` (орієнтовно ${order.estimatedDelivery})` : ''}`

    const payment = order.paymentMethod === 'cash_on_delivery'
        ? '📬 Накладений платіж (оплата при отриманні)\n⚠️ Не забудьте підготувати готівку при отриманні!'
        : '💳 LiqPay (оплата карткою)'

    const itemsList = order.items
        .map(i => `  • ${i.name}, р.${i.size} ×${i.quantity} — ${(i.price * i.quantity).toLocaleString('uk-UA')} ₴`)
        .join('\n')

    return {
        subject: `LiLu — підтвердження замовлення №${order.id}`,
        text: `
Дякуємо за замовлення у LiLu! 👟

━━━━━━━━━━━━━━━━━━━━━━━
Замовлення №${order.id}
━━━━━━━━━━━━━━━━━━━━━━━

Ваші товари:
${itemsList}

Разом: ${order.total.toLocaleString('uk-UA')} ₴

📍 Доставка: ${delivery}

💳 Оплата: ${payment}

━━━━━━━━━━━━━━━━━━━━━━━
З повагою, команда LiLu
lilu-shoes.com.ua
    `.trim(),
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { type, to, order } = body

        if (!to || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        let template: { subject: string; text: string }

        if (type === 'order_confirmation') {
            template = orderConfirmationTemplate(order)
        } else {
            return NextResponse.json({ error: 'Unknown email type' }, { status: 400 })
        }

        // In production — use nodemailer / SendGrid / Resend here
        // For demo: log to console and return success
        console.log('\n📧 ═══════════════════════════════════════')
        console.log(`📧 EMAIL TO: ${to}`)
        console.log(`📧 SUBJECT: ${template.subject}`)
        console.log(`📧 BODY:\n${template.text}`)
        console.log('📧 ═══════════════════════════════════════\n')

        // Simulate slight delay
        await new Promise(r => setTimeout(r, 100))

        return NextResponse.json({ ok: true, preview: template })
    } catch (err) {
        console.error('Email error:', err)
        return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
    }
}
