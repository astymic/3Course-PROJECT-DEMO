'use client'
import { useState, useEffect, useCallback } from 'react'
import { useCart } from '@/context/CartContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// +2 business days from today (skip Sat/Sun)
function getEstimatedDelivery(): string {
    const d = new Date()
    let added = 0
    while (added < 2) {
        d.setDate(d.getDate() + 1)
        const day = d.getDay()
        if (day !== 0 && day !== 6) added++
    }
    return d.toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' })
}

type NpCity = { Ref: string; Description: string }
type NpWarehouse = { Ref: string; Description: string; Number: string }

const inputCls = "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-200 bg-white"

export default function CheckoutPage() {
    const { items, total, clear } = useCart()
    const router = useRouter()

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
    const [showCities, setShowCities] = useState(false)

    const [warehouseQuery, setWarehouseQuery] = useState('')
    const [warehouses, setWarehouses] = useState<NpWarehouse[]>([])
    const [selectedWh, setSelectedWh] = useState<NpWarehouse | null>(null)
    const [showWarehouses, setShowWarehouses] = useState(false)
    const [npLoading, setNpLoading] = useState(false)

    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [autofilling, setAutofilling] = useState(false)
    const [autofillMsg, setAutofillMsg] = useState('')

    // Autofill from user profile
    const handleAutofill = async () => {
        setAutofilling(true)
        setAutofillMsg('')
        try {
            const res = await fetch('/api/auth/me')
            const user = await res.json()
            if (!user) {
                setAutofillMsg('⚠️ Спочатку увійдіть в кабінет')
            } else {
                if (user.name) setName(user.name)
                if (user.phone) setPhone(user.phone)
                if (user.email) setEmail(user.email)
                setAutofillMsg('✅ Дані заповнено з профілю')
            }
        } catch {
            setAutofillMsg('Помилка під час завантаження')
        }
        setAutofilling(false)
        setTimeout(() => setAutofillMsg(''), 3000)
    }

    // Phone: allow only digits, +, -, space
    const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^\d+\-\s()]/g, '')
        setPhone(val)
    }

    // City search
    const searchCities = useCallback(async (q: string) => {
        if (q.length < 2) { setCities([]); setShowCities(false); return }
        setNpLoading(true)
        try {
            const res = await fetch(`/api/nova-poshta/cities?q=${encodeURIComponent(q)}`)
            const data = await res.json()
            setCities(data.slice(0, 10))
            setShowCities(true)
        } catch { setCities([]) }
        setNpLoading(false)
    }, [])

    useEffect(() => {
        if (selectedCity) return // Don't search if city already selected
        const t = setTimeout(() => searchCities(cityQuery), 300)
        return () => clearTimeout(t)
    }, [cityQuery, selectedCity, searchCities])

    // Load warehouses — does NOT clear existing list during reload to avoid flicker
    const loadWarehouses = useCallback(async (cityRef: string, q: string) => {
        setNpLoading(true)
        try {
            const res = await fetch(`/api/nova-poshta/warehouses?cityRef=${encodeURIComponent(cityRef)}&q=${encodeURIComponent(q)}`)
            const data = await res.json()
            setWarehouses(Array.isArray(data) ? data : [])
            setShowWarehouses(true)
        } catch { /* keep previous list on error */ }
        setNpLoading(false)
    }, [])

    // Reload warehouses on query change ONLY (not on city select — city select calls loadWarehouses directly)
    useEffect(() => {
        if (!selectedCity || selectedWh || !warehouseQuery) return
        const t = setTimeout(() => loadWarehouses(selectedCity.Ref, warehouseQuery), 300)
        return () => clearTimeout(t)
    }, [warehouseQuery, selectedCity, selectedWh, loadWarehouses])

    const selectCity = (c: NpCity) => {
        setSelectedCity(c)
        setCityQuery(c.Description)
        setCities([])
        setShowCities(false)
        setSelectedWh(null)
        setWarehouseQuery('')
        loadWarehouses(c.Ref, '')
    }

    const clearCity = () => {
        setSelectedCity(null)
        setCityQuery('')
        setCities([])
        setSelectedWh(null)
        setWarehouses([])
        setShowWarehouses(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !phone) { setError('Вкажіть ПІБ та телефон'); return }
        if (delivery === 'nova_poshta' && !selectedWh) { setError('Оберіть відділення Нової Пошти'); return }
        if (delivery === 'courier' && !address) { setError('Введіть адресу доставки'); return }

        setSubmitting(true)
        setError('')

        const estimatedDelivery = delivery === 'courier' ? getEstimatedDelivery() : undefined

        const body = {
            customerName: name, customerPhone: phone, customerEmail: email,
            deliveryMethod: delivery, paymentMethod: payment,
            npCity: selectedCity?.Description ?? '',
            npWarehouse: selectedWh?.Description ?? '',
            npWarehouseRef: selectedWh?.Ref ?? '',
            address: delivery === 'courier'
                ? `${address}${estimatedDelivery ? ` (доставка до ${estimatedDelivery})` : ''}`
                : address,
            notes,
            items: items.map(i => ({
                productId: i.productId, size: i.size, quantity: i.quantity, price: i.price,
            })),
        }

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            const order = await res.json()
            if (!res.ok) { setError(order.error ?? 'Помилка'); setSubmitting(false); return }

            // Send email confirmation (fire-and-forget)
            if (email) {
                fetch('/api/email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'order_confirmation',
                        to: email,
                        order: {
                            id: order.id,
                            customerName: name,
                            total: order.total,
                            deliveryMethod: delivery,
                            npCity: selectedCity?.Description ?? '',
                            npWarehouse: selectedWh?.Description ?? '',
                            address,
                            paymentMethod: payment,
                            estimatedDelivery,
                            items: items.map(i => ({ name: i.name, size: i.size, quantity: i.quantity, price: i.price })),
                        },
                    }),
                }).catch(console.error) // Don't block navigation on email failure
            }

            clear()
            router.push(`/order/${order.id}`)
        } catch {
            setError('Помилка з\'єднання з сервером')
            setSubmitting(false)
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
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-stone-800">Контактні дані</h2>
                                <button
                                    type="button"
                                    onClick={handleAutofill}
                                    disabled={autofilling}
                                    className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 font-medium"
                                >
                                    {autofilling ? (
                                        <span className="inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <span>👤</span>
                                    )}
                                    {autofilling ? 'Завантаження...' : 'Заповнити з профілю'}
                                </button>
                            </div>
                            {autofillMsg && (
                                <p className={`text-xs px-3 py-2 rounded-lg mb-3 ${autofillMsg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                                    }`}>{autofillMsg}</p>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-stone-500 mb-1.5">ПІБ *</label>
                                    <input
                                        value={name} onChange={e => setName(e.target.value)} required
                                        className={inputCls} placeholder="Іваненко Іван Іванович"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-stone-500 mb-1.5">Телефон *</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={handlePhone}
                                        onKeyDown={e => {
                                            // Block letters (allow digits, +, -, space, backspace, arrows, etc.)
                                            if (e.key.length === 1 && /[a-zA-Zа-яА-ЯёЁіІїЇєЄ]/.test(e.key)) {
                                                e.preventDefault()
                                            }
                                        }}
                                        required
                                        inputMode="tel"
                                        className={inputCls}
                                        placeholder="+380 XX XXX XX XX"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-stone-500 mb-1.5">Email</label>
                                    <input
                                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                                        className={inputCls} placeholder="email@example.com"
                                    />
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
                                        className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${delivery === opt.value
                                            ? 'border-stone-800 bg-stone-800 text-white'
                                            : 'border-stone-200 text-stone-600 hover:border-stone-400'
                                            }`}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {delivery === 'nova_poshta' && (
                                <div className="space-y-4">
                                    {/* City */}
                                    <div className="relative">
                                        <label className="block text-sm text-stone-500 mb-1.5">
                                            Місто * {npLoading && <span className="text-stone-400 text-xs">(завантаження...)</span>}
                                        </label>
                                        <div className="relative">
                                            <input
                                                value={cityQuery}
                                                onChange={e => {
                                                    setCityQuery(e.target.value)
                                                    if (selectedCity) clearCity()
                                                }}
                                                onFocus={() => { if (cities.length > 0) setShowCities(true) }}
                                                className={inputCls + (selectedCity ? ' border-green-400 bg-green-50' : '')}
                                                placeholder="Введіть назву міста..."
                                                autoComplete="off"
                                            />
                                            {selectedCity && (
                                                <button type="button" onClick={clearCity}
                                                    className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-700 font-bold text-sm">
                                                    ✕
                                                </button>
                                            )}
                                        </div>

                                        {showCities && cities.length > 0 && !selectedCity && (
                                            <div className="absolute z-20 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden">
                                                {cities.map(c => (
                                                    <button key={c.Ref} type="button"
                                                        onMouseDown={() => selectCity(c)}
                                                        className="w-full text-left px-4 py-2.5 text-sm text-stone-800 hover:bg-amber-50 hover:text-amber-800 transition-colors border-b border-stone-50 last:border-0">
                                                        📍 {c.Description}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Warehouse — shows immediately after city selected */}
                                    {selectedCity && (
                                        <div className="relative">
                                            <label className="block text-sm text-stone-500 mb-1.5">
                                                Відділення * {npLoading && <span className="text-stone-400 text-xs">(завантаження...)</span>}
                                            </label>
                                            {selectedWh ? (
                                                <div className="flex items-center gap-2 border border-green-400 bg-green-50 rounded-lg px-3 py-2">
                                                    <span className="text-sm text-stone-800 flex-1">
                                                        №{selectedWh.Number} — {selectedWh.Description}
                                                    </span>
                                                    <button type="button" onClick={() => { setSelectedWh(null); setWarehouseQuery(''); loadWarehouses(selectedCity.Ref, '') }}
                                                        className="text-stone-400 hover:text-stone-700 font-bold text-sm flex-shrink-0">
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <input
                                                        value={warehouseQuery}
                                                        onChange={e => { setWarehouseQuery(e.target.value); setShowWarehouses(true) }}
                                                        onFocus={() => setShowWarehouses(true)}
                                                        className={inputCls}
                                                        placeholder="Пошук відділення (або оберіть зі списку)..."
                                                        autoComplete="off"
                                                    />
                                                    {showWarehouses && warehouses.length > 0 && (
                                                        <div className="absolute z-20 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                                                            {(() => {
                                                                const filtered = warehouses.filter(w =>
                                                                    !warehouseQuery ||
                                                                    w.Description.toLowerCase().includes(warehouseQuery.toLowerCase()) ||
                                                                    w.Number.includes(warehouseQuery)
                                                                )
                                                                return filtered.length > 0 ? (
                                                                    filtered.map(w => (
                                                                        <button key={w.Ref} type="button"
                                                                            onMouseDown={() => { setSelectedWh(w); setShowWarehouses(false) }}
                                                                            className="w-full text-left px-4 py-2.5 text-sm text-stone-800 hover:bg-amber-50 hover:text-amber-800 transition-colors border-b border-stone-50 last:border-0">
                                                                            <span className="font-semibold">№{w.Number}</span> — {w.Description}
                                                                        </button>
                                                                    ))
                                                                ) : (
                                                                    <div className="px-4 py-3 text-sm text-stone-400">Відділень за запитом не знайдено</div>
                                                                )
                                                            })()}
                                                        </div>
                                                    )}
                                                    {showWarehouses && !npLoading && warehouses.length === 0 && (
                                                        <p className="text-xs text-stone-400 mt-1">Відділень не знайдено</p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {delivery === 'courier' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm text-stone-500 mb-1.5">Адреса доставки *</label>
                                        <input value={address} onChange={e => setAddress(e.target.value)}
                                            className={inputCls} placeholder="Місто, вулиця, будинок, квартира" />
                                    </div>
                                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                        <span className="text-amber-600">🗓</span>
                                        <span className="text-xs text-stone-600">
                                            Орієнтовна дата доставки: <strong className="text-stone-800">{getEstimatedDelivery()}</strong> (+2 робочі дні)
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payment */}
                        <div className="bg-white rounded-xl border border-stone-100 p-6">
                            <h2 className="font-bold text-stone-800 mb-4">Оплата</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* LiqPay — stub, disabled */}
                                <div className="relative">
                                    <div
                                        className="text-left p-4 rounded-xl border border-stone-100 bg-stone-50 opacity-60 cursor-not-allowed"
                                    >
                                        <div className="font-medium text-stone-600 text-sm">💳 LiqPay (картка)</div>
                                        <div className="text-xs text-stone-400 mt-0.5">Visa/Mastercard</div>
                                        <div className="text-xs text-amber-600 mt-1 font-medium">Незабаром</div>
                                    </div>
                                </div>

                                {/* Cash on delivery */}
                                <button type="button"
                                    onClick={() => setPayment('cash_on_delivery')}
                                    className="text-left p-4 rounded-xl border transition-all border-amber-500 bg-amber-50">
                                    <div className="font-medium text-stone-800 text-sm">📬 Накладений платіж</div>
                                    <div className="text-xs text-stone-400 mt-0.5">Оплата при отриманні + комісія НП</div>
                                </button>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white rounded-xl border border-stone-100 p-6">
                            <label className="block text-sm font-medium text-stone-700 mb-2">Коментар до замовлення</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)}
                                rows={2} placeholder="Побажання або уточнення..."
                                className={inputCls + ' resize-none'} />
                        </div>

                        {error && (
                            <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                                ⚠️ {error}
                            </p>
                        )}
                    </div>

                    {/* Right: Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-stone-100 p-6 sticky top-24">
                            <h2 className="font-bold text-stone-800 mb-4">Ваше замовлення</h2>
                            <div className="space-y-2 mb-4">
                                {items.map(i => (
                                    <div key={`${i.productId}-${i.size}`} className="flex justify-between text-sm text-stone-600">
                                        <span className="truncate mr-2 text-stone-700">{i.name} р.{i.size} ×{i.quantity}</span>
                                        <span className="flex-shrink-0 font-medium">{(i.price * i.quantity).toLocaleString()} ₴</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-stone-100 pt-3 mb-5">
                                <div className="flex justify-between font-bold text-stone-800 text-lg">
                                    <span>Разом</span>
                                    <span>{total.toLocaleString()} ₴</span>
                                </div>
                                <p className="text-xs text-stone-400 mt-1">+ комісія Нової Пошти при отриманні</p>
                            </div>
                            <button type="submit" disabled={submitting}
                                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-900 font-bold py-3 rounded-xl transition-colors">
                                {submitting ? 'Обробка...' : 'Підтвердити замовлення →'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </main>
    )
}
