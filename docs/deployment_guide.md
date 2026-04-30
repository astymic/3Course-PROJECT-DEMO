# LiLu — Deployment Guide (Sprint 3)

> Повний покроковий гайд для деплою на Vercel + Supabase PostgreSQL

---

## Крок 1: Налаштування Supabase (PostgreSQL)

### 1.1 Створити проєкт
1. Перейдіть на [supabase.com](https://supabase.com) → **Start your project**
2. Увійдіть через GitHub
3. **New project** → оберіть організацію → введіть:
   - **Name:** `lilu-ecommerce`
   - **Database Password:** придумайте надійний пароль (збережіть!)
   - **Region:** `eu-central-1` (Frankfurt — ближче до України)
4. Натисніть **Create new project** (чекайте ~2 хвилини)

### 1.2 Отримати URL підключення
1. В Supabase → **Settings** → **Database**
2. Прокрутіть до розділу **Connection string**
3. Оберіть **URI** і скопіюйте два рядки:

**Transaction URL** (для додатку):
```
postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Direct URL** (для міграцій):
```
postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

### 1.3 Запустити міграції
```bash
cd demo/sprint2

# Змінити .env тимчасово для міграції:
# DATABASE_URL=<Transaction URL>
# DIRECT_URL=<Direct URL>

npx prisma migrate deploy
node prisma/seed.js    # Заповнить товари + створить admin@lilu.ua / admin123
```

---

## Крок 2: Деплой на Vercel

### 2.1 Підготовка
1. Перейдіть на [vercel.com](https://vercel.com) → увійдіть через GitHub
2. Натисніть **Add New → Project**
3. Оберіть репозиторій `3Course-PROJECT-DEMO`
4. **Framework Preset:** Next.js (визначиться автоматично)
5. **Root Directory:** `sprint2` ← ВАЖЛИВО!

### 2.2 Environment Variables
В Vercel → **Settings** → **Environment Variables** додайте:

| Ключ | Значення |
|------|---------|
| `DATABASE_URL` | Transaction URL з Supabase |
| `DIRECT_URL` | Direct URL з Supabase |
| `AUTH_SECRET` | Довгий випадковий рядок (мін. 32 символи) |
| `NOVA_POSHTA_API_KEY` | Ваш ключ API Нової Пошти |
| `LIQPAY_PUBLIC_KEY` | Публічний ключ LiqPay |
| `LIQPAY_PRIVATE_KEY` | Приватний ключ LiqPay |
| `NEXT_PUBLIC_APP_URL` | `https://ваш-домен.com` |

> 💡 Генератор `AUTH_SECRET`: відкрийте термінал і виконайте `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 2.3 Деплой
1. Натисніть **Deploy**
2. Vercel автоматично:
   - Запустить `npm install` (що запустить `prisma generate` через `postinstall`)
   - Запустить `prisma generate && next build`
   - Задеплоїть на `https://sprint2-xxx.vercel.app`
3. Після успішного деплою — перейдіть на URL і перевірте

---

## Крок 3: Реєстрація домену

### Варіанти реєстраторів:
- **nic.ua** — для `.ua`, `.com.ua` доменів (рекомендовано)
- **Namecheap** — для `.com` (дешевше)
- **GoDaddy** — міжнародний варіант

### Налаштування DNS (після реєстрації):
1. В панелі реєстратора → DNS Management
2. Додайте записи:

| Тип | Хост | Значення |
|-----|------|---------|
| `A` | `@` | `76.76.21.21` (Vercel IP) |
| `CNAME` | `www` | `cname.vercel-dns.com` |

3. В Vercel → **Settings** → **Domains** → додайте ваш домен
4. SSL-сертифікат підключиться автоматично через Let's Encrypt (~5-10 хвилин)
5. Перевірте `https://lilu-shoes.com` ✅

---

## Крок 4: E2E Регресійне тестування

Після деплою пройдіть повний флоу вручну:

### Покупець
- [ ] Відкрити сайт → завантажується без помилок
- [ ] Фільтри каталогу (категорія, колір, розмір, пошук)
- [ ] Картка товару — вибір розміру, фото
- [ ] Додати в кошик → перейти до кошика
- [ ] Оформити замовлення (Нова Пошта, накладений платіж)
- [ ] Отримати підтвердження замовлення
- [ ] Реєстрація → кабінет → бачити замовлення
- [ ] Чат підтримки → написати повідомлення

### Адмін
- [ ] Увійти на `/admin` (admin@lilu.ua / admin123)
- [ ] Побачити нове замовлення
- [ ] Змінити статус → зберегти
- [ ] Додати тестовий товар → зберегти → перевірити в каталозі
- [ ] Відповісти в чаті

---

## Крок 5: Передача доступів клієнту

Підготуйте документ з доступами і передайте особисто або через захищений месенджер:

```
=== LiLu — Доступи ===

САЙТ: https://lilu-shoes.com
Адмін-панель: https://lilu-shoes.com/admin
  Логін: admin@lilu.ua
  Пароль: [ваш пароль]

VERCEL (хостинг):
  URL: https://vercel.com
  Логін: [email]
  Пароль: [пароль]

SUPABASE (база даних):
  URL: https://supabase.com
  Логін: [email]
  Пароль: [пароль]

ДОМЕН: [реєстратор]
  URL: [url панелі]
  Логін: [email]
  Пароль: [пароль]
```

> ⚠ Після передачі — змініть паролі на нові!

---

## Корисні команди

```bash
# Перегенерувати Prisma client
npx prisma generate

# Застосувати міграції на production
npx prisma migrate deploy

# Відкрити Prisma Studio (GUI для БД)
npx prisma studio

# Перевірити build локально
npm run build && npm start
```

---

*LiLu E-Commerce • Deployment Guide • Sprint 3 • 2026*
