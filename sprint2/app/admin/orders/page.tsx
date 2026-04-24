'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type OrderItem = { id: number; size: number; quantity: number; price: number; product: { name: string } }
type Order = {
    id: number; customerName: string; customerPhone: string
    deliveryMethod: string; npCity: string; npWarehouse: string
    paymentMethod: string; paymentStatus: string; status: string; total: number
    createdAt: string; items: OrderItem[]
}

const STATUSES = ['', 'new', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_LABELS: Record<string, string> = {
    new: 'Нове', processing: 'В обробці', shipped: 'Відправлено',
    delivered: 'Доставлено', cancelled: 'Скасовано',
}
const STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700', processing: 'bg-amber-100 text-amber-700',
    shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
}
const PAY_COLORS: Record<string, string> = {
    pending: 'text-amber-600', paid: 'text-green-600', failed: 'text-red-500',
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('')
    const [updating, setUpdating] = useState<number | null>(null)

    const load = (status: string) => {
        setLoading(true)
        fetch(`/api/orders${status ? `?status=${status}` : ''}`)
            .then(r => r.json())
            .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false) })
    }

    useEffect(() => { load(filterStatus) }, [filterStatus])

    const updateStatus = async (id: number, status: string) => {
        setUpdating(id)
        await fetch(`/api/orders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        })
        setUpdating(null)
        load(filterStatus)
    }

    const totalRevenue = orders
        .filter(o => o.paymentStatus === 'paid')
        .reduce((acc, o) => acc + o.total, 0)

    return (
        <div className="min-h-screen bg-stone-50">
            <header className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="text-stone-400 hover:text-white text-sm transition-colors">← Товари</Link>
                    <div>
                        <h1 className="font-bold text-lg">LiLu · Замовлення</h1>
                        <p className="text-stone-400 text-xs">Управління замовленнями</p>
                    </div>
                </div>
                <Link href="/" className="text-stone-400 hover:text-white text-sm transition-colors">На сайт →</Link>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Всього', value: orders.length, color: 'text-stone-800' },
                        { label: 'Нових', value: orders.filter(o => o.status === 'new').length, color: 'text-blue-600' },
                        { label: 'Відправлено', value: orders.filter(o => o.status === 'shipped').length, color: 'text-purple-600' },
                        { label: 'Виручка (оплачено)', value: `${totalRevenue.toLocaleString()} ₴`, color: 'text-green-600' },
                    ].map(s => (
                        <div key={s.label} className="bg-white border border-stone-200 rounded-xl p-4">
                            <p className="text-xs text-stone-400 mb-1">{s.label}</p>
                            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filter */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {STATUSES.map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${filterStatus === s ? 'bg-stone-800 text-white border-stone-800' : 'border-stone-200 text-stone-600 hover:border-stone-400'
                                }`}>
                            {s ? STATUS_LABELS[s] : 'Всі'}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                    {loading ? (
                        <div className="p-8">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-stone-100 rounded mb-2 animate-pulse" />)}</div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-16 text-stone-400">
                            <p className="text-3xl mb-2">📋</p>
                            <p>Замовлень немає</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-stone-50 border-b border-stone-200">
                                    <tr>
                                        {['#', 'Покупець', 'Товари', 'Доставка', 'Оплата', 'Сума', 'Статус', 'Дата', 'Дії'].map(h => (
                                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {orders.map(o => (
                                        <tr key={o.id} className="hover:bg-stone-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-stone-500">#{o.id}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-stone-800 whitespace-nowrap">{o.customerName}</div>
                                                <div className="text-xs text-stone-400">{o.customerPhone}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-xs text-stone-600 max-w-32 truncate">
                                                    {o.items.map(i => `${i.product.name} р.${i.size}`).join(', ')}
                                                </div>
                                                <div className="text-xs text-stone-400">{o.items.length} поз.</div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-stone-600 max-w-36">
                                                {o.deliveryMethod === 'nova_poshta'
                                                    ? <span>📦 {o.npCity}</span>
                                                    : <span>🚴 Кур'єр</span>}
                                            </td>
                                            <td className="px-4 py-3 text-xs whitespace-nowrap">
                                                <div>{o.paymentMethod === 'liqpay' ? '💳 LiqPay' : '📬 НП'}</div>
                                                <div className={`font-medium ${PAY_COLORS[o.paymentStatus]}`}>
                                                    {o.paymentStatus === 'paid' ? 'Оплачено' : o.paymentStatus === 'failed' ? 'Помилка' : 'Очікує'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-stone-800 whitespace-nowrap">
                                                {o.total.toLocaleString()} ₴
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] ?? 'bg-stone-100 text-stone-600'}`}>
                                                    {STATUS_LABELS[o.status] ?? o.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-stone-400 whitespace-nowrap">
                                                {new Date(o.createdAt).toLocaleDateString('uk-UA')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    disabled={updating === o.id}
                                                    value={o.status}
                                                    onChange={e => updateStatus(o.id, e.target.value)}
                                                    className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-stone-400"
                                                >
                                                    {STATUSES.filter(Boolean).map(s => (
                                                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
