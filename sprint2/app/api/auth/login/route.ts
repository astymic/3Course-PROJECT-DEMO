import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkPassword, createToken, COOKIE_NAME, COOKIE_OPTS } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const { login, password } = await request.json()

        if (!login || !password) {
            return NextResponse.json({ error: 'Заповніть всі поля' }, { status: 400 })
        }

        // Find user by phone OR email
        const isPhone = /^[\d+\-\s()]+$/.test(login)
        const user = await prisma.user.findFirst({
            where: isPhone ? { phone: login } : { email: login },
        })

        if (!user || !checkPassword(password, user.password)) {
            return NextResponse.json({ error: 'Невірний логін або пароль' }, { status: 401 })
        }

        const token = createToken(user.id, user.role)
        const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } })
        res.cookies.set(COOKIE_NAME, token, COOKIE_OPTS)
        return res
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 })
    }
}
