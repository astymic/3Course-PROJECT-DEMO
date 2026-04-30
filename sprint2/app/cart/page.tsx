'use client'
import { useCart } from '@/context/CartContext'
import Link from 'next/link'

export default function CartPage() {
    const { items, remove, update, total, clear } = useCart()

    if (items.length === 0) {
        return (
            <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4">
                <div className="text-6xl">🛒</div>
                <h1 className="text-2xl font-bold text-stone-700">Кошик порожній</h1>
                <p className="text-stone-400">Додайте товари з каталогу</p>
                <Link href="/" className="mt-4 bg-stone-800 text-white px-6 py-2.5 rounded-lg hover:bg-stone-700 transition-colors font-medium">
                    До каталогу
                </Link>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-stone-50">
            <header className="bg-white border-b border-stone-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/" className="text-stone-400 hover:text-stone-700 transition-colors">← Каталог</Link>
                    <h1 className="text-xl font-bold text-stone-800">Кошик</h1>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Items list */}
                    <div className="lg:col-span-2 space-y-3">
                        {items.map(item => (
                            <div key={`${item.productId}-${item.size}`}
                                className="bg-white rounded-xl border border-stone-100 p-4 flex gap-4 items-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-stone-100 to-stone-200 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                                    👟
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-stone-800 text-sm truncate">{item.name}</h3>
                                    <p className="text-xs text-stone-400">{item.color} · розмір {item.size}</p>
                                    <p className="text-sm font-bold text-stone-700 mt-1">{item.price.toLocaleString()} ₴</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => update(item.productId, item.size, item.quantity - 1)}
                                        className="w-7 h-7 rounded-full border border-stone-200 text-stone-600 hover:border-stone-400 flex items-center justify-center font-bold"
                                    >−</button>
                                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                                    <button
                                        onClick={() => update(item.productId, item.size, item.quantity + 1)}
                                        className="w-7 h-7 rounded-full border border-stone-200 text-stone-600 hover:border-stone-400 flex items-center justify-center font-bold"
                                    >+</button>
                                </div>
                                <button
                                    onClick={() => remove(item.productId, item.size)}
                                    className="text-red-400 hover:text-red-600 ml-2 transition-colors"
                                >✕</button>
                            </div>
                        ))}

                        <button onClick={clear} className="text-sm text-stone-400 hover:text-red-500 transition-colors underline">
                            Очистити кошик
                        </button>
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-stone-100 p-6 sticky top-24">
                            <h2 className="font-bold text-stone-800 text-lg mb-4">Підсумок</h2>
                            <div className="space-y-2 mb-4">
                                {items.map(i => (
                                    <div key={`${i.productId}-${i.size}`} className="flex justify-between text-sm text-stone-600">
                                        <span className="truncate mr-2">{i.name} (×{i.quantity})</span>
                                        <span className="flex-shrink-0">{(i.price * i.quantity).toLocaleString()} ₴</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-stone-100 pt-3 mb-5">
                                <div className="flex justify-between font-bold text-stone-800">
                                    <span>Разом</span>
                                    <span>{total.toLocaleString()} ₴</span>
                                </div>
                            </div>
                            <Link
                                href="/checkout"
                                className="block w-full text-center bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold py-3 rounded-xl transition-colors"
                            >
                                Оформити замовлення →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
