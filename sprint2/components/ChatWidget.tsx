'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

type Msg = { id: number; text: string; sender: 'user' | 'admin'; createdAt: string }

const LS_SESSION = 'lilu_chat_session'
const LS_NAME = 'lilu_chat_name'
const POLL_MS = 3000

export default function ChatWidget() {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<'intro' | 'chat'>('intro')
    const [guestName, setGuestName] = useState('')
    const [guestEmail, setGuestEmail] = useState('')
    const [session, setSession] = useState<{ id: number; token: string } | null>(null)
    const [msgs, setMsgs] = useState<Msg[]>([])
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [closed, setClosed] = useState(false)
    const [unread, setUnread] = useState(0)
    const lastTs = useRef<string | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Load existing session from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(LS_SESSION)
            if (saved) {
                const s = JSON.parse(saved)
                setSession(s)
                setStep('chat')
                const name = localStorage.getItem(LS_NAME) ?? ''
                setGuestName(name)
            }
        } catch { /* ignore */ }
    }, [])

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [msgs])

    // Poll for new messages
    const pollMessages = useCallback(async (s: { id: number; token: string }) => {
        try {
            const url = `/api/chat/sessions/${s.id}/messages?token=${s.token}${lastTs.current ? `&after=${lastTs.current}` : ''}`
            const res = await fetch(url)
            const data = await res.json()
            if (data.messages?.length) {
                setMsgs(prev => {
                    const newMsgs = data.messages.filter((m: Msg) => !prev.find(p => p.id === m.id))
                    if (newMsgs.length) {
                        lastTs.current = newMsgs[newMsgs.length - 1].createdAt
                        // Count unread admin messages only when widget is closed
                        if (!open) setUnread(u => u + newMsgs.filter((m: Msg) => m.sender === 'admin').length)
                    }
                    return [...prev, ...newMsgs]
                })
            }
            if (data.status === 'closed') setClosed(true)
        } catch { /* network error */ }
    }, [open])

    useEffect(() => {
        if (!session) return
        // Initial load
        if (msgs.length === 0) pollMessages(session)
        pollRef.current = setInterval(() => pollMessages(session), POLL_MS)
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [session, pollMessages, msgs.length])

    // Clear unread on open
    useEffect(() => { if (open) setUnread(0) }, [open])

    const startChat = async () => {
        if (!guestName.trim()) return
        const res = await fetch('/api/chat/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guestName, guestEmail }),
        })
        const data = await res.json()
        const s = { id: data.id, token: data.token }
        setSession(s)
        localStorage.setItem(LS_SESSION, JSON.stringify(s))
        localStorage.setItem(LS_NAME, guestName)
        setStep('chat')
        // Send greeting
        await fetch(`/api/chat/sessions/${s.id}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: s.token, text: `Привіт! Мене звати ${guestName}.` }),
        })
        pollMessages(s)
    }

    const sendMsg = async () => {
        if (!input.trim() || !session || closed) return
        setSending(true)
        const text = input.trim()
        setInput('')
        // Optimistic
        const optimistic: Msg = { id: Date.now(), text, sender: 'user', createdAt: new Date().toISOString() }
        setMsgs(prev => [...prev, optimistic])
        try {
            await fetch(`/api/chat/sessions/${session.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: session.token, text }),
            })
        } catch { /* ignore */ }
        setSending(false)
    }

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })

    return (
        <>
            {/* ── Toggle Button ── */}
            <button
                onClick={() => setOpen(o => !o)}
                className="fixed bottom-6 right-6 z-[9998] w-14 h-14 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-full shadow-xl flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95"
                aria-label="Відкрити чат підтримки"
            >
                {open ? '✕' : '💬'}
                {unread > 0 && !open && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {/* ── Chat Window ── */}
            {open && (
                <div className="fixed bottom-24 right-6 z-[9999] w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden"
                    style={{ maxHeight: '480px' }}>

                    {/* Header */}
                    <div className="bg-stone-900 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-sm font-bold text-stone-900">L</div>
                        <div>
                            <p className="font-semibold text-sm">LiLu — Підтримка</p>
                            <p className="text-xs text-stone-400">Відповідаємо протягом кількох хвилин</p>
                        </div>
                    </div>

                    {step === 'intro' ? (
                        /* Name form */
                        <div className="p-5 flex flex-col gap-4 flex-1">
                            <p className="text-sm text-stone-600">Привіт! Як вас звати?</p>
                            <input
                                value={guestName} onChange={e => setGuestName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && startChat()}
                                placeholder="Ваше ім'я *"
                                className="border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-400"
                                autoFocus
                            />
                            <input
                                value={guestEmail} onChange={e => setGuestEmail(e.target.value)}
                                placeholder="Email (необов'язково)"
                                type="email"
                                className="border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-400"
                            />
                            <button onClick={startChat} disabled={!guestName.trim()}
                                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 font-bold py-2.5 rounded-xl text-sm transition-colors">
                                Розпочати чат →
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-stone-50">
                                {msgs.length === 0 && (
                                    <p className="text-center text-xs text-stone-400 mt-4">Напишіть ваше питання — ми відповімо! 👋</p>
                                )}
                                {msgs.map(m => (
                                    <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${m.sender === 'user'
                                                ? 'bg-amber-500 text-stone-900 rounded-br-sm'
                                                : 'bg-white text-stone-800 border border-stone-200 rounded-bl-sm shadow-sm'
                                            }`}>
                                            {m.sender === 'admin' && (
                                                <p className="text-xs font-semibold text-amber-700 mb-0.5">LiLu Підтримка</p>
                                            )}
                                            <p>{m.text}</p>
                                            <p className={`text-xs mt-0.5 ${m.sender === 'user' ? 'text-stone-700' : 'text-stone-400'}`}>
                                                {formatTime(m.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {closed && (
                                    <p className="text-center text-xs text-stone-400 bg-stone-100 rounded-lg px-3 py-2">
                                        Чат завершено. Дякуємо за звернення! 🙌
                                    </p>
                                )}
                                <div ref={bottomRef} />
                            </div>

                            {/* Input */}
                            {!closed && (
                                <div className="border-t border-stone-100 px-3 py-2.5 flex gap-2 bg-white flex-shrink-0">
                                    <input
                                        value={input} onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
                                        placeholder="Введіть повідомлення..."
                                        className="flex-1 text-sm text-stone-900 placeholder-stone-400 border-0 outline-none bg-transparent"
                                        disabled={sending}
                                    />
                                    <button onClick={sendMsg} disabled={!input.trim() || sending}
                                        className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors flex-shrink-0">
                                        ↑
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </>
    )
}
