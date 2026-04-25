'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

type Msg = { id: number; text: string; sender: 'user' | 'admin' | 'bot'; createdAt: string }

const POLL_MS = 3000

const FAQ = [
    { q: 'Які розміри є?', a: 'Доступні розміри 35–42. Актуальні залишки вказані на сторінці кожної моделі. 👟' },
    { q: 'Як відстежити замовлення?', a: 'Увійдіть в Особистий кабінет → "Мої замовлення" — статус оновлюється в реальному часі. 📦' },
    { q: 'Методи доставки?', a: 'Нова Пошта або кур\'єр. Відділення обирається при оформленні замовлення. 🚀' },
    { q: 'Як повернути товар?', a: 'Повернення протягом 14 днів. Товар має бути у оригінальному вигляді. 🔄' },
    { q: 'Способи оплати?', a: 'Накладений платіж або LiqPay (картка). 💳' },
    { q: 'Таблиця розмірів?', a: 'EUR: 35=22см, 36=23см, 37=24см, 38=24.5см, 39=25см, 40=26см, 41=26.5см, 42=27см. 📏' },
]

let localIdCounter = -1
const botMsg = (text: string): Msg => ({ id: localIdCounter--, text, sender: 'bot', createdAt: new Date().toISOString() })

function getStorage(userId: number | null) {
    if (typeof window === 'undefined') return null
    return userId ? window.localStorage : window.sessionStorage
}
function sessionKey(userId: number | null) {
    return userId ? `lilu_chat_${userId}` : 'lilu_chat_guest'
}

