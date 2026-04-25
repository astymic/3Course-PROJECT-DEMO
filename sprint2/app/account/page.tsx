'use client'
import { useState } from 'react'
import Link from 'next/link'

type OrderItem = { id: number; size: number; quantity: number; price: number; product: { name: string; color: string } }
type Order = {
    id: number; customerName: string; customerPhone: string
    deliveryMethod: string; npCity: string; npWarehouse: string; address: string
    paymentMethod: string; paymentStatus: string; status: string; total: number
    createdAt: string; items: OrderItem[]
}

const STATUS_LABELS: Record<string, string> = {
    new: 'Нове', processing: 'В обробці', shipped: 'Відправлено',
    delivered: 'Доставлено', cancelled: 'Скасовано',
}
const STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700', processing: 'bg-amber-100 text-amber-700',
    shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
}

export default function AccountPage() {
    const [phone, setPhone] = useState('')
    const [orders, setOrders] = useState<Order[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [expanded, setExpanded] = useState<number | null>(null)
    const [searched, setSearched] = useState(false)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!phone.trim()) { setError('Введіть номер телефону'); return }
        setLoading(true)
        setError('')
        setSearched(false)

        try {
            const res = await fetch(`/api/orders/by-phone?phone=${encodeURIComponent(phone.trim())}`)
            const data = await res.json()
            setOrders(Array.isArray(data) ? data : [])
            setSearched(true)
        } catch {
            setError('Помилка з\'єднання')
        }
        setLoading(false)
    }

    return (
        <main className="min-h-screen bg-stone-50">
            {/* Header */}
            <header className="bg-white border-b border-stone-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-stone-400 hover:text-stone-700 transition-colors text-sm">← Каталог</Link>
                        <h1 className="text-xl font-bold text-stone-800">Мої замовлення</h1>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-10">
                {/* Search box */}
                <div className="bg-white rounded-2xl border border-stone-100 p-8 mb-6 shadow-sm">
                    <div className="text-center mb-6">
                        <div className="text-4xl mb-3">📦</div>
                        <h2 className="text-xl font-bold text-stone-800 mb-1">Перевірити статус замовлення</h2>
                        <p className="text-stone-400 text-sm">Введіть номер телефону, який вказали при оформленні</p>
                    </div>

                    <form onSubmit={handleSearch} className="max-w-sm mx-auto">
                        <div className="flex gap-2">
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value.replace(/[^\d+\-\s()]/g, ''))}
                                placeholder="+380 XX XXX XX XX"
                                className="flex-1 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                            />
                            <button type="submit" disabled={loading}
                                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-900 font-bold px-5 py-3 rounded-xl transition-colors text-sm">
                                {loading ? '...' : '🔍'}
                            </button>
                        </div>
                        {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
                    </form>
                </div>

                {/* Results */}
                {searched && orders !== null && (
                    orders.length === 0 ? (
                        <div className="text-center py-12 text-stone-400">
                            <div className="text-4xl mb-3">🔍</div>
                            <p className="font-medium text-stone-600">Замовлень не знайдено</p>
                            <p className="text-sm mt-1">Перевірте номер телефону або <Link href="/" className="text-amber-600 underline">зробіть замовлення</Link></p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-stone-500 mb-1">Знайдено замовлень: {orders.length}</p>
                            {orders.map(order => {
                                const st = STATUS_LABELS[order.status] ?? order.status
                                const stColor = STATUS_COLORS[order.status] ?? 'bg-stone-100 text-stone-600'
                                const isOpen = expanded === order.id
                                return (
                                    <div key={order.id} className="bg-white rounded-xl border border-stone-100 overflow-hidden shadow-sm">
                                        {/* Order header row */}
                                        <button
                                            type="button"
                                            onClick={() => setExpanded(isOpen ? null : order.id)}
                                            className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <span className="font-bold text-stone-800 text-sm">LiLu #{order.id}</span>
                                                    <span className="text-stone-400 text-xs ml-2">
                                                        {new Date(order.createdAt).toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${stColor}`}>{st}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-stone-800">{order.total.toLocaleString()} ₴</span>
                                                <span className="text-stone-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                                            </div>
                                        </button>

                                        {/* Expanded details */}
                                        {isOpen && (
                                            <div className="border-t border-stone-100 px-5 py-4 space-y-4">
                                                {/* Items */}
                                                <div>
                                                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Товари</p>
                                                    <div className="space-y-1.5">
                                                        {order.items.map(i => (
                                                            <div key={i.id} className="flex justify-between text-sm">
                                                                <span className="text-stone-700">{i.product.name} р.{i.size} ×{i.quantity}</span>
                                                                <span className="text-stone-500 font-medium">{(i.price * i.quantity).toLocaleString()} ₴</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Delivery */}
                                                <div>
                                                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Доставка</p>
                                                    <p className="text-sm text-stone-700">
                                                        {order.deliveryMethod === 'nova_poshta'
                                                            ? `📦 Нова Пошта · ${order.npCity}, ${order.npWarehouse}`
                                                            : `🚴 Кур'єр · ${order.address}`}
                                                    </p>
                                                </div>

                                                {/* Payment */}
                                                <div>
                                                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Оплата</p>
                                                    <p className="text-sm text-stone-700">
                                                        {order.paymentMethod === 'liqpay' ? '💳 LiqPay' : '📬 Накладений платіж'} ·{' '}
                                                        <span className={order.paymentStatus === 'paid' ? 'text-green-600 font-medium' : 'text-amber-600'}>
                                                            {order.paymentStatus === 'paid' ? 'Оплачено' : 'Очікує оплату'}
                                                        </span>
                                                    </p>
                                                </div>

                                                <Link href={`/order/${order.id}`}
                                                    className="inline-block text-xs text-amber-600 underline hover:text-amber-800">
                                                    Детальна сторінка замовлення →
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )
                )}
            </div>
        </main>
    )
}
