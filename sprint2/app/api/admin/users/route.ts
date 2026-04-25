import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

function requireAdmin(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    const payload = token ? verifyToken(token) : null
    if (!payload || payload.role !== 'admin') return null
    return payload
}

// GET /api/admin/users — list all users
export async function GET(request: NextRequest) {
    if (!requireAdmin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const users = await prisma.user.findMany({
        select: { id: true, name: true, phone: true, email: true, role: true, createdAt: true, _count: { select: { orders: true } } },
        orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(users)
}

// PUT /api/admin/users — change user role
export async function PUT(request: NextRequest) {
    if (!requireAdmin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { userId, role } = await request.json()
    if (!['user', 'admin'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    const user = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, name: true, role: true },
    })
    return NextResponse.json(user)
}
