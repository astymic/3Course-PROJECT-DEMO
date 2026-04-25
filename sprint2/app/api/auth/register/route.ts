import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, createToken, COOKIE_NAME, COOKIE_OPTS } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const { name, phone, email, password } = await request.json()

        if (!password || password.length < 6) {
            return NextResponse.json({ error: 'Пароль має бути не менше 6 символів' }, { status: 400 })
        }
        if (!phone && !email) {
            return NextResponse.json({ error: 'Вкажіть телефон або email' }, { status: 400 })
        }

        // Check existing user
        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    phone ? { phone } : { id: -1 },
                    email ? { email } : { id: -1 },
                ],
            },
        })
        if (existing) {
            return NextResponse.json({ error: 'Користувач з такими даними вже існує' }, { status: 409 })
        }

        const user = await prisma.user.create({
            data: {
                name: name ?? '',
                phone: phone || null,
                email: email || null,
                password: hashPassword(password),
                role: 'user',
            },
        })

        const token = createToken(user.id, user.role)
        const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } })
        res.cookies.set(COOKIE_NAME, token, COOKIE_OPTS)
        return res
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 })
    }
}
