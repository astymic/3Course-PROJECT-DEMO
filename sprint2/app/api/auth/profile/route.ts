import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, hashPassword, COOKIE_NAME } from '@/lib/auth'

// GET /api/auth/profile — update profile
export async function PUT(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    const payload = token ? verifyToken(token) : null
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, phone, email, currentPassword, newPassword } = await request.json()

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone || null
    if (email !== undefined) updateData.email = email || null

    if (newPassword) {
        const { checkPassword } = await import('@/lib/auth')
        if (!checkPassword(currentPassword ?? '', user.password)) {
            return NextResponse.json({ error: 'Невірний поточний пароль' }, { status: 400 })
        }
        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Новий пароль має бути не менше 6 символів' }, { status: 400 })
        }
        updateData.password = hashPassword(newPassword)
    }

    const updated = await prisma.user.update({
        where: { id: payload.userId },
        data: updateData,
        select: { id: true, name: true, phone: true, email: true, role: true },
    })

    return NextResponse.json(updated)
}
