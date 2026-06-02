// Simple seed runner - CommonJS compatible
const { PrismaClient } = require('@prisma/client')
const { createHmac } = require('crypto')
const prisma = new PrismaClient()

const SECRET = process.env.AUTH_SECRET ?? 'lilu-dev-secret-CHANGE-IN-PRODUCTION'
function hashPassword(password) {
    return createHmac('sha256', SECRET).update(password).digest('hex')
}

async function main() {
    // Delete in correct FK order
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.productSize.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()


    const summer = await prisma.category.create({ data: { name: 'Літнє взуття', slug: 'summer', season: 'summer' } })
    const winter = await prisma.category.create({ data: { name: 'Зимове взуття', slug: 'winter', season: 'winter' } })
    const demi = await prisma.category.create({ data: { name: 'Демісезонне', slug: 'demi', season: 'demi' } })

    const products = [
        { name: 'Туфлі "Весна"', description: 'Елегантні туфлі з натуральної шкіри.', price: 2800, material: 'Натуральна шкіра', color: 'Чорний', imageUrl: 'https://i.pinimg.com/474x/96/70/fb/9670fb4a261c5f42f15956e1d4cee649.jpg', categoryId: summer.id, sizes: [35, 36, 37, 38, 39, 40] },
        { name: 'Босоніжки "Лето"', description: 'Легкі відкриті босоніжки на плоскому ходу.', price: 1950, material: 'Замша', color: 'Бежевий', imageUrl: 'https://images.openai.com/static-rsc-4/PRAmnkVuDurjztt2_pPmOJsazyFwOihOJ7PQEkvFc4v3HHF-7korT2Dnk4fB3j8t8ObN-dBCgqOHvTMEwswa4fZTkuRtlEdZI6E7sMMZHqTIJ6VN74Wszx8FibRoY4eIRgIx6nmPETLlmI0sFhid15GFISh3MqwHq7pwSTrKWl5krirQmA5hQP7unQZVz342?purpose=fullsize', categoryId: summer.id, sizes: [36, 37, 38, 39, 40, 41] },
        { name: 'Мокасини "Comfort"', description: 'Зручні мокасини на кожен день.', price: 2200, material: 'Нубук', color: 'Коричневий', imageUrl: 'https://i.pinimg.com/736x/84/e9/24/84e924b0b373956e67c95f307f56d34b.jpg', categoryId: demi.id, sizes: [37, 38, 39, 40, 41, 42] },
        { name: 'Черевики "Zima"', description: 'Теплі зимові черевики на хутрі.', price: 3600, material: 'Шкіра + хутро', color: 'Чорний', imageUrl: 'https://images.prom.ua/3565013436_w1280_h640_zhenskie-botinki-zima.jpg', categoryId: winter.id, sizes: [36, 37, 38, 39, 40] },
        { name: 'Кросівки "Sport"', description: 'Спортивні кросівки для активного відпочинку.', price: 2500, material: 'Текстиль', color: 'Білий', imageUrl: 'https://xcdn.next.co.uk/common/items/default/default/itemimages/3_4Ratio/product/lge/T47839s.jpg?im=Resize,width=750', categoryId: demi.id, sizes: [37, 38, 39, 40, 41, 42] },
        { name: 'Чоботи "Classic"', description: 'Класичні шкіряні чоботи до коліна.', price: 4200, material: 'Натуральна шкіра', color: 'Коричневий', imageUrl: 'https://content2.rozetka.com.ua/goods/images/big_tile/655325053.jpg', categoryId: winter.id, sizes: [36, 37, 38, 39, 40, 41] },
    ]

    for (const p of products) {
        const { sizes, ...productData } = p
        const product = await prisma.product.create({ data: productData })
        for (const size of sizes) {
            await prisma.productSize.create({
                data: { productId: product.id, size, quantity: Math.floor(Math.random() * 8) + 1 }
            })
        }
    }

    // ── Seed admin user ─────────────────────────────────────────
    const adminEmail = 'admin@lilu.ua'
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
    if (!existing) {
        await prisma.user.create({
            data: {
                name: 'Адміністратор',
                email: adminEmail,
                phone: null,
                password: hashPassword('admin123'),
                role: 'admin',
            }
        })
        console.log('Admin created: admin@lilu.ua / admin123')
    } else {
        console.log('Admin already exists, skipping')
    }

    const count = await prisma.product.count()
    console.log('Seed done:', count, 'products')
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
