'use client'

type Category = { id: number; name: string; slug: string }
type Filters = { category: string; color: string; size: string; minPrice: string; maxPrice: string }

interface Props {
    categories: Category[]
    colors: string[]
    sizes: number[]
    filters: Filters
    onChange: (f: Filters) => void
}

export default function FilterPanel({ categories, colors, sizes, filters, onChange }: Props) {
    const set = (key: keyof Filters, val: string) => {
        onChange({ ...filters, [key]: filters[key] === val ? '' : val })
    }

    return (
        <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-6 sticky top-24">
            <h3 className="font-semibold text-stone-800 text-sm uppercase tracking-wider">Фільтри</h3>

            {/* Category */}
            <div>
                <p className="text-xs font-medium text-stone-500 mb-3 uppercase tracking-wide">Категорія</p>
                <div className="space-y-1">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => set('category', cat.slug)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${filters.category === cat.slug
                                    ? 'bg-stone-800 text-white font-medium'
                                    : 'text-stone-600 hover:bg-stone-50'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sizes */}
            <div>
                <p className="text-xs font-medium text-stone-500 mb-3 uppercase tracking-wide">Розмір</p>
                <div className="grid grid-cols-4 gap-1.5">
                    {sizes.map(s => (
                        <button
                            key={s}
                            onClick={() => set('size', String(s))}
                            className={`py-1.5 rounded-lg text-sm font-medium transition-all border ${filters.size === String(s)
                                    ? 'bg-stone-800 text-white border-stone-800'
                                    : 'border-stone-200 text-stone-600 hover:border-stone-400'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Color */}
            <div>
                <p className="text-xs font-medium text-stone-500 mb-3 uppercase tracking-wide">Колір</p>
                <div className="flex flex-wrap gap-2">
                    {colors.map(c => (
                        <button
                            key={c}
                            onClick={() => set('color', c)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filters.color === c
                                    ? 'bg-stone-800 text-white border-stone-800'
                                    : 'border-stone-200 text-stone-600 hover:border-stone-400'
                                }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Price */}
            <div>
                <p className="text-xs font-medium text-stone-500 mb-3 uppercase tracking-wide">Ціна (грн)</p>
                <div className="flex gap-2 items-center">
                    <input
                        type="number"
                        placeholder="Від"
                        value={filters.minPrice}
                        onChange={e => onChange({ ...filters, minPrice: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-400"
                    />
                    <span className="text-stone-300">—</span>
                    <input
                        type="number"
                        placeholder="До"
                        value={filters.maxPrice}
                        onChange={e => onChange({ ...filters, maxPrice: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-400"
                    />
                </div>
            </div>
        </div>
    )
}
