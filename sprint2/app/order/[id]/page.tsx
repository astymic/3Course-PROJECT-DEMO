'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Order = {
    id: number; customerName: string; customerPhone: string
    deliveryMethod: string; npCity: string; npWarehouse: string; address: string
    paymentMethod: string; paymentStatus: string; status: string; total: number
    createdAt: string
    items: { id: number; size: number; quantity: number; price: number; product: { name: string; color: string } }[]
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    new: { label: 'Нове', color: 'bg-blue-100 text-blue-700' },
    processing: { label: 'В обробці', color: 'bg-amber-100 text-amber-700' },
    shipped: { label: 'Відправлено', color: 'bg-purple-100 text-purple-700' },
    delivered: { label: 'Доставлено', color: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Скасовано', color: 'bg-red-100 text-red-700' },
}

export default function OrderPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const [order, setOrder] = useState<Order | null>(null)
    const paymentSuccess = searchParams.get('payment') === 'success'

    useEffect(() => {
        fetch(`/api/orders/${params.id}`)
            .then(r => r.json())
            .then(setOrder)
    }, [params.id])

    if (!order) return (
        <main className="min-h-screen bg-stone-50 flex items-center justify-center">
            <div className="text-stone-400">Завантаження...</div>
        </main>
    )

    const st = STATUS_LABELS[order.status] ?? { label: order.status, color: 'bg-stone-100 text-stone-600' }

    return (
        <main className="min-h-screen bg-stone-50">
            <div className="max-w-2xl mx-auto px-4 py-12">
                {/* Success header */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">{paymentSuccess ? '🎉' : '✅'}</div>
                    <h1 className="text-2xl font-bold text-stone-800">
                        {paymentSuccess ? 'Оплата пройшла успішно!' : 'Замовлення оформлено!'}
                    </h1>
                    <p className="text-stone-400 mt-1">Дякуємо, {order.customerName.split(' ')[0]}!</p>
                </div>

                {/* Order card */}
                <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
                    <div className="bg-stone-800 text-white px-6 py-4 flex items-center justify-between">
                        <div>
                            <p className="text-stone-400 text-xs">Номер замовлення</p>
                            <p className="font-bold text-lg">LiLu #{order.id}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${st.color}`}>{st.label}</span>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Items */}
                        <div>
                            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Товари</p>
                            <div className="space-y-2">
                                {order.items.map(i => (
                                    <div key={i.id} className="flex justify-between text-sm">
                                        <span className="text-stone-700">{i.product.name} р.{i.size} ×{i.quantity}</span>
                                        <span className="text-stone-500">{(i.price * i.quantity).toLocaleString()} ₴</span>
                                    </div>
                                ))}
                                <div className="border-t border-stone-100 pt-2 flex justify-between font-bold text-stone-800">
                                    <span>Разом</span>
                                    <span>{order.total.toLocaleString()} ₴</span>
                                </div>
                            </div>
                        </div>

                        {/* Delivery */}
                        <div>
                            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Доставка</p>
                            {order.deliveryMethod === 'nova_poshta' ? (
                                <p className="text-sm text-stone-700">
                                    📦 Нова Пошта · {order.npCity}, {order.npWarehouse}
                                </p>
                            ) : (
                                <p className="text-sm text-stone-700">🚴 Кур'єр · {order.address}</p>
                            )}
                        </div>

                        {/* Payment */}
                        <div>
                            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Оплата</p>
                            <p className="text-sm text-stone-700">
                                {order.paymentMethod === 'liqpay' ? '💳 LiqPay' : '📬 Накладений платіж'} ·{' '}
                                <span className={order.paymentStatus === 'paid' ? 'text-green-600 font-medium' : 'text-amber-600'}>
                                    {order.paymentStatus === 'paid' ? 'Оплачено' : 'Очікує оплату'}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex gap-3 justify-center">
                    <Link href="/"
                        className="bg-stone-800 text-white px-6 py-2.5 rounded-xl hover:bg-stone-700 transition-colors font-medium text-sm">
                        Продовжити покупки
                    </Link>
                </div>
            </div>
        </main>
    )
}
