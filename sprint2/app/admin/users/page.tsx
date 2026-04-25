'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type User = {
    id: number; name: string; phone: string | null; email: string | null
    role: string; createdAt: string; _count: { orders: number }
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<number | null>(null)
    const [search, setSearch] = useState('')

    const load = () => {
        setLoading(true)
        fetch('/api/admin/users').then(r => r.json()).then(d => {
            setUsers(Array.isArray(d) ? d : [])
            setLoading(false)
        })
    }
    useEffect(() => { load() }, [])

    const changeRole = async (userId: number, role: string) => {
        setUpdating(userId)
        await fetch('/api/admin/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, role }),
        })
        setUpdating(null)
        load()
    }

    const filtered = users.filter(u => {
        const q = search.toLowerCase()
        return !q || u.name.toLowerCase().includes(q) || (u.phone ?? '').includes(q) || (u.email ?? '').toLowerCase().includes(q)
    })

    return (
        <div className="min-h-screen bg-stone-50">
            <header className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="text-stone-400 hover:text-white text-sm transition-colors">← Товари</Link>
                    <Link href="/admin/orders" className="text-stone-400 hover:text-white text-sm transition-colors">Замовлення</Link>
                    <div>
                        <h1 className="font-bold text-lg">LiLu · Користувачі</h1>
                    </div>
                </div>
                <Link href="/" className="text-stone-400 hover:text-white text-sm">На сайт →</Link>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {[
                        { label: 'Всього', value: users.length, color: 'text-stone-800' },
                        { label: 'Адміни', value: users.filter(u => u.role === 'admin').length, color: 'text-amber-600' },
                        { label: 'Покупці', value: users.filter(u => u.role === 'user').length, color: 'text-blue-600' },
                    ].map(s => (
                        <div key={s.label} className="bg-white border border-stone-200 rounded-xl p-4">
                            <p className="text-xs text-stone-400 mb-1">{s.label}</p>
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div className="mb-4">
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Пошук за ім'ям, телефоном, email..."
                        className="w-full max-w-sm border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 bg-white" />
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                    {loading ? (
                        <div className="p-8 space-y-2">
                            {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-stone-100 rounded animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-stone-50 border-b border-stone-200">
                                    <tr>
                                        {['#', 'Ім\'я', 'Контакти', 'Замовлень', 'Роль', 'Зареєстрований', 'Дії'].map(h => (
                                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {filtered.map(u => (
                                        <tr key={u.id} className="hover:bg-stone-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-stone-400 text-xs">#{u.id}</td>
                                            <td className="px-4 py-3 font-medium text-stone-800">{u.name || <span className="text-stone-300 italic">без імені</span>}</td>
                                            <td className="px-4 py-3">
                                                {u.phone && <div className="text-stone-700 text-xs">{u.phone}</div>}
                                                {u.email && <div className="text-stone-400 text-xs">{u.email}</div>}
                                            </td>
                                            <td className="px-4 py-3 text-center font-semibold text-stone-700">{u._count.orders}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>
                                                    {u.role === 'admin' ? 'Адмін' : 'Покупець'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-stone-400">
                                                {new Date(u.createdAt).toLocaleDateString('uk-UA')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    disabled={updating === u.id}
                                                    value={u.role}
                                                    onChange={e => changeRole(u.id, e.target.value)}
                                                    className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-800 focus:outline-none focus:border-amber-400 cursor-pointer"
                                                >
                                                    <option value="user">Покупець</option>
                                                    <option value="admin">Адмін</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filtered.length === 0 && (
                                <div className="text-center py-12 text-stone-400">
                                    <p>Користувачів не знайдено</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