export default function ChatWidget() {
    const [open, setOpen] = useState(false)
    const [msgs, setMsgs] = useState<Msg[]>([])
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [closed, setClosed] = useState(false)
    const [unread, setUnread] = useState(0)
    const [session, setSession] = useState<{ id: number; token: string } | null>(null)
    const [userId, setUserId] = useState<number | null>(null)
    const [showFaqInline, setShowFaqInline] = useState(false)
    // FAQ interactions accumulate until specialist is connected
    const faqHistory = useRef<{ q: string; a: string }[]>([])

    const seenIds = useRef<Set<number>>(new Set())
    const lastTs = useRef<string | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const startedRef = useRef(false)

    // ── Mount: check auth + restore session ────────────────────────────────
    useEffect(() => {
        if (startedRef.current) return
        startedRef.current = true
        fetch('/api/auth/me')
            .then(r => r.json())
            .then((user) => {
                const uid: number | null = user?.id ?? null
                setUserId(uid)
                const storage = getStorage(uid)
                const saved = storage?.getItem(sessionKey(uid))
                if (saved) {
                    try { setSession(JSON.parse(saved)) }
                    catch { /* ignore */ }
                }
            })
            .catch(() => { /* guest */ })
    }, [])

    // ── Auto-scroll ────────────────────────────────────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [msgs, showFaqInline])

    // ── Poll ───────────────────────────────────────────────────────────────
    const poll = useCallback(async (s: { id: number; token: string }) => {
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
        } catch { /* ok */ }
    }, [open])

    useEffect(() => {
        if (!session) return
        poll(session)
        pollRef.current = setInterval(() => poll(session), POLL_MS)
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [session, poll])

    useEffect(() => { if (open) setUnread(0) }, [open])

    // ── Ensure session ─────────────────────────────────────────────────────
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
        getStorage(userId)?.setItem(sessionKey(userId), JSON.stringify(s))
        return s
    }

    // ── Send to server — returns the saved message (no optimistic) ─────────
    const sendToServer = async (text: string, s: { id: number; token: string }): Promise<void> => {
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

    // ── FAQ chip ───────────────────────────────────────────────────────────
    const handleFaq = (item: { q: string; a: string }) => {
        setShowFaqInline(false)
        // Show locally (bot doesn't need to be sent to server unless specialist connects)
        setMsgs(prev => [...prev, botMsg(item.a)])
        faqHistory.current.push(item)  // remember for context when specialist connects
    }

    // ── Connect specialist — sends full FAQ history to admin ───────────────
    const connectSpecialist = async () => {
        setShowFaqInline(false)
        const s = await ensureSession()

        // 1. Send FAQ context so admin sees what the user already asked
        if (faqHistory.current.length > 0) {
            const lines = faqHistory.current.map(f => `❓ ${f.q}\n💬 ${f.a}`).join('\n\n')
            await sendToServer(`📋 Користувач переглядав FAQ:\n\n${lines}`, s)
            faqHistory.current = []
        }

        // 2. Local bot message
        setMsgs(prev => [...prev, botMsg('Передаю вас спеціалісту LiLu... Очікуйте відповіді. ⏳')])

        // 3. Notification to admin
        await sendToServer('🔔 Користувач хоче поговорити зі спеціалістом.', s)
    }

    // ── Send typed message ─────────────────────────────────────────────────
    const sendMsg = async () => {
        const text = input.trim()
        if (!text || sending || closed) return
        setInput('')
        setSending(true)
        setShowFaqInline(false)
        const s = await ensureSession()
        await sendToServer(text, s)
        setSending(false)
    }

    // ── Start new chat ─────────────────────────────────────────────────────
    const startNewChat = () => {
        if (pollRef.current) clearInterval(pollRef.current)
        getStorage(userId)?.removeItem(sessionKey(userId))
        setSession(null)
        setMsgs([])
        setClosed(false)
        setShowFaqInline(false)
        faqHistory.current = []
        seenIds.current = new Set()
        lastTs.current = null
    }

    const fmtTime = (iso: string) =>
        new Date(iso).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })

    const hasAnyMsg = msgs.length > 0

    return (
        <>
            {/* Toggle button */}
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

            {/* Chat window — fixed 520px */}
            {open && (
                <div className="fixed bottom-24 right-6 z-[9999] w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col"
                    style={{ height: '520px' }}>

                    {/* Header */}
                    <div className="bg-stone-900 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0 rounded-t-2xl">
                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-sm font-bold text-stone-900">L</div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">LiLu — Підтримка</p>
                            <p className="text-xs text-stone-400">Зазвичай відповідаємо за кілька хвилин</p>
                        </div>
                        {userId && <span className="text-xs text-green-400 flex-shrink-0">● збережено</span>}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-stone-50">

                        {/* Welcome */}
                        <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                            <p className="text-xs font-semibold text-amber-700 mb-1">LiLu Бот</p>
                            <p className="text-sm text-stone-800">Привіт! 👋 Чим можу допомогти? Натисніть на питання або напишіть своє.</p>
                        </div>

                        {/* Initial FAQ (no messages yet) */}
                        {!hasAnyMsg && (
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    {FAQ.map(item => (
                                        <button key={item.q} onClick={() => handleFaq(item)}
                                            className="text-xs bg-white border border-amber-200 text-amber-800 hover:bg-amber-50 rounded-full px-3 py-1.5 transition-colors font-medium shadow-sm">
                                            {item.q}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={connectSpecialist}
                                    className="w-full text-xs text-stone-500 hover:text-stone-700 hover:bg-stone-100 border border-dashed border-stone-300 rounded-xl px-3 py-2 transition-colors">
                                    👤 Поговорити зі спеціалістом
                                </button>
                            </div>
                        )}

                        {/* Messages */}
                        {msgs.map(m => (
                            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[84%] px-3 py-2 rounded-2xl text-sm ${m.sender === 'user' ? 'bg-amber-500 text-stone-900 rounded-br-sm' :
                                        m.sender === 'bot' ? 'bg-white text-stone-800 border border-stone-200 rounded-bl-sm shadow-sm' :
                                            'bg-stone-800 text-white rounded-bl-sm'
                                    }`}>
                                    {m.sender !== 'user' && (
                                        <p className={`text-xs font-semibold mb-0.5 ${m.sender === 'bot' ? 'text-amber-600' : 'text-amber-400'}`}>
                                            {m.sender === 'bot' ? 'LiLu Бот' : 'LiLu Спеціаліст'}
                                        </p>
                                    )}
                                    <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                                    <p className={`text-xs mt-0.5 ${m.sender === 'user' ? 'text-stone-700' : 'text-stone-400'}`}>
                                        {fmtTime(m.createdAt)}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Inline FAQ (after messages) */}
                        {showFaqInline && (
                            <div className="space-y-2 pt-1 border-t border-stone-100">
                                <p className="text-xs text-stone-400 text-center">Часті питання:</p>
                                <div className="flex flex-wrap gap-2">
                                    {FAQ.map(item => (
                                        <button key={item.q} onClick={() => handleFaq(item)}
                                            className="text-xs bg-white border border-amber-200 text-amber-800 hover:bg-amber-50 rounded-full px-3 py-1.5 transition-colors font-medium shadow-sm">
                                            {item.q}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={connectSpecialist}
                                    className="w-full text-xs text-stone-500 hover:text-stone-700 hover:bg-stone-100 border border-dashed border-stone-300 rounded-xl px-3 py-2 transition-colors">
                                    👤 Поговорити зі спеціалістом
                                </button>
                                <button onClick={() => setShowFaqInline(false)}
                                    className="w-full text-xs text-stone-400 hover:text-stone-600 py-1">
                                    Сховати ✕
                                </button>
                            </div>
                        )}

                        {/* Closed */}
                        {closed && (
                            <div className="text-center space-y-2 py-2">
                                <p className="text-xs text-stone-400 bg-stone-100 rounded-lg px-3 py-2">
                                    Чат завершено. Дякуємо за звернення! 🙌
                                </p>
                                <button onClick={startNewChat}
                                    className="w-full text-xs bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-4 py-2.5 rounded-xl transition-colors">
                                    + Почати новий чат
                                </button>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    {!closed && (
                        <div className="border-t border-stone-100 bg-white flex-shrink-0 rounded-b-2xl">
                            {!showFaqInline && hasAnyMsg && (
                                <div className="px-3 pt-2">
                                    <button onClick={() => setShowFaqInline(true)}
                                        className="text-xs text-stone-400 hover:text-amber-700 underline transition-colors">
                                        ↩ Часті питання
                                    </button>
                                </div>
                            )}
                            <div className="flex gap-2 px-3 py-2.5">
                                <input
                                    value={input} onChange={e => setInput(e.target.value)}
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
                        </div>
                    )}
                </div>
            )}
        </>
    )
}
