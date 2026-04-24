'use client'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'

type Size = { id: number; size: number; quantity: number }
type Category = { id: number; name: string; slug: string }
type Product = {
    id: number; name: string; price: number; color: string
    imageUrl: string; category: Category; sizes: Size[]
}

export default function ProductCard({ product }: { product: Product }) {
    const { add } = useCart()
    const [selectedSize, setSelectedSize] = useState<number | null>(null)
    const [added, setAdded] = useState(false)

    const availableSizes = product.sizes.filter(s => s.quantity > 0)
    const soldOut = availableSizes.length === 0

    const handleAdd = () => {
        if (!selectedSize) return
        add({
            productId: product.id,
            name: product.name,
            price: product.price,
            color: product.color,
            size: selectedSize,
            quantity: 1,
            imageUrl: product.imageUrl,
        })
        setAdded(true)
        setTimeout(() => setAdded(false), 1500)
    }

    return (
        <div className={`bg-white rounded-xl border border-stone-100 overflow-hidden hover:shadow-md transition-all duration-200 group flex flex-col ${soldOut ? 'opacity-60' : ''}`}>
            {/* Image */}
            <div className="aspect-square bg-gradient-to-br from-stone-100 to-stone-200 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-300">
                    👟
                </div>
                {soldOut && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Немає
                    </div>
                )}
                <div className="absolute top-3 left-3 bg-white/90 text-stone-600 text-xs px-2 py-1 rounded-full">
                    {product.category.name}
                </div>
            </div>

            <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-stone-800 text-sm mb-1">{product.name}</h3>
                <p className="text-xs text-stone-400 mb-3">{product.color}</p>

                {/* Size picker */}
                {!soldOut && (
                    <div className="mb-3">
                        <p className="text-xs text-stone-400 mb-1">Оберіть розмір:</p>
                        <div className="flex flex-wrap gap-1">
                            {product.sizes.map(s => (
                                <button
                                    key={s.id}
                                    disabled={s.quantity === 0}
                                    onClick={() => setSelectedSize(s.size === selectedSize ? null : s.size)}
                                    className={`text-xs px-2 py-1 rounded border font-medium transition-all ${s.quantity === 0
                                            ? 'border-stone-100 text-stone-300 cursor-not-allowed line-through'
                                            : selectedSize === s.size
                                                ? 'border-stone-800 bg-stone-800 text-white'
                                                : 'border-stone-300 text-stone-600 hover:border-stone-600'
                                        }`}
                                >
                                    {s.size}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between mt-auto">
                    <span className="font-bold text-stone-800 text-lg">{product.price.toLocaleString()} ₴</span>
                    {!soldOut && (
                        <button
                            onClick={handleAdd}
                            disabled={!selectedSize}
                            className={`text-xs px-3 py-1.5 rounded-lg transition-all font-medium ${added
                                    ? 'bg-green-600 text-white'
                                    : selectedSize
                                        ? 'bg-stone-800 text-white hover:bg-stone-700'
                                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                }`}
                        >
                            {added ? 'Додано ✓' : selectedSize ? 'До кошика' : 'Оберіть розмір'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
