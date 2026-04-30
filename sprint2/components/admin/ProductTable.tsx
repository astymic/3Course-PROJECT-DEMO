'use client'

type Size = { id: number; size: number; quantity: number }
type Category = { id: number; name: string }
type Product = {
    id: number; name: string; price: number; color: string
    isActive: boolean; category: Category; sizes: Size[]
}

interface Props {
    products: Product[]
    loading: boolean
    onEdit: (p: Product) => void
    onDelete: (id: number) => void
}

export default function ProductTable({ products, loading, onEdit, onDelete }: Props) {
    if (loading) return (
        <div className="bg-white rounded-xl border border-stone-200 p-8">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-stone-100 rounded-lg mb-2 animate-pulse" />
            ))}
        </div>
    )

    return (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Товар</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Категорія</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Ціна</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Залишки по розмірах</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Статус</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {products.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-12 text-stone-400">Немає товарів</td></tr>
                        )}
                        {products.map(p => {
                            const totalQty = p.sizes.reduce((a, s) => a + s.quantity, 0)
                            const hasLowStock = p.sizes.some(s => s.quantity > 0 && s.quantity <= 2)
                            return (
                                <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-stone-800">{p.name}</div>
                                        <div className="text-xs text-stone-400">{p.color}</div>
                                    </td>
                                    <td className="px-4 py-3 text-stone-600">{p.category.name}</td>
                                    <td className="px-4 py-3 font-semibold text-stone-800">{p.price.toLocaleString()} ₴</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {p.sizes.map(s => (
                                                <span
                                                    key={s.id}
                                                    title={`Розмір ${s.size}: ${s.quantity} шт.`}
                                                    className={`text-xs px-1.5 py-0.5 rounded border font-mono ${s.quantity === 0
                                                            ? 'border-red-100 text-red-300 bg-red-50'
                                                            : s.quantity <= 2
                                                                ? 'border-amber-300 text-amber-700 bg-amber-50'
                                                                : 'border-green-200 text-green-700 bg-green-50'
                                                        }`}
                                                >
                                                    {s.size}: {s.quantity}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="text-xs text-stone-400 mt-1">
                                            Всього: {totalQty} шт.
                                            {hasLowStock && <span className="text-amber-600 ml-2 font-medium">⚠ Мало</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
                                            }`}>
                                            {p.isActive ? 'Активний' : 'Прихований'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => onEdit(p)}
                                                className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg hover:bg-stone-700 transition-colors"
                                            >
                                                Редагувати
                                            </button>
                                            <button
                                                onClick={() => onDelete(p.id)}
                                                className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                            >
                                                Видалити
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
