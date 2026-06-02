'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CartDropdown from './CartDropdown'

type Me = { id: number; name: string; role: string } | null

export default function HeaderNav() {
    const [me, setMe] = useState<Me>(null)
    const [mobileOpen, setMobileOpen] = useState(false)
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
        <>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-6 text-sm text-stone-600 items-center">
                <Link href="/" className="hover:text-stone-900 transition-colors font-medium">
                    Каталог
                </Link>

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

            {/* Mobile Navigation Controls */}
            <div className="md:hidden flex items-center gap-3">
                <CartDropdown />
                
                <button
                    onClick={() => setMobileOpen(true)}
                    className="text-stone-700 hover:text-stone-900 focus:outline-none p-1 border border-stone-200 rounded-lg bg-stone-50"
                    aria-label="Menu"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Mobile Drawer Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity"
                        onClick={() => setMobileOpen(false)}
                    />
                    
                    {/* Drawer Content */}
                    <div className="relative w-80 max-w-full bg-white h-full shadow-2xl flex flex-col p-6 z-10 transition-transform duration-300 ease-out">
                        <div className="flex items-center justify-between mb-8">
                            <span className="font-bold text-stone-800 text-lg">Меню</span>
                            <button 
                                onClick={() => setMobileOpen(false)}
                                className="text-stone-400 hover:text-stone-700 text-xl p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex flex-col gap-6 text-base text-stone-600 flex-1">
                            <Link 
                                href="/" 
                                onClick={() => setMobileOpen(false)}
                                className="hover:text-stone-900 font-medium pb-2 border-b border-stone-100"
                            >
                                Каталог
                            </Link>

                            {me ? (
                                <>
                                    <Link 
                                        href="/account" 
                                        onClick={() => setMobileOpen(false)}
                                        className="hover:text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100"
                                    >
                                        <span>👤</span>
                                        <span>{me.name || 'Кабінет'}</span>
                                        {me.role === 'admin' && (
                                            <span className="bg-amber-500 text-stone-900 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">A</span>
                                        )}
                                    </Link>
                                    {me.role === 'admin' && (
                                        <Link 
                                            href="/admin" 
                                            onClick={() => setMobileOpen(false)}
                                            className="hover:text-stone-900 text-amber-600 font-semibold pb-2 border-b border-stone-100"
                                        >
                                            Адмін-панель
                                        </Link>
                                    )}
                                    <button 
                                        onClick={() => { logout(); setMobileOpen(false); }}
                                        className="text-left text-red-500 hover:text-red-600 font-medium pb-2 border-b border-stone-100"
                                    >
                                        Вийти з акаунта
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link 
                                        href="/login" 
                                        onClick={() => setMobileOpen(false)}
                                        className="hover:text-stone-900 font-medium pb-2 border-b border-stone-100"
                                    >
                                        Увійти
                                    </Link>
                                    <Link 
                                        href="/register" 
                                        onClick={() => setMobileOpen(false)}
                                        className="bg-stone-800 text-white hover:bg-stone-700 text-center py-2.5 rounded-xl transition-colors font-medium"
                                    >
                                        Реєстрація
                                    </Link>
                                </>
                            )}
                        </div>
                        
                        <div className="text-center text-xs text-stone-400 border-t border-stone-100 pt-4">
                            © 2026 LiLu · Взуттєва фабрика
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
