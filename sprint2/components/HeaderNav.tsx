'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CartDropdown from './CartDropdown'

type Me = { id: number; name: string; role: string } | null

export default function HeaderNav() {
    const [me, setMe] = useState<Me>(null)
    const router = useRouter()

    useEffect(() => {
        fetch('/api/auth/me').then(r => r.json()).then(setMe)
    }, [])

    const logout = async () => {
        await fetch('/api/auth/me', { method: 'DELETE' })
        setMe(null)
        router.refresh()
    }

    return (
        <nav className="hidden md:flex gap-6 text-sm text-stone-600 items-center">
            <a href="#" className="hover:text-stone-900 transition-colors font-medium border-b-2 border-stone-800 pb-0.5">
                Каталог
            </a>

            {me ? (
                <>
                    <Link href="/account" className="hover:text-stone-900 transition-colors flex items-center gap-1">
                        <span>👤</span>
                        <span>{me.name || 'Кабінет'}</span>
                        {me.role === 'admin' && (
                            <span className="bg-amber-500 text-stone-900 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">A</span>
                        )}
                    </Link>
                    {me.role === 'admin' && (
                        <Link href="/admin" className="hover:text-stone-900 transition-colors text-amber-600 font-medium">
                            Адмін
                        </Link>
                    )}
                    <button onClick={logout} className="text-stone-400 hover:text-red-500 transition-colors text-xs">
                        Вийти
                    </button>
                </>
            ) : (
                <>
                    <Link href="/login" className="hover:text-stone-900 transition-colors">
                        Увійти
                    </Link>
                    <Link href="/register"
                        className="bg-stone-800 text-white hover:bg-stone-700 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium">
                        Реєстрація
                    </Link>
                </>
            )}

            <CartDropdown />
        </nav>
    )
}
