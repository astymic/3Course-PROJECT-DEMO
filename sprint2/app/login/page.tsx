'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
    const router = useRouter()
    const params = useSearchParams()
    const redirect = params.get('redirect') ?? '/'
    const expired = params.get('expired') === '1'

    const [login, setLogin] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(expired ? 'Сесія закінчилась, увійдіть знову' : '')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true); setError('')
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Помилка'); setLoading(false); return }
        router.push(redirect)
        router.refresh()
    }

    return (
        <main className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <Link href="/" className="text-3xl font-bold text-stone-800 tracking-tight">LiLu</Link>
                    <p className="text-stone-400 text-sm mt-1">Взуттєва фабрика</p>
                </div>

                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-8">
                    <h1 className="text-xl font-bold text-stone-800 mb-6">Увійти</h1>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-stone-500 mb-1.5">Телефон або Email</label>
                            <input
                                value={login} onChange={e => setLogin(e.target.value)} required autoFocus
                                placeholder="+380... або email@example.com"
                                className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-stone-500 mb-1.5">Пароль</label>
                            <input
                                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                                placeholder="••••••••"
                                className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                            />
                        </div>

                        {error && (
                            <p className="text-red-600 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">⚠️ {error}</p>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-900 font-bold py-3 rounded-xl transition-colors">
                            {loading ? 'Вхід...' : 'Увійти'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-stone-400 mt-5">
                        Немає акаунту?{' '}
                        <Link href="/register" className="text-amber-600 hover:text-amber-700 font-medium underline">
                            Зареєструватись
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    )
}
