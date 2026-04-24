'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type CartItem = {
    productId: number
    name: string
    price: number
    color: string
    size: number
    quantity: number
    imageUrl: string
}

type CartCtx = {
    items: CartItem[]
    add: (item: CartItem) => void
    remove: (productId: number, size: number) => void
    update: (productId: number, size: number, qty: number) => void
    clear: () => void
    total: number
    count: number
}

const CartContext = createContext<CartCtx | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('lilu_cart')
            if (saved) setItems(JSON.parse(saved))
        } catch { }
    }, [])

    // Persist to localStorage on change
    useEffect(() => {
        localStorage.setItem('lilu_cart', JSON.stringify(items))
    }, [items])

    const add = (item: CartItem) => {
        setItems(prev => {
            const existing = prev.find(i => i.productId === item.productId && i.size === item.size)
            if (existing) {
                return prev.map(i =>
                    i.productId === item.productId && i.size === item.size
                        ? { ...i, quantity: i.quantity + item.quantity }
                        : i
                )
            }
            return [...prev, item]
        })
    }

    const remove = (productId: number, size: number) => {
        setItems(prev => prev.filter(i => !(i.productId === productId && i.size === size)))
    }

    const update = (productId: number, size: number, qty: number) => {
        if (qty <= 0) { remove(productId, size); return }
        setItems(prev => prev.map(i =>
            i.productId === productId && i.size === size ? { ...i, quantity: qty } : i
        ))
    }

    const clear = () => setItems([])

    const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0)
    const count = items.reduce((acc, i) => acc + i.quantity, 0)

    return (
        <CartContext.Provider value={{ items, add, remove, update, clear, total, count }}>
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => {
    const ctx = useContext(CartContext)
    if (!ctx) throw new Error('useCart must be inside CartProvider')
    return ctx
}
