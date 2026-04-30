'use client'
import { useState, useEffect } from 'react'

type Category = { id: number; name: string }
type Size = { size: number; quantity: number }
type Product = {
    id?: number; name: string; description: string; price: number
    material: string; color: string; imageUrl: string; isActive: boolean
    categoryId?: number; category?: { id: number }; sizes: Size[]
}

const SIZES = [35, 36, 37, 38, 39, 40, 41, 42]

interface Props {
    categories: Category[]
    initialData: Product | null
    onSave: (data: Record<string, unknown>) => void
    onCancel: () => void
}

export default function ProductForm({ categories, initialData, onSave, onCancel }: Props) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState('')
    const [material, setMaterial] = useState('')
    const [color, setColor] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [isActive, setIsActive] = useState(true)
    const [sizes, setSizes] = useState<Size[]>(SIZES.map(s => ({ size: s, quantity: 0 })))

    useEffect(() => {
        if (initialData) {
            setName(initialData.name)
            setDescription(initialData.description)
            setPrice(String(initialData.price))
            setMaterial(initialData.material)
            setColor(initialData.color)
            setImageUrl(initialData.imageUrl)
            setCategoryId(String(initialData.category?.id ?? initialData.categoryId ?? ''))
            setIsActive(initialData.isActive)
            const sizeMap = new Map(initialData.sizes.map(s => [s.size, s.quantity]))
            setSizes(SIZES.map(s => ({ size: s, quantity: sizeMap.get(s) ?? 0 })))
        }
    }, [initialData])

    const updateQty = (size: number, qty: number) => {
        setSizes(prev => prev.map(s => s.size === size ? { ...s, quantity: Math.max(0, qty) } : s))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave({ name, description, price, material, color, imageUrl, categoryId, isActive, sizes })
    }

    return (
        <div className="max-w-3xl">
            <h2 className="text-xl font-bold text-stone-800 mb-6">
                {initialData ? `Редагувати: ${initialData.name}` : 'Новий товар'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic info */}
                <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
                    <h3 className="font-semibold text-stone-700 text-sm uppercase tracking-wide mb-2">Основна інформація</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-stone-600 mb-1">Назва товару *</label>
                            <input required value={name} onChange={e => setName(e.target.value)}
                                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
                                placeholder="Туфлі «Весна»" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-stone-600 mb-1">Опис</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)}
                                rows={3}
                                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400 resize-none"
                                placeholder="Опис товару..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1">Ціна (грн) *</label>
                            <input required type="number" value={price} onChange={e => setPrice(e.target.value)}
                                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
                                placeholder="2800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1">Категорія *</label>
                            <select required value={categoryId} onChange={e => setCategoryId(e.target.value)}
                                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400 bg-white">
                                <option value="">Оберіть категорію</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1">Матеріал</label>
                            <input value={material} onChange={e => setMaterial(e.target.value)}
                                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
                                placeholder="Натуральна шкіра" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1">Колір</label>
                            <input value={color} onChange={e => setColor(e.target.value)}
                                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
                                placeholder="Чорний" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1">URL зображення</label>
                            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
                                placeholder="/images/product.jpg" />
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                                className="w-4 h-4 accent-stone-700" />
                            <label htmlFor="isActive" className="text-sm font-medium text-stone-600">Активний (показується в каталозі)</label>
                        </div>
                    </div>
                </div>

                {/* Stock per size */}
                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <h3 className="font-semibold text-stone-700 text-sm uppercase tracking-wide mb-4">Залишки по розмірах</h3>
                    <p className="text-xs text-stone-400 mb-4">0 = розмір недоступний, показується перекресленим для покупця</p>
                    <div className="grid grid-cols-4 gap-3">
                        {sizes.map(s => (
                            <div key={s.size} className="text-center">
                                <div className={`text-sm font-bold mb-1 ${s.quantity === 0 ? 'text-stone-300' : s.quantity <= 2 ? 'text-amber-600' : 'text-green-600'
                                    }`}>
                                    {s.size}
                                </div>
                                <input
                                    type="number"
                                    min={0}
                                    value={s.quantity}
                                    onChange={e => updateQty(s.size, parseInt(e.target.value) || 0)}
                                    className={`w-full border rounded-lg px-2 py-2 text-sm text-center focus:outline-none transition-colors ${s.quantity === 0 ? 'border-stone-100 text-stone-300' :
                                            s.quantity <= 2 ? 'border-amber-300 text-amber-700' : 'border-green-200 text-green-700'
                                        }`}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 flex gap-4 text-xs text-stone-400">
                        <span className="text-green-600">■ Є в наявності</span>
                        <span className="text-amber-600">■ Мало (1-2 шт.)</span>
                        <span>■ Немає</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button type="submit"
                        className="bg-stone-800 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-stone-700 transition-colors text-sm">
                        {initialData ? 'Зберегти зміни' : 'Додати товар'}
                    </button>
                    <button type="button" onClick={onCancel}
                        className="border border-stone-200 text-stone-600 px-6 py-2.5 rounded-lg font-medium hover:bg-stone-50 transition-colors text-sm">
                        Скасувати
                    </button>
                </div>
            </form>
        </div>
    )
}
