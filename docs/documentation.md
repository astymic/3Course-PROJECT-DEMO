# LiLu — Взуттєва фабрика: Технічна документація

> **Проєкт:** LiLu E-Commerce Platform
> **Стек:** Next.js 16, Prisma 5, SQLite, Tailwind CSS
> **Структура:** Монорепозиторій, спринтова розробка

---

## 1. Загальний огляд

LiLu — веб-платформа для продажу взуття власного виробництва. Система включає:
- Каталог товарів з фільтрацією
- Кошик і оформлення замовлень (доставка Новою Поштою або кур'єром)
- Систему авторизації (реєстрація/вхід через телефон або email)
- Особистий кабінет покупця
- Адміністративну панель для управління товарами, замовленнями, користувачами
- Live чат-підтримку з адмін-дашбордом

---

## 2. Структура проєкту

```
demo/
├── docs/               ← документація (цей файл)
├── sprint1/            ← базовий каталог і кошик
└── sprint2/            ← авторизація, кабінет, чат
    ├── app/
    │   ├── page.tsx              Головна (каталог)
    │   ├── checkout/             Оформлення замовлення
    │   ├── account/              Особистий кабінет
    │   ├── login/                Сторінка входу
    │   ├── register/             Сторінка реєстрації
    │   ├── admin/                Адмін-панель
    │   │   ├── page.tsx          Управління товарами
    │   │   ├── orders/           Управління замовленнями
    │   │   ├── users/            Управління користувачами
    │   │   └── chat/             Чат-підтримка (адмін)
    │   └── api/                  API-маршрути
    │       ├── auth/             Авторизація
    │       ├── products/         CRUD товарів
    │       ├── orders/           Замовлення
    │       ├── categories/       Категорії
    │       ├── nova-poshta/      Інтеграція з НП
    │       ├── chat/             Чат (покупець)
    │       └── admin/            Адмін API
    ├── components/               React компоненти
    ├── context/                  CartContext
    ├── lib/
    │   ├── auth.ts               Авторизація (хеш, токени)
    │   └── prisma.ts             Prisma клієнт (singleton)
    ├── prisma/
    │   ├── schema.prisma         Схема БД
    │   ├── seed.js               Початкові дані + адмін
    │   └── dev.db                SQLite база даних
    └── proxy.ts                  Захист маршрутів (Edge Runtime)
```

---

## 3. Технічний стек

| Компонент | Технологія | Версія |
|-----------|-----------|--------|
| Фреймворк | Next.js | 16.2.4 |
| Стилізація | Tailwind CSS | 3.x |
| ORM | Prisma | 5.22 |
| База даних | SQLite | — |
| Авторизація | HMAC-SHA256 + httpOnly cookie | — |
| Edge Runtime | Web Crypto API | — |
| Реальний час | Polling (setInterval 3s) | — |

---

## 4. База даних

### Схема (Prisma)

#### Category
| Поле | Тип | Опис |
|------|-----|------|
| id | Int | PK |
| name | String | Назва категорії |
| slug | String | URL-slug (унікальний) |
| season | String | summer / winter / demi |

#### Product
| Поле | Тип | Опис |
|------|-----|------|
| id | Int | PK |
| name | String | Назва товару |
| description | String | Опис |
| price | Float | Ціна (грн) |
| material | String | Матеріал |
| color | String | Колір |
| imageUrl | String | Шлях до зображення |
| isActive | Boolean | Видимість у каталозі |
| categoryId | Int | FK → Category |

#### ProductSize
| Поле | Тип | Опис |
|------|-----|------|
| id | Int | PK |
| productId | Int | FK → Product |
| size | Int | Розмір (35–42) |
| quantity | Int | Залишок на складі |

#### User
| Поле | Тип | Опис |
|------|-----|------|
| id | Int | PK |
| name | String | Ім'я |
| phone | String? | Телефон (унікальний) |
| email | String? | Email (унікальний) |
| password | String | HMAC-SHA256 хеш |
| role | String | user / admin |

#### Order
| Поле | Тип | Опис |
|------|-----|------|
| id | Int | PK |
| userId | Int? | FK → User (null для гостей) |
| customerName | String | Ім'я покупця |
| customerPhone | String | Телефон |
| customerEmail | String | Email |
| deliveryMethod | String | nova_poshta / courier |
| npCity | String | Місто НП |
| npWarehouse | String | Відділення НП |
| address | String | Адреса кур'єра |
| paymentMethod | String | liqpay / cash_on_delivery |
| paymentStatus | String | pending / paid |
| status | String | new / processing / shipped / delivered / cancelled |
| total | Float | Загальна сума |
| notes | String | Примітки |

#### OrderItem
| Поле | Тип | Опис |
|------|-----|------|
| id | Int | PK |
| orderId | Int | FK → Order (cascade delete) |
| productId | Int | FK → Product |
| size | Int | Розмір |
| quantity | Int | Кількість |
| price | Float | Ціна на момент замовлення |

#### ChatSession
| Поле | Тип | Опис |
|------|-----|------|
| id | Int | PK |
| token | String | UUID (зберігається у клієнті) |
| userId | Int? | FK → User (якщо авторизований) |
| guestName | String | Ім'я гостя |
| guestEmail | String | Email гостя |
| status | String | open / closed |

#### ChatMessage
| Поле | Тип | Опис |
|------|-----|------|
| id | Int | PK |
| sessionId | Int | FK → ChatSession |
| text | String | Текст повідомлення |
| sender | String | user / admin |

---

## 5. Авторизація

### Принцип роботи
1. Реєстрація/вхід → сервер генерує підписаний токен
2. Токен зберігається в `httpOnly` cookie (`lilu_auth`, 7 днів)
3. Кожен захищений запит читає cookie → верифікує токен
4. `proxy.ts` (Edge Runtime) захищає сторінки без звернення до БД

### Формат токена
```
base64( userId:role:expiresTimestamp:hmac_sha256_signature )
```

### Захищені маршрути
| Маршрут | Умова доступу |
|---------|--------------|
| `/account/*` | Будь-який авторизований користувач |
| `/admin/*` | Тільки роль `admin` |

### Початковий адмін
```
Email:  admin@lilu.ua
Пароль: admin123
```
Створюється командою `node prisma/seed.js`

---

## 6. API Reference

### Авторизація

| Метод | URL | Тіло | Відповідь |
|-------|-----|------|----------|
| POST | `/api/auth/register` | `{name, phone?, email?, password}` | `{ok, user, claimedOrders}` |
| POST | `/api/auth/login` | `{phone?, email?, password}` | `{ok, user}` |
| GET | `/api/auth/me` | — | User object або null |
| DELETE | `/api/auth/me` | — | `{ok}` |
| PUT | `/api/auth/profile` | `{name, phone, email, currentPassword?, newPassword?}` | User object |

### Товари

| Метод | URL | Опис |
|-------|-----|------|
| GET | `/api/products` | Список товарів (фільтри: category, color, size, search) |
| POST | `/api/products` | Створити товар (admin) |
| GET | `/api/products/[id]` | Один товар з розмірами |
| PUT | `/api/products/[id]` | Оновити товар (admin) |
| DELETE | `/api/products/[id]` | Видалити товар (admin) |

### Замовлення

| Метод | URL | Опис |
|-------|-----|------|
| POST | `/api/orders` | Створити замовлення (прив'язує userId якщо авторизований) |
| GET | `/api/orders` | Всі замовлення (admin) |
| GET | `/api/orders/mine` | Замовлення поточного користувача |
| PUT | `/api/orders/[id]` | Змінити статус/оплату (admin) |

### Нова Пошта

| Метод | URL | Опис |
|-------|-----|------|
| GET | `/api/nova-poshta/cities?q=` | Пошук міст |
| GET | `/api/nova-poshta/warehouses?cityRef=&q=` | Відділення міста (ліміт 500) |

### Чат

| Метод | URL | Опис |
|-------|-----|------|
| POST | `/api/chat/sessions` | Створити сесію |
| GET | `/api/chat/sessions` | Свої сесії (авторизований) |
| GET | `/api/chat/sessions/[id]/messages?token=&after=` | Повідомлення сесії (polling) |
| POST | `/api/chat/sessions/[id]/messages` | Надіслати повідомлення |
| GET | `/api/admin/chat` | Всі сесії (admin) |
| GET | `/api/admin/chat/[id]?after=` | Сесія + повідомлення (admin) |
| POST | `/api/admin/chat/[id]` | Відповідь адміна |
| PUT | `/api/admin/chat/[id]` | Змінити статус сесії |

---

## 7. Компоненти

| Компонент | Опис |
|-----------|------|
| `HeaderNav` | Навігація з динамічним станом авторизації |
| `CartDropdown` | Кошик (floating dropdown) з лічильником |
| `ChatWidget` | Floating чат-підтримка для покупця |
| `FilterPanel` | Панель фільтрів каталогу |
| `ProductCard` | Картка товару |
| `ProductTable` | Таблиця товарів (адмін) |
| `ProductForm` | Форма створення/редагування товару (адмін) |

---

## 8. Клієнтська логіка

### CartContext
Глобальний контекст кошика на основі `useContext`:
- `items` — масив `{productId, size, quantity, price, name}`
- `add(item)`, `remove(id, size)`, `update(id, size, qty)`, `clear()`
- Зберігається в `localStorage`

### ChatWidget — алгоритм
1. При монтуванні: перевірка авторизації → відновлення сесії зі сховища
2. Гість: `sessionStorage` → очищується при закритті вкладки
3. Авторизований: `localStorage[lilu_chat_{userId}]` → зберігається
4. Polling кожні 3 секунди → `seenIds Set` запобігає дублюванню
5. FAQ-взаємодії зберігаються локально → надсилаються адміну при підключенні спеціаліста

---

## 9. Налаштування та запуск

### Змінні оточення (`.env`)
```env
DATABASE_URL="file:./prisma/dev.db"
AUTH_SECRET="your-secret-key-change-in-production"
NOVA_POSHTA_API_KEY="your-np-api-key"
```

### Перший запуск
```bash
cd demo/sprint2
npm install
npx prisma migrate dev
node prisma/seed.js      # Заповнює товари + створює адміна
npm run dev
```

### Адмін за замовчуванням
```
URL:    http://localhost:3000/admin
Email:  admin@lilu.ua
Пароль: admin123
```

---

## 10. Ролі та доступ

| Роль | Можливості |
|------|-----------|
| Гість | Перегляд каталогу, кошик, оформлення замовлення, чат (аноімно) |
| user | Все вище + кабінет, історія замовлень, профіль, збережений чат |
| admin | Все вище + адмін-панель, управління товарами/замовленнями/користувачами/чатом |

---

*Документація оновлюється після кожного спринту*
