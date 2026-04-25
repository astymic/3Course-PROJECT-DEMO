'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (!phone && !email) { setError('Вкажіть телефон або email'); return }
        if (password.length < 6) { setError('Пароль — мінімум 6 символів'); return }
        if (password !== confirm) { setError('Паролі не збігаються'); return }

        setLoading(true)
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone: phone || null, email: email || null, password }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Помилка'); setLoading(false); return }
        router.push('/account')
        router.refresh()
    }

    const inputCls = "w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"

    return (
        <main className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <Link href="/" className="text-3xl font-bold text-stone-800 tracking-tight">LiLu</Link>
                    <p className="text-stone-400 text-sm mt-1">Взуттєва фабрика</p>
                </div>

                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-8">
                    <h1 className="text-xl font-bold text-stone-800 mb-6">Реєстрація</h1>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-stone-500 mb-1.5">Ім'я</label>
                            <input value={name} onChange={e => setName(e.target.value)}
                                placeholder="Ваше ім'я" className={inputCls} />
                        </div>

                        <div>
                            <label className="block text-sm text-stone-500 mb-1.5">Телефон</label>
                            <input type="tel" value={phone}
                                onChange={e => setPhone(e.target.value.replace(/[^\d+\-\s()]/g, ''))}
                                placeholder="+380 XX XXX XX XX" className={inputCls} />
                        </div>

                        <div>
                            <label className="block text-sm text-stone-500 mb-1.5">Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="email@example.com" className={inputCls} />
                        </div>

                        <p className="text-xs text-stone-400 -mt-2">Вкажіть телефон або email (або обидва)</p>

                        <div>
                            <label className="block text-sm text-stone-500 mb-1.5">Пароль *</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                                placeholder="Мінімум 6 символів" required className={inputCls} />
                        </div>

                        <div>
                            <label className="block text-sm text-stone-500 mb-1.5">Підтвердження пароля *</label>
                            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                                placeholder="Повторіть пароль" required className={inputCls} />
                        </div>

                        {error && (
                            <p className="text-red-600 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">⚠️ {error}</p>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-900 font-bold py-3 rounded-xl transition-colors">
                            {loading ? 'Реєстрація...' : 'Зареєструватись'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-stone-400 mt-5">
                        Вже є акаунт?{' '}
                        <Link href="/login" className="text-amber-600 hover:text-amber-700 font-medium underline">
                            Увійти
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    )
}
