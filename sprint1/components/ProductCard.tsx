'use client'

type Size = { id: number; size: number; quantity: number }
type Category = { id: number; name: string; slug: string }
type Product = {
    id: number; name: string; price: number; color: string; imageUrl: string; category: Category; sizes: Size[]
}

export default function ProductCard({ product }: { product: Product }) {
    const availableSizes = product.sizes.filter(s => s.quantity > 0)
    const soldOut = availableSizes.length === 0

    return (
        <div className={`bg-white rounded-xl border border-stone-100 overflow-hidden hover:shadow-md transition-all duration-200 group ${soldOut ? 'opacity-60' : ''}`}>
            {/* Image placeholder */}
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

            <div className="p-4">
                <h3 className="font-semibold text-stone-800 text-sm mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-xs text-stone-400 mb-2">{product.color}</p>

                {/* Sizes availability */}
                <div className="flex flex-wrap gap-1 mb-3">
                    {product.sizes.map(s => (
                        <span
                            key={s.id}
                            className={`text-xs px-1.5 py-0.5 rounded border font-medium ${s.quantity > 0
                                    ? 'border-stone-300 text-stone-600'
                                    : 'border-stone-100 text-stone-300 line-through'
                                }`}
                        >
                            {s.size}
                        </span>
                    ))}
                </div>

                <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-800 text-lg">{product.price.toLocaleString()} ₴</span>
                    <button
                        disabled={soldOut}
                        className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        До кошика
                    </button>
                </div>
            </div>
        </div>
    )
}
