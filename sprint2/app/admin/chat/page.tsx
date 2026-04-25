'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

type Msg = { id: number; text: string; sender: 'user' | 'admin'; createdAt: string }
type Session = {
    id: number; guestName: string; guestEmail: string; status: string
    createdAt: string; updatedAt: string
    messages: Msg[]; _count: { messages: number }
}

const POLL_MS = 3000

export default function AdminChatPage() {
    const [sessions, setSessions] = useState<Session[]>([])
    const [active, setActive] = useState<number | null>(null)
    const [msgs, setMsgs] = useState<Msg[]>([])
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [filter, setFilter] = useState<'open' | 'closed' | 'all'>('open')
    const seenIds = useRef<Set<number>>(new Set())
    const lastTs = useRef<string | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)

    const loadSessions = useCallback(async () => {
        const res = await fetch('/api/admin/chat')
        const data = await res.json()
        if (Array.isArray(data)) setSessions(data)
    }, [])

    const loadMsgs = useCallback(async (id: number) => {
        const after = lastTs.current ? `&after=${encodeURIComponent(lastTs.current)}` : ''
        const res = await fetch(`/api/admin/chat/${id}?${after}`)
        const data = await res.json()
        if (data.messages?.length) {
            const fresh = data.messages.filter((m: Msg) => !seenIds.current.has(m.id))
            if (fresh.length) {
                fresh.forEach((m: Msg) => seenIds.current.add(m.id))
                lastTs.current = fresh[fresh.length - 1].createdAt
                setMsgs(prev => [...prev, ...fresh])
            }
        }
    }, [])

    // Poll sessions list
    useEffect(() => {
        loadSessions()
        const t = setInterval(loadSessions, POLL_MS)
        return () => clearInterval(t)
    }, [loadSessions])

    // Poll messages for active session
    useEffect(() => {
        if (!active) return
        // Reset on session switch
        seenIds.current = new Set()
        lastTs.current = null
        setMsgs([])
        loadMsgs(active)
        const t = setInterval(() => loadMsgs(active), POLL_MS)
        return () => clearInterval(t)
    }, [active, loadMsgs])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [msgs])

    // ── Send admin reply — NO optimistic, use server response to avoid duplicates ──
    const sendReply = async () => {
        if (!input.trim() || !active || sending) return
        const text = input.trim()
        setInput('')
        setSending(true)
        const res = await fetch(`/api/admin/chat/${active}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        })
        if (res.ok) {
            const msg: Msg = await res.json()
            // Add to seenIds so next poll won't add it again
            if (!seenIds.current.has(msg.id)) {
                seenIds.current.add(msg.id)
                if (msg.createdAt) lastTs.current = msg.createdAt
                setMsgs(prev => [...prev, msg])
            }
        }
        setSending(false)
        loadSessions() // refresh sidebar last-message preview
    }

    const toggleSession = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'open' ? 'closed' : 'open'
        await fetch(`/api/admin/chat/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        })
        setSessions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s))
    }

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

    const filtered = sessions.filter(s => filter === 'all' || s.status === filter)
    const activeSession = sessions.find(s => s.id === active)

    return (
        <div className="min-h-screen bg-stone-100 flex flex-col">
            {/* Header */}
            <header className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="text-stone-400 hover:text-white text-sm">← Товари</Link>
                    <Link href="/admin/orders" className="text-stone-400 hover:text-white text-sm">Замовлення</Link>
                    <Link href="/admin/users" className="text-stone-400 hover:text-white text-sm">Користувачі</Link>
                    <h1 className="font-bold text-lg">💬 Чат-підтримка</h1>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    {(['open', 'closed', 'all'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-full font-medium transition-colors ${filter === f ? 'bg-amber-500 text-stone-900' : 'text-stone-400 hover:text-white'}`}>
                            {f === 'open' ? 'Відкриті' : f === 'closed' ? 'Закриті' : 'Всі'}
                            {f !== 'all' && <span className="ml-1">({sessions.filter(s => s.status === f).length})</span>}
                        </button>
                    ))}
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-72 bg-white border-r border-stone-200 flex flex-col overflow-y-auto flex-shrink-0">
                    {filtered.length === 0 ? (
                        <div className="p-6 text-center text-stone-400 text-sm">Чатів немає</div>
                    ) : filtered.map(s => {
                        const lastMsg = s.messages[0]
                        const isActive = s.id === active
                        return (
                            <button key={s.id} onClick={() => setActive(s.id)}
                                className={`w-full text-left px-4 py-3 border-b border-stone-100 hover:bg-amber-50 transition-colors ${isActive ? 'bg-amber-50 border-l-2 border-l-amber-500' : ''}`}>
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="font-semibold text-stone-800 text-sm truncate">{s.guestName}</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${s.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-400'}`}>
                                        {s.status === 'open' ? '🟢' : '⬤'}
                                    </span>
                                </div>
                                {s.guestEmail && <p className="text-xs text-stone-400 mb-1 truncate">{s.guestEmail}</p>}
                                {lastMsg && (
                                    <p className="text-xs text-stone-500 truncate">
                                        {lastMsg.sender === 'admin' ? '↩ ' : ''}{lastMsg.text}
                                    </p>
                                )}
                                <p className="text-xs text-stone-300 mt-1">{formatTime(s.updatedAt)}</p>
                            </button>
                        )
                    })}
                </aside>

                {/* Chat area */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {!active ? (
                        <div className="flex-1 flex items-center justify-center text-stone-400">
                            <div className="text-center">
                                <div className="text-5xl mb-3">💬</div>
                                <p>Оберіть чат зі списку</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat header */}
                            <div className="bg-white border-b border-stone-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
                                <div>
                                    <p className="font-bold text-stone-800">{activeSession?.guestName}</p>
                                    <p className="text-xs text-stone-400">
                                        {activeSession?.guestEmail || 'без email'} · #{active} · {activeSession?._count.messages} повідомлень
                                    </p>
                                </div>
                                <button
                                    onClick={() => activeSession && toggleSession(active, activeSession.status)}
                                    className={`text-xs px-4 py-2 rounded-lg font-semibold transition-colors border ${activeSession?.status === 'open'
                                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200'
                                            : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'}`}>
                                    {activeSession?.status === 'open' ? '🔒 Закрити чат' : '🔓 Відновити чат'}
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-stone-50">
                                {msgs.length === 0 && (
                                    <p className="text-center text-stone-400 text-sm mt-8">Повідомлень ще немає</p>
                                )}
                                {msgs.map(m => (
                                    <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${m.sender === 'admin'
                                                ? 'bg-amber-500 text-stone-900 rounded-br-sm'
                                                : 'bg-white text-stone-800 border border-stone-200 rounded-bl-sm shadow-sm'}`}>
                                            {m.sender === 'user' && (
                                                <p className="text-xs font-semibold text-amber-700 mb-0.5">{activeSession?.guestName}</p>
                                            )}
                                            <p className="whitespace-pre-wrap">{m.text}</p>
                                            <p className={`text-xs mt-0.5 ${m.sender === 'admin' ? 'text-stone-700' : 'text-stone-400'}`}>
                                                {new Date(m.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {activeSession?.status === 'closed' && (
                                    <p className="text-center text-xs text-stone-400 bg-stone-100 rounded-lg px-4 py-2">
                                        Чат закрито
                                    </p>
                                )}
                                <div ref={bottomRef} />
                            </div>

                            {/* Reply input */}
                            <div className="bg-white border-t border-stone-200 px-4 py-3 flex gap-3 flex-shrink-0">
                                {activeSession?.status === 'closed' ? (
                                    <p className="text-sm text-stone-400 flex-1 py-2 text-center">
                                        Чат закрито — натисніть "🔓 Відновити чат" щоб продовжити
                                    </p>
                                ) : (
                                    <>
                                        <input
                                            value={input} onChange={e => setInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                                            placeholder="Напишіть відповідь..."
                                            className="flex-1 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-400"
                                            disabled={sending}
                                            autoFocus
                                        />
                                        <button onClick={sendReply} disabled={!input.trim() || sending}
                                            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
                                            {sending ? '...' : 'Надіслати →'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}
