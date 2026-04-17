import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LiLu — Взуттєва фабрика',
  description: 'Офіційний інтернет-магазин взуттєвої фабрики LiLu. Каталог з фільтрами, залишки в реальному часі.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className="antialiased">{children}</body>
    </html>
  )
}
