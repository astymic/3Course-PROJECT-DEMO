import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Clear existing data
    await prisma.productSize.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()

    // Categories
    const summer = await prisma.category.create({ data: { name: 'Літнє взуття', slug: 'summer', season: 'summer' } })
    const winter = await prisma.category.create({ data: { name: 'Зимове взуття', slug: 'winter', season: 'winter' } })
    const demi = await prisma.category.create({ data: { name: 'Демісезонне', slug: 'demi', season: 'demi' } })

    // Products with sizes
    const products = [
        { name: 'Туфлі "Весна"', description: 'Елегантні туфлі з натуральної шкіри. Ідеально для офісу та прогулянок.', price: 2800, material: 'Натуральна шкіра', color: 'Чорний', imageUrl: '/images/p1.jpg', categoryId: summer.id, sizes: [35, 36, 37, 38, 39, 40] },
        { name: 'Босоніжки "Лето"', description: 'Легкі відкриті босоніжки на плоскому ходу. Матеріал — замша.', price: 1950, material: 'Замша', color: 'Бежевий', imageUrl: '/images/p2.jpg', categoryId: summer.id, sizes: [36, 37, 38, 39, 40, 41] },
        { name: 'Мокасини "Comfort"', description: 'Зручні мокасини на кожен день. Підошва — гума, верх — нубук.', price: 2200, material: 'Нубук', color: 'Коричневий', imageUrl: '/images/p3.jpg', categoryId: demi.id, sizes: [37, 38, 39, 40, 41, 42] },
        { name: 'Черевики "Zima"', description: 'Теплі зимові черевики на хутрі. Непромокальна підошва.', price: 3600, material: 'Натуральна шкіра + хутро', color: 'Чорний', imageUrl: '/images/p4.jpg', categoryId: winter.id, sizes: [36, 37, 38, 39, 40] },
        { name: 'Кросівки "Sport"', description: 'Спортивні кросівки для активного відпочинку та занять спортом.', price: 2500, material: 'Текстиль + шкіра', color: 'Білий', imageUrl: '/images/p5.jpg', categoryId: demi.id, sizes: [37, 38, 39, 40, 41, 42] },
        { name: 'Чоботи "Classic"', description: 'Класичні шкіряні чоботи до коліна. Підкладка — байка.', price: 4200, material: 'Натуральна шкіра', color: 'Коричневий', imageUrl: '/images/p6.jpg', categoryId: winter.id, sizes: [36, 37, 38, 39, 40, 41] },
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

    console.log('Seed completed: 3 categories, 6 products with sizes')
}

main().catch(console.error).finally(() => prisma.$disconnect())
