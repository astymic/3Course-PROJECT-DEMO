'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

type Msg = { id: number; text: string; sender: 'user' | 'admin' | 'bot'; createdAt: string }

const LS_SESSION = 'lilu_chat_session'
const POLL_MS = 3000

// ── Quick FAQ ───────────────────────────────────────────────────────────────
const FAQ: { q: string; a: string }[] = [
    { q: 'Які розміри є?', a: 'Доступні розміри 35–42. Актуальні залишки вказані на сторінці кожної моделі. 👟' },
    { q: 'Як відстежити замовлення?', a: 'Перейдіть в Особистий кабінет → "Мої замовлення" — там статус оновлюється в реальному часі. 📦' },
    { q: 'Методи доставки?', a: 'Доставляємо Новою Поштою або кур\'єром. Відділення обирається при оформленні замовлення. 🚀' },
    { q: 'Як повернути товар?', a: 'Повернення протягом 14 днів з моменту отримання. Товар має бути в оригінальному вигляді. 🔄' },
    { q: 'Способи оплати?', a: 'Накладений платіж (оплата при отриманні) або карткою через LiqPay. 💳' },
    { q: 'Розміри взуття (таблиця)?', a: 'EUR 35=22 см, 36=23 см, 37=23.5 см, 38=24.5 см, 39=25 см, 40=26 см, 41=26.5 см, 42=27 см. 📏' },
]

let msgIdCounter = -1 // local negative IDs for bot messages (won't collide with DB)
const localMsg = (text: string, sender: Msg['sender']): Msg => ({
    id: msgIdCounter--,
    text,
    sender,
    createdAt: new Date().toISOString(),
})

