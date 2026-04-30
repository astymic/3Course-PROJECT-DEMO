'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type User = { id: number; name: string; phone: string | null; email: string | null; role: string }
type OrderItem = { id: number; size: number; quantity: number; price: number; product: { name: string } }
type Order = {
    id: number; status: string; total: number; createdAt: string
    deliveryMethod: string; npCity: string; npWarehouse: string; address: string
    paymentMethod: string; paymentStatus: string
    items: OrderItem[]
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

type ChatMsg = { id: number; text: string; sender: string; createdAt: string }
type ChatSession = { id: number; status: string; createdAt: string; updatedAt: string; messages: ChatMsg[]; _count: { messages: number } }

export default function AccountPage() {
    const router = useRouter()
    const params = useSearchParams()
    const claimedCount = parseInt(params.get('claimed') ?? '0')
    const [showClaimedBanner, setShowClaimedBanner] = useState(claimedCount > 0)

    const [user, setUser] = useState<User | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [chats, setChats] = useState<ChatSession[]>([])
    const [tab, setTab] = useState<'orders' | 'profile' | 'support'>('orders')
    const [expanded, setExpanded] = useState<number | null>(null)
    const [expandedChat, setExpandedChat] = useState<number | null>(null)

    // Profile edit state
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [currentPassword, setCurrent] = useState('')
    const [newPassword, setNewPwd] = useState('')
    const [confirmPassword, setConfirm] = useState('')
    const [saving, setSaving] = useState(false)
    const [saveMsg, setSaveMsg] = useState('')

    useEffect(() => {
        fetch('/api/auth/me').then(r => r.json()).then(u => {
            if (!u) { router.push('/login?redirect=/account'); return }
            setUser(u)
            setName(u.name ?? '')
            setPhone(u.phone ?? '')
            setEmail(u.email ?? '')
        })
        fetch('/api/orders/mine').then(r => r.json()).then(d => setOrders(Array.isArray(d) ? d : []))
        fetch('/api/chat/sessions').then(r => r.json()).then(d => setChats(Array.isArray(d) ? d : []))
    }, [router])

    const handleLogout = async () => {
        await fetch('/api/auth/me', { method: 'DELETE' })
        router.push('/')
        router.refresh()
    }

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaveMsg('')
        if (newPassword && newPassword !== confirmPassword) { setSaveMsg('❌ Паролі не збігаються'); return }
        setSaving(true)
        const res = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone: phone || null, email: email || null, currentPassword, newPassword: newPassword || undefined }),
        })
        const data = await res.json()
        if (!res.ok) { setSaveMsg(`❌ ${data.error}`); setSaving(false); return }
        setUser(prev => prev ? { ...prev, ...data } : prev)
        setSaveMsg('✅ Збережено!')
        setCurrent(''); setNewPwd(''); setConfirm('')
        setSaving(false)
    }

    const inputCls = "w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 bg-white"

    if (!user) {
        return <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-400">Завантаження...</div>
    }

    return (
        <main className="min-h-screen bg-stone-50">
            <header className="bg-white border-b border-stone-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-stone-400 hover:text-stone-700 text-sm transition-colors">← Каталог</Link>
                        <h1 className="text-xl font-bold text-stone-800">
                            Привіт, {user.name || user.phone || user.email}! 👋
                        </h1>
                        {user.role === 'admin' && (
                            <span className="bg-amber-500 text-stone-900 text-xs font-bold px-2 py-0.5 rounded-full">ADMIN</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {user.role === 'admin' && (
                            <Link href="/admin" className="text-sm text-amber-600 hover:text-amber-700 font-medium">Адмін-панель →</Link>
                        )}
                        <button onClick={handleLogout}
                            className="text-sm text-stone-400 hover:text-red-500 transition-colors">
                            Вийти
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-8">

                {/* ── Claimed orders welcome banner ────────────────── */}
                {showClaimedBanner && (
                    <div className="mb-5 flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
                        <span className="text-green-600 text-xl flex-shrink-0">🎉</span>
                        <div className="flex-1">
                            <p className="font-semibold text-green-800 text-sm">
                                Ласкаво просимо! Ми знайшли {claimedCount} {claimedCount === 1 ? 'замовлення' : 'замовлення(-ь)'} і прив'язали їх до вашого акаунту.
                            </p>
                            <p className="text-green-600 text-xs mt-0.5">Всі ваші попередні замовлення тепер відображаються нижче.</p>
                        </div>
                        <button onClick={() => setShowClaimedBanner(false)}
                            className="text-green-400 hover:text-green-700 text-lg flex-shrink-0">✕</button>
                    </div>
                )}
                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-stone-100 p-1 rounded-xl w-fit">
                    {[
                        { key: 'orders', label: `📦 Замовлення (${orders.length})` },
                        { key: 'support', label: `💬 Підтримка${chats.length > 0 ? ` (${chats.length})` : ''}` },
                        { key: 'profile', label: '⚙️ Профіль' },
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key as 'orders' | 'support' | 'profile')}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500 hover:text-stone-700'
                                }`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── Orders Tab ──────────────────────────────── */}
                {tab === 'orders' && (
                    orders.length === 0 ? (
                        <div className="text-center py-16 text-stone-400">
                            <div className="text-5xl mb-3">📦</div>
                            <p className="font-medium text-stone-600">Замовлень ще немає</p>
                            <Link href="/" className="mt-4 inline-block bg-amber-500 text-stone-900 font-bold px-6 py-2.5 rounded-xl hover:bg-amber-400 transition-colors text-sm">
                                До каталогу →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {orders.map(order => {
                                const st = STATUS_LABELS[order.status] ?? order.status
                                const stColor = STATUS_COLORS[order.status] ?? 'bg-stone-100 text-stone-600'
                                const isOpen = expanded === order.id
                                return (
                                    <div key={order.id} className="bg-white rounded-xl border border-stone-100 overflow-hidden shadow-sm">
                                        <button type="button" onClick={() => setExpanded(isOpen ? null : order.id)}
                                            className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors text-left">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-stone-800 text-sm">LiLu #{order.id}</span>
                                                <span className="text-stone-400 text-xs">
                                                    {new Date(order.createdAt).toLocaleDateString('uk-UA')}
                                                </span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${stColor}`}>{st}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-stone-800">{order.total.toLocaleString()} ₴</span>
                                                <span className="text-stone-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                                            </div>
                                        </button>
                                        {isOpen && (
                                            <div className="border-t border-stone-100 px-5 py-4 space-y-3">
                                                <div className="space-y-1">
                                                    {order.items.map(i => (
                                                        <div key={i.id} className="flex justify-between text-sm">
                                                            <span className="text-stone-700">{i.product.name} р.{i.size} ×{i.quantity}</span>
                                                            <span className="text-stone-500">{(i.price * i.quantity).toLocaleString()} ₴</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-stone-400">
                                                    {order.deliveryMethod === 'nova_poshta'
                                                        ? `📦 ${order.npCity}, ${order.npWarehouse}`
                                                        : `🚴 ${order.address}`} ·{' '}
                                                    {order.paymentMethod === 'liqpay' ? '💳 LiqPay' : '📬 НП'} ·{' '}
                                                    <span className={order.paymentStatus === 'paid' ? 'text-green-600 font-medium' : 'text-amber-600'}>
                                                        {order.paymentStatus === 'paid' ? 'Оплачено' : 'Очікує оплату'}
                                                    </span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )
                )}

                {/* ── Support Tab ────────────────────────────── */}
                {tab === 'support' && (
                    chats.length === 0 ? (
                        <div className="text-center py-16 text-stone-400">
                            <div className="text-5xl mb-3">💬</div>
                            <p className="font-medium text-stone-600">Звернень до підтримки ще немає</p>
                            <p className="text-sm mt-1">Скористайтесь чатом внизу сторінки</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {chats.map(chat => {
                                const isOpen = expandedChat === chat.id
                                return (
                                    <div key={chat.id} className="bg-white rounded-xl border border-stone-100 overflow-hidden shadow-sm">
                                        <button type="button" onClick={() => setExpandedChat(isOpen ? null : chat.id)}
                                            className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors text-left">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-stone-800 text-sm">Звернення #{chat.id}</span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${chat.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                                                    {chat.status === 'open' ? '🟢 Відкрито' : '⬤ Закрито'}
                                                </span>
                                                <span className="text-stone-400 text-xs">{chat._count.messages} пов.</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-stone-400">{new Date(chat.updatedAt).toLocaleDateString('uk-UA')}</span>
                                                <span className="text-stone-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                                            </div>
                                        </button>
                                        {isOpen && (
                                            <div className="border-t border-stone-100 px-5 py-4 bg-stone-50 space-y-2 max-h-64 overflow-y-auto">
                                                {chat.messages.map(m => (
                                                    <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${m.sender === 'user' ? 'bg-amber-500 text-stone-900' :
                                                                m.sender === 'admin' ? 'bg-stone-800 text-white' :
                                                                    'bg-white border border-stone-200 text-stone-700'}`}>
                                                            {m.sender !== 'user' && (
                                                                <p className={`text-xs font-semibold mb-0.5 ${m.sender === 'admin' ? 'text-amber-400' : 'text-amber-600'}`}>
                                                                    {m.sender === 'admin' ? 'LiLu Спеціаліст' : 'LiLu Бот'}
                                                                </p>
                                                            )}
                                                            <p>{m.text}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )
                )}

                {/* ── Profile Tab ──────────────────────────────── */}
                {tab === 'profile' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-stone-100 p-6 space-y-4">
                            <h2 className="font-bold text-stone-800 mb-2">Особисті дані</h2>
                            <div>
                                <label className="block text-sm text-stone-500 mb-1.5">Ім'я</label>
                                <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Ваше ім'я" />
                            </div>
                            <div>
                                <label className="block text-sm text-stone-500 mb-1.5">Телефон</label>
                                <input type="tel" value={phone}
                                    onChange={e => setPhone(e.target.value.replace(/[^\d+\-\s()]/g, ''))}
                                    className={inputCls} placeholder="+380..." />
                            </div>
                            <div>
                                <label className="block text-sm text-stone-500 mb-1.5">Email</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    className={inputCls} placeholder="email@example.com" />
                            </div>

                            <div className="border-t border-stone-100 pt-4">
                                <h3 className="font-semibold text-stone-700 text-sm mb-3">Зміна пароля</h3>
                                <div className="space-y-3">
                                    <input type="password" value={currentPassword} onChange={e => setCurrent(e.target.value)}
                                        className={inputCls} placeholder="Поточний пароль" />
                                    <input type="password" value={newPassword} onChange={e => setNewPwd(e.target.value)}
                                        className={inputCls} placeholder="Новий пароль (мін. 6 символів)" />
                                    <input type="password" value={confirmPassword} onChange={e => setConfirm(e.target.value)}
                                        className={inputCls} placeholder="Підтвердження нового пароля" />
                                </div>
                            </div>

                            {saveMsg && (
                                <p className={`text-sm px-3 py-2 rounded-lg ${saveMsg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                    {saveMsg}
                                </p>
                            )}

                            <button type="submit" disabled={saving}
                                className="w-full bg-stone-800 hover:bg-stone-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
                                {saving ? 'Збереження...' : 'Зберегти зміни'}
                            </button>
                        </form>

                        <div className="bg-white rounded-xl border border-stone-100 p-6">
                            <h2 className="font-bold text-stone-800 mb-4">Інформація про акаунт</h2>
                            <dl className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <dt className="text-stone-400">ID</dt>
                                    <dd className="font-mono text-stone-700">#{user.id}</dd>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <dt className="text-stone-400">Роль</dt>
                                    <dd>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>
                                            {user.role === 'admin' ? 'Адміністратор' : 'Покупець'}
                                        </span>
                                    </dd>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <dt className="text-stone-400">Замовлень</dt>
                                    <dd className="font-semibold text-stone-800">{orders.length}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
