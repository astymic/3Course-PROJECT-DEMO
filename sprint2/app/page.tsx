'use client'
import { useEffect, useState } from 'react'
import FilterPanel from '@/components/FilterPanel'
import ProductCard from '@/components/ProductCard'
import CartDropdown from '@/components/CartDropdown'

// Constants OUTSIDE the component — no recreation on every render
const COLORS = ['Чорний', 'Бежевий', 'Коричневий', 'Білий', 'Синій', 'Червоний']
const SIZES = [35, 36, 37, 38, 39, 40, 41, 42]

type Category = { id: number; name: string; slug: string; season: string }
type Size = { id: number; size: number; quantity: number }
type Product = {
  id: number; name: string; description: string; price: number
  material: string; color: string; imageUrl: string; category: Category; sizes: Size[]
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Individual primitive state — avoids object reference change on every render
  const [category, setCategory] = useState('')
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  // Load categories once
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(setCategories)
  }, [])

  // Load products. Deps are PRIMITIVES — no object reference issues.
  // AbortController prevents race conditions when filters change rapidly.
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)

    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (color) params.set('color', color)
    if (size) params.set('size', size)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)

    fetch(`/api/products?${params}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        if (err.name !== 'AbortError') setLoading(false)
      })

    // Cleanup: cancel request if component unmounts or deps change
    return () => controller.abort()
  }, [category, color, size, minPrice, maxPrice]) // ← primitives, NOT an object

  // Build filters object for FilterPanel (read-only, no state)
  const filters = { category, color, size, minPrice, maxPrice }

  const handleFilterChange = (f: typeof filters) => {
    setCategory(f.category)
    setColor(f.color)
    setSize(f.size)
    setMinPrice(f.minPrice)
    setMaxPrice(f.maxPrice)
  }

  const hasActiveFilters = category || color || size || minPrice || maxPrice

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-800 tracking-tight">LiLu</h1>
            <p className="text-xs text-stone-400 mt-0.5">Взуттєва фабрика</p>
          </div>
          <nav className="hidden md:flex gap-8 text-sm text-stone-600 items-center">
            <a href="#" className="hover:text-stone-900 transition-colors font-medium border-b-2 border-stone-800 pb-0.5">
              Каталог
            </a>
            <a href="/admin" className="hover:text-stone-900 transition-colors">
              Адмін-панель
            </a>
            <CartDropdown />
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-300 via-transparent to-transparent" />
          <div className="relative">
            <p className="text-amber-400 text-sm font-medium mb-2 uppercase tracking-widest">
              LiLu Collection 2026
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Взуття, яке говорить<br />про вас
            </h2>
            <p className="text-stone-400 max-w-md">
              Власне виробництво. Натуральні матеріали. Кожна пара — з душею.
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <FilterPanel
              categories={categories}
              colors={COLORS}
              sizes={SIZES}
              filters={filters}
              onChange={handleFilterChange}
            />
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-stone-700">
                {loading ? 'Завантаження...' : `${products.length} товарів`}
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={() => handleFilterChange({
                    category: '', color: '', size: '', minPrice: '', maxPrice: ''
                  })}
                  className="text-sm text-stone-500 hover:text-stone-800 underline transition-colors"
                >
                  Скинути фільтри
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl h-72 animate-pulse border border-stone-100" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-stone-400">
                <div className="text-5xl mb-4">👟</div>
                <p className="text-lg font-medium">Товари не знайдено</p>
                <p className="text-sm mt-1">Спробуйте змінити фільтри</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
