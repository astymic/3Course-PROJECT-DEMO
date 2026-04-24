'use client'
import { useState, useRef, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import Link from 'next/link'

export default function CartDropdown() {
    const { items, count, total, remove } = useCart()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div ref={ref} className="relative">
            {/* Cart button */}
            <button
                id="cart-toggle"
                onClick={() => setOpen(v => !v)}
                className="relative flex items-center gap-1.5 text-stone-700 hover:text-stone-900 transition-colors"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                <span className="text-sm font-medium hidden sm:inline">Кошик</span>
                {count > 0 && (
                    <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-stone-100 z-50 overflow-hidden">
                    {/* Arrow */}
                    <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-l border-t border-stone-100 rotate-45" />

                    {items.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="text-4xl mb-2">🛒</div>
                            <p className="text-stone-500 text-sm">Кошик порожній</p>
                            <p className="text-stone-400 text-xs mt-1">Додайте товари з каталогу</p>
                        </div>
                    ) : (
                        <>
                            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                                <span className="font-semibold text-stone-800 text-sm">Кошик ({count})</span>
                                <span className="text-xs text-stone-400">{total.toLocaleString()} ₴</span>
                            </div>

                            {/* Items list */}
                            <div className="max-h-64 overflow-y-auto divide-y divide-stone-50">
                                {items.map(item => (
                                    <div key={`${item.productId}-${item.size}`}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors">
                                        <div className="w-10 h-10 bg-gradient-to-br from-stone-100 to-stone-200 rounded-lg flex-shrink-0 flex items-center justify-center text-lg">
                                            👟
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-stone-800 truncate">{item.name}</p>
                                            <p className="text-xs text-stone-400">р.{item.size} · {item.color} · ×{item.quantity}</p>
                                            <p className="text-xs font-bold text-stone-700">{(item.price * item.quantity).toLocaleString()} ₴</p>
                                        </div>
                                        <button
                                            onClick={() => remove(item.productId, item.size)}
                                            className="text-stone-300 hover:text-red-400 transition-colors text-sm flex-shrink-0"
                                        >✕</button>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-stone-100 bg-stone-50">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-stone-600">Разом</span>
                                    <span className="text-lg font-bold text-stone-800">{total.toLocaleString()} ₴</span>
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        href="/cart"
                                        onClick={() => setOpen(false)}
                                        className="flex-1 text-center border border-stone-300 text-stone-700 hover:border-stone-500 py-2 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        Кошик
                                    </Link>
                                    <Link
                                        href="/checkout"
                                        onClick={() => setOpen(false)}
                                        className="flex-1 text-center bg-amber-500 hover:bg-amber-400 text-stone-900 py-2 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        Оформити →
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
