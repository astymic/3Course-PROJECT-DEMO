# LiLu E-Commerce — Sprint 2

**Гілка:** `sprint2` | **Стек:** Next.js 16, Prisma 5, SQLite, Tailwind CSS

## Що нового у Sprint 2

- Реєстрація та вхід (телефон або email) з httpOnly JWT-cookie сесією
- Особистий кабінет (`/account`): замовлення, профіль, історія чату
- Автоматична прив'язка гостьових замовлень після реєстрації
- Автозаповнення форми замовлення з профілю користувача
- Live чат-підтримка — FAQ бот + підключення живого спеціаліста
- Адмін-дашборд чату (`/admin/chat`) з відповідями в реальному часі
- Управління користувачами та ролями (`/admin/users`)

## Запуск

```bash
npm install
npx prisma migrate dev
node prisma/seed.js      # створює адміна admin@lilu.ua / admin123
npm run dev
```

## Маршрути

| URL | Опис |
|-----|------|
| `/` | Каталог товарів |
| `/checkout` | Оформлення замовлення |
| `/account` | Особистий кабінет (авторизація required) |
| `/login` | Вхід |
| `/register` | Реєстрація |
| `/admin` | Управління товарами (admin) |
| `/admin/orders` | Замовлення (admin) |
| `/admin/users` | Користувачі та ролі (admin) |
| `/admin/chat` | Чат-підтримка (admin) |

## Змінні оточення (`.env`)

```env
DATABASE_URL="file:./prisma/dev.db"
AUTH_SECRET="your-secret-key"
NOVA_POSHTA_API_KEY="your-np-key"
```

## Документація

Повна технічна документація проєкту: [`../docs/documentation.md`](../docs/documentation.md)