export default function ChatWidget() {
    const [open, setOpen] = useState(false)
    const [msgs, setMsgs] = useState<Msg[]>([])
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [closed, setClosed] = useState(false)
    const [unread, setUnread] = useState(0)
    const [session, setSession] = useState<{ id: number; token: string } | null>(null)
    const [showFaq, setShowFaq] = useState(true)
    const [connectingSpec, setConnectingSpec] = useState(false)

    // IDs of messages already seen from server (to avoid duplicates)
    const seenIds = useRef<Set<number>>(new Set())
    const lastTs = useRef<string | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Restore session from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(LS_SESSION)
            if (saved) {
                const s = JSON.parse(saved) as { id: number; token: string }
                setSession(s)
                setShowFaq(false)
            }
        } catch { /* ignore */ }
    }, [])

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [msgs])

    // ── Poll for new messages ───────────────────────────────────────────────
    const pollMessages = useCallback(async (s: { id: number; token: string }) => {
        try {
            const after = lastTs.current ? `&after=${encodeURIComponent(lastTs.current)}` : ''
            const res = await fetch(`/api/chat/sessions/${s.id}/messages?token=${s.token}${after}`)
            if (!res.ok) return
            const data = await res.json()

            if (Array.isArray(data.messages) && data.messages.length > 0) {
                const fresh = data.messages.filter((m: Msg) => !seenIds.current.has(m.id))
                if (fresh.length) {
                    fresh.forEach((m: Msg) => seenIds.current.add(m.id))
                    lastTs.current = fresh[fresh.length - 1].createdAt
                    setMsgs(prev => [...prev, ...fresh])
                    if (!open) setUnread(u => u + fresh.filter((m: Msg) => m.sender === 'admin').length)
                }
            }
            if (data.status === 'closed') setClosed(true)
        } catch { /* network error */ }
    }, [open])

    useEffect(() => {
        if (!session) return
        if (msgs.filter(m => m.id > 0).length === 0) pollMessages(session) // initial load
        pollRef.current = setInterval(() => pollMessages(session), POLL_MS)
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [session, pollMessages]) // eslint-disable-line react-hooks/exhaustive-deps

    // Clear unread on open
    useEffect(() => { if (open) setUnread(0) }, [open])

    // ── Ensure session exists ────────────────────────────────────────────────
    const ensureSession = async (): Promise<{ id: number; token: string }> => {
        if (session) return session
        const res = await fetch('/api/chat/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guestName: 'Гість', guestEmail: '' }),
        })
        const data = await res.json()
        const s = { id: data.id, token: data.token }
        setSession(s)
        localStorage.setItem(LS_SESSION, JSON.stringify(s))
        return s
    }

    // ── Send a real message (user → server) ─────────────────────────────────
    const sendToServer = async (text: string, s: { id: number; token: string }) => {
        const res = await fetch(`/api/chat/sessions/${s.id}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: s.token, text }),
        })
        if (res.ok) {
            const msg: Msg = await res.json()
            if (!seenIds.current.has(msg.id)) {
                seenIds.current.add(msg.id)
                if (msg.createdAt) lastTs.current = msg.createdAt
                setMsgs(prev => [...prev, msg])
            }
        }
    }

    // ── FAQ chip click ──────────────────────────────────────────────────────
    const handleFaq = async (item: { q: string; a: string }) => {
        setShowFaq(false)

        // Show user question locally (instant)
        const userMsg = localMsg(item.q, 'user')
        setMsgs(prev => [...prev, userMsg])

        // Show bot response locally (after brief delay)
        setTimeout(() => {
            setMsgs(prev => [...prev, localMsg(item.a, 'bot')])
        }, 600)
    }

    // ── "Connect specialist" ────────────────────────────────────────────────
    const connectSpecialist = async () => {
        setConnectingSpec(true)
        setShowFaq(false)
        const s = await ensureSession()

        // Bot message
        setMsgs(prev => [...prev, localMsg('Передаю вас спеціалісту LiLu... Очікуйте відповіді. ⏳', 'bot')])

        // Send to server (so admin sees request)
        await sendToServer('🔔 Користувач хоче поговорити зі спеціалістом.', s)
        setConnectingSpec(false)
    }

    // ── Send typed message ──────────────────────────────────────────────────
    const sendMsg = async () => {
        const text = input.trim()
        if (!text || sending || closed) return
        setInput('')
        setSending(true)
        setShowFaq(false)

        const s = await ensureSession()
        await sendToServer(text, s)
        setSending(false)
    }

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })

    return (
        <>
            {/* ── Toggle button ── */}
            <button
                onClick={() => setOpen(o => !o)}
                className="fixed bottom-6 right-6 z-[9998] w-14 h-14 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-full shadow-xl flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95"
                aria-label="Чат підтримки"
            >
                {open ? '✕' : '💬'}
                {unread > 0 && !open && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {/* ── Chat window — FIXED SIZE ── */}
            {open && (
                <div
                    className="fixed bottom-24 right-6 z-[9999] w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col"
                    style={{ height: '520px' }}
                >
                    {/* Header */}
                    <div className="bg-stone-900 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0 rounded-t-2xl">
                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-sm font-bold text-stone-900">L</div>
                        <div>
                            <p className="font-semibold text-sm">LiLu — Підтримка</p>
                            <p className="text-xs text-stone-400">Зазвичай відповідаємо за кілька хвилин</p>
                        </div>
                    </div>

                    {/* Messages area */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-stone-50">

                        {/* Welcome + FAQ */}
                        {showFaq && (
                            <div className="space-y-3">
                                <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                                    <p className="text-xs font-semibold text-amber-700 mb-1">LiLu Підтримка</p>
                                    <p className="text-sm text-stone-800">Привіт! 👋 Чим можу допомогти? Оберіть питання або напишіть своє.</p>
                                </div>

                                {/* FAQ chips */}
                                <div className="flex flex-wrap gap-2 pb-1">
                                    {FAQ.map(item => (
                                        <button key={item.q} onClick={() => handleFaq(item)}
                                            className="text-xs bg-white border border-amber-200 text-amber-800 hover:bg-amber-50 hover:border-amber-400 rounded-full px-3 py-1.5 transition-colors font-medium shadow-sm">
                                            {item.q}
                                        </button>
                                    ))}
                                </div>

                                {/* Connect specialist */}
                                <button onClick={connectSpecialist} disabled={connectingSpec}
                                    className="w-full text-xs text-stone-500 hover:text-stone-700 hover:bg-stone-100 border border-dashed border-stone-300 rounded-xl px-3 py-2 transition-colors">
                                    {connectingSpec ? '⏳ Підключаємо...' : '👤 Поговорити зі спеціалістом'}
                                </button>
                            </div>
                        )}

                        {/* Chat messages */}
                        {msgs.map(m => (
                            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm ${m.sender === 'user'
                                        ? 'bg-amber-500 text-stone-900 rounded-br-sm'
                                        : m.sender === 'bot'
                                            ? 'bg-white text-stone-800 border border-stone-200 rounded-bl-sm shadow-sm'
                                            : 'bg-stone-800 text-white rounded-bl-sm'
                                    }`}>
                                    {m.sender !== 'user' && (
                                        <p className={`text-xs font-semibold mb-0.5 ${m.sender === 'bot' ? 'text-amber-600' : 'text-amber-400'}`}>
                                            {m.sender === 'bot' ? 'LiLu Бот' : 'LiLu Спеціаліст'}
                                        </p>
                                    )}
                                    <p className="leading-relaxed">{m.text}</p>
                                    <p className={`text-xs mt-0.5 ${m.sender === 'user' ? 'text-stone-700' : 'text-stone-400'}`}>
                                        {formatTime(m.createdAt)}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Show FAQ button if chat is active */}
                        {!showFaq && msgs.length > 0 && !closed && (
                            <div className="flex justify-center pt-1">
                                <button onClick={() => setShowFaq(true)}
                                    className="text-xs text-stone-400 hover:text-amber-700 underline transition-colors">↩ Часті питання</button>
                            </div>
                        )}

                        {closed && (
                            <div className="text-center text-xs text-stone-400 bg-stone-100 rounded-lg px-3 py-2">
                                Чат завершено. Дякуємо! 🙌
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    {!closed && (
                        <div className="border-t border-stone-100 px-3 py-2.5 flex gap-2 bg-white flex-shrink-0 rounded-b-2xl">
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
                                placeholder="Введіть повідомлення..."
                                className="flex-1 text-sm text-stone-900 placeholder-stone-400 border-0 outline-none bg-transparent"
                                disabled={sending}
                            />
                            <button onClick={sendMsg} disabled={!input.trim() || sending}
                                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 font-bold w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0">
                                ↑
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    )
}
