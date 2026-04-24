'use client'
import { useEffect, useState } from 'react'
import ProductTable from '@/components/admin/ProductTable'
import ProductForm from '@/components/admin/ProductForm'

type Category = { id: number; name: string; slug: string }
type Size = { id: number; size: number; quantity: number }
type Product = {
    id: number; name: string; description: string; price: number
    material: string; color: string; imageUrl: string; isActive: boolean; category: Category; sizes: Size[]
}

export default function AdminPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [view, setView] = useState<'list' | 'add' | 'edit'>('list')
    const [editing, setEditing] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)

    const refresh = () => {
        setLoading(true)
        fetch('/api/products').then(r => r.json()).then(data => {
            setProducts(Array.isArray(data) ? data : [])
            setLoading(false)
        })
    }

    useEffect(() => {
        fetch('/api/categories').then(r => r.json()).then(setCategories)
        refresh()
    }, [])

    const handleDelete = async (id: number) => {
        if (!confirm('Видалити товар?')) return
        await fetch(`/api/products/${id}`, { method: 'DELETE' })
        refresh()
    }

    const handleEdit = (product: Product) => {
        setEditing(product)
        setView('edit')
    }

    const handleSave = async (data: Record<string, unknown>) => {
        if (view === 'edit' && editing) {
            await fetch(`/api/products/${editing.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
        } else {
            await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
        }
        setView('list')
        setEditing(null)
        refresh()
    }

    const totalStock = products.reduce((acc, p) => acc + p.sizes.reduce((a, s) => a + s.quantity, 0), 0)
    const activeCount = products.filter(p => p.isActive).length
    const lowStock = products.filter(p => p.sizes.some(s => s.quantity > 0 && s.quantity <= 2)).length

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Admin Header */}
            <header className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <a href="/" className="text-stone-400 hover:text-white transition-colors text-sm">← Сайт</a>
                    <div>
                        <h1 className="font-bold text-lg">LiLu Адмін</h1>
                        <p className="text-stone-400 text-xs">Управління товарами та залишками</p>
                    </div>
                </div>
                {view === 'list' && (
                    <button
                        onClick={() => { setEditing(null); setView('add') }}
                        className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                        + Додати товар
                    </button>
                )}
                {view !== 'list' && (
                    <button
                        onClick={() => { setView('list'); setEditing(null) }}
                        className="border border-stone-600 hover:border-stone-400 text-stone-300 px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                        ← Назад до списку
                    </button>
                )}
            </header>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Stats */}
                {view === 'list' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Всього товарів', value: products.length, color: 'text-stone-800' },
                            { label: 'Активних', value: activeCount, color: 'text-green-600' },
                            { label: 'Одиниць на складі', value: totalStock, color: 'text-blue-600' },
                            { label: 'Мало залишків (≤2)', value: lowStock, color: lowStock > 0 ? 'text-red-500' : 'text-stone-400' },
                        ].map(s => (
                            <div key={s.label} className="bg-white border border-stone-200 rounded-xl p-4">
                                <p className="text-xs text-stone-400 mb-1">{s.label}</p>
                                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Content */}
                {view === 'list' && (
                    <ProductTable
                        products={products}
                        loading={loading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
                {(view === 'add' || view === 'edit') && (
                    <ProductForm
                        categories={categories}
                        initialData={editing}
                        onSave={handleSave}
                        onCancel={() => { setView('list'); setEditing(null) }}
                    />
                )}
            </div>
        </div>
    )
}
