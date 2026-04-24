'use client'
import { useState, useEffect, useCallback } from 'react'
import { useCart } from '@/context/CartContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type NpCity = { Ref: string; Description: string }
type NpWarehouse = { Ref: string; Description: string; Number: string }

export default function CheckoutPage() {
    const { items, total, clear } = useCart()
    const router = useRouter()

    // Form state
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [delivery, setDelivery] = useState<'nova_poshta' | 'courier'>('nova_poshta')
    const [payment, setPayment] = useState<'liqpay' | 'cash_on_delivery'>('cash_on_delivery')
    const [address, setAddress] = useState('')
    const [notes, setNotes] = useState('')

    // Nova Poshta
    const [cityQuery, setCityQuery] = useState('')
    const [cities, setCities] = useState<NpCity[]>([])
    const [selectedCity, setSelectedCity] = useState<NpCity | null>(null)
    const [warehouseQuery, setWarehouseQuery] = useState('')
    const [warehouses, setWarehouses] = useState<NpWarehouse[]>([])
    const [selectedWh, setSelectedWh] = useState<NpWarehouse | null>(null)
    const [npLoading, setNpLoading] = useState(false)

    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    // City search
    const searchCities = useCallback(async (q: string) => {
        if (q.length < 2) { setCities([]); return }
        setNpLoading(true)
        try {
            const res = await fetch(`/api/nova-poshta/cities?q=${encodeURIComponent(q)}`)
            const data = await res.json()
            setCities(data.slice(0, 8))
        } catch { setCities([]) }
        setNpLoading(false)
    }, [])

    useEffect(() => {
        const t = setTimeout(() => searchCities(cityQuery), 400)
        return () => clearTimeout(t)
    }, [cityQuery, searchCities])

    // Warehouse search
    const searchWarehouses = useCallback(async (cityRef: string, q: string) => {
        setNpLoading(true)
        try {
            const res = await fetch(`/api/nova-poshta/warehouses?cityRef=${cityRef}&q=${encodeURIComponent(q)}`)
            const data = await res.json()
            setWarehouses(data.slice(0, 15))
        } catch { setWarehouses([]) }
        setNpLoading(false)
    }, [])

    useEffect(() => {
        if (selectedCity) {
            const t = setTimeout(() => searchWarehouses(selectedCity.Ref, warehouseQuery), 400)
            return () => clearTimeout(t)
        }
    }, [warehouseQuery, selectedCity, searchWarehouses])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !phone) { setError('Вкажіть ПІБ та телефон'); return }
        if (delivery === 'nova_poshta' && !selectedWh) { setError('Оберіть відділення Нової Пошти'); return }
        if (delivery === 'courier' && !address) { setError('Введіть адресу доставки'); return }

        setSubmitting(true)
        setError('')

        const body = {
            customerName: name, customerPhone: phone, customerEmail: email,
            deliveryMethod: delivery, paymentMethod: payment,
            npCity: selectedCity?.Description ?? '',
            npWarehouse: selectedWh?.Description ?? '',
            npWarehouseRef: selectedWh?.Ref ?? '',
            address, notes,
            items: items.map(i => ({
                productId: i.productId, size: i.size, quantity: i.quantity, price: i.price,
            })),
        }

        const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        const order = await res.json()

        if (!res.ok) { setError(order.error ?? 'Помилка'); setSubmitting(false); return }

        if (payment === 'liqpay') {
            // Get LiqPay form and submit it
            const lpRes = await fetch('/api/liqpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id, amount: order.total, description: `Замовлення LiLu #${order.id}` }),
            })
            const { data, signature } = await lpRes.json()
            // Submit LiqPay form programmatically
            const form = document.createElement('form')
            form.method = 'POST'
            form.action = 'https://www.liqpay.ua/api/3/checkout'
            form.acceptCharset = 'utf-8'
                ;[{ name: 'data', value: data }, { name: 'signature', value: signature }].forEach(({ name, value }) => {
                    const input = document.createElement('input')
                    input.type = 'hidden'; input.name = name; input.value = value
                    form.appendChild(input)
                })
            document.body.appendChild(form)
            form.submit()
            clear()
        } else {
            clear()
            router.push(`/order/${order.id}`)
        }
    }

    if (items.length === 0) {
        return (
            <main className="min-h-screen bg-stone-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-stone-500 mb-4">Ваш кошик порожній</p>
                    <Link href="/" className="bg-stone-800 text-white px-6 py-2 rounded-lg">До каталогу</Link>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-stone-50">
            <header className="bg-white border-b border-stone-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/cart" className="text-stone-400 hover:text-stone-700 transition-colors">← Кошик</Link>
                    <h1 className="text-xl font-bold text-stone-800">Оформлення замовлення</h1>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 py-8">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Form */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Customer info */}
                        <div className="bg-white rounded-xl border border-stone-100 p-6">
                            <h2 className="font-bold text-stone-800 mb-4">Контактні дані</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-stone-500 mb-1">ПІБ *</label>
                                    <input value={name} onChange={e => setName(e.target.value)} required
                                        className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
                                        placeholder="Іваненко Іван Іванович" />
                                </div>
                                <div>
                                    <label className="block text-sm text-stone-500 mb-1">Телефон *</label>
                                    <input value={phone} onChange={e => setPhone(e.target.value)} required
                                        className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
                                        placeholder="+380" />
                                </div>
                                <div>
                                    <label className="block text-sm text-stone-500 mb-1">Email</label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                        className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
                                        placeholder="email@example.com" />
                                </div>
                            </div>
                        </div>

                        {/* Delivery */}
                        <div className="bg-white rounded-xl border border-stone-100 p-6">
                            <h2 className="font-bold text-stone-800 mb-4">Доставка</h2>
                            <div className="flex gap-3 mb-4">
                                {[
                                    { value: 'nova_poshta', label: '📦 Нова Пошта' },
                                    { value: 'courier', label: '🚴 Кур\'єр' },
                                ].map(opt => (
                                    <button key={opt.value} type="button"
                                        onClick={() => setDelivery(opt.value as 'nova_poshta' | 'courier')}
                                        className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${delivery === opt.value ? 'border-stone-800 bg-stone-800 text-white' : 'border-stone-200 text-stone-600 hover:border-stone-400'}`}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {delivery === 'nova_poshta' && (
                                <div className="space-y-3">
                                    {/* City search */}
                                    <div className="relative">
                                        <label className="block text-sm text-stone-500 mb-1">Місто *</label>
                                        <input
                                            value={selectedCity ? selectedCity.Description : cityQuery}
                                            onChange={e => { setSelectedCity(null); setSelectedWh(null); setCityQuery(e.target.value); setWarehouses([]) }}
                                            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
                                            placeholder="Введіть назву міста..."
                                        />
                                        {npLoading && <span className="absolute right-3 top-8 text-xs text-stone-400">...</span>}
                                        {!selectedCity && cities.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                {cities.map(c => (
                                                    <button key={c.Ref} type="button"
                                                        onClick={() => { setSelectedCity(c); setCityQuery(c.Description); setCities([]); searchWarehouses(c.Ref, '') }}
                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 transition-colors">
                                                        {c.Description}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Warehouse search */}
                                    {selectedCity && (
                                        <div className="relative">
                                            <label className="block text-sm text-stone-500 mb-1">Відділення *</label>
                                            <input
                                                value={selectedWh ? `№${selectedWh.Number} — ${selectedWh.Description}` : warehouseQuery}
                                                onChange={e => { setSelectedWh(null); setWarehouseQuery(e.target.value) }}
                                                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
                                                placeholder="Пошук відділення..."
                                            />
                                            {!selectedWh && warehouses.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                                                    {warehouses.map(w => (
                                                        <button key={w.Ref} type="button"
                                                            onClick={() => { setSelectedWh(w); setWarehouses([]) }}
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-0">
                                                            <span className="font-medium">№{w.Number}</span> — {w.Description}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {delivery === 'courier' && (
                                <div>
                                    <label className="block text-sm text-stone-500 mb-1">Адреса доставки *</label>
                                    <input value={address} onChange={e => setAddress(e.target.value)}
                                        className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
                                        placeholder="Вулиця, будинок, квартира" />
                                </div>
                            )}
                        </div>

                        {/* Payment */}
                        <div className="bg-white rounded-xl border border-stone-100 p-6">
                            <h2 className="font-bold text-stone-800 mb-4">Оплата</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[
                                    { value: 'liqpay', label: '💳 LiqPay (картка)', desc: 'Visa/Mastercard, PrivatBank' },
                                    { value: 'cash_on_delivery', label: '📬 Накладений платіж', desc: 'Оплата при отриманні + комісія НП' },
                                ].map(opt => (
                                    <button key={opt.value} type="button"
                                        onClick={() => setPayment(opt.value as 'liqpay' | 'cash_on_delivery')}
                                        className={`text-left p-4 rounded-xl border transition-all ${payment === opt.value ? 'border-amber-500 bg-amber-50' : 'border-stone-200 hover:border-stone-300'}`}>
                                        <div className="font-medium text-stone-800 text-sm">{opt.label}</div>
                                        <div className="text-xs text-stone-400 mt-0.5">{opt.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white rounded-xl border border-stone-100 p-6">
                            <label className="block text-sm font-medium text-stone-700 mb-2">Коментар до замовлення</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)}
                                rows={2} placeholder="Побажання або уточнення..."
                                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400 resize-none" />
                        </div>

                        {error && <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</p>}
                    </div>

                    {/* Right: Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-stone-100 p-6 sticky top-24">
                            <h2 className="font-bold text-stone-800 mb-4">Ваше замовлення</h2>
                            <div className="space-y-2 mb-4">
                                {items.map(i => (
                                    <div key={`${i.productId}-${i.size}`} className="flex justify-between text-sm text-stone-600">
                                        <span className="truncate mr-2">{i.name} р.{i.size} ×{i.quantity}</span>
                                        <span className="flex-shrink-0">{(i.price * i.quantity).toLocaleString()} ₴</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-stone-100 pt-3 mb-5">
                                <div className="flex justify-between font-bold text-stone-800 text-lg">
                                    <span>Разом</span>
                                    <span>{total.toLocaleString()} ₴</span>
                                </div>
                                {payment === 'cash_on_delivery' && (
                                    <p className="text-xs text-stone-400 mt-1">+ комісія Нової Пошти при отриманні</p>
                                )}
                            </div>
                            <button type="submit" disabled={submitting}
                                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-900 font-bold py-3 rounded-xl transition-colors">
                                {submitting ? 'Обробка...' : payment === 'liqpay' ? 'Перейти до оплати →' : 'Підтвердити замовлення →'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </main>
    )
}
