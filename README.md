# LiLu E-Commerce — Demo Repository

Репозиторій розробки для стейкхолдерів проєкту «Взуттєва фабрика LiLu».

## Структура

```
demo/
├── docs/
│   └── documentation.md   ← Технічна документація проєкту (оновлюється після кожного спринту)
├── sprint1/               ← Каталог, фільтри, облік складу, адмін-панель
└── sprint2/               ← Авторизація, кабінет, чат-підтримка, адмін-інструменти
```

---

## Sprint 1 — Запуск

**Що включено:** каталог товарів, фільтри, облік залишків, адмін-панель (CRUD товарів, замовлень).

```bash
cd sprint1
npm install
npx prisma migrate dev
node prisma/seed.js
npm run dev
```

- **Каталог:** http://localhost:3000
- **Адмін-панель:** http://localhost:3000/admin

---

## Sprint 2 — Запуск

**Що включено:** авторизація, особистий кабінет покупця, live чат-підтримка, управління користувачами.

```bash
cd sprint2
npm install
npx prisma migrate dev
node prisma/seed.js
npm run dev
```

- **Сайт:** http://localhost:3000
- **Кабінет:** http://localhost:3000/account
- **Адмін-панель:** http://localhost:3000/admin
- **Адмін за замовчуванням:** `admin@lilu.ua` / `admin123`

---

## Документація

Технічна документація проєкту знаходиться у папці [`docs/documentation.md`](./docs/documentation.md).

Містить: архітектуру, схему БД, API reference, опис компонентів, авторизацію, ролі та налаштування.

---

## Проєктна документація

Вся проєктна документація (WBS, Backlog, Cost Baseline, Architecture Report тощо):
[3Course-PROJECT](https://github.com/astymic/3Course-PROJECT)

---

## Команда

| Роль | Учасник |
|------|---------|
| PM | Мурадян Руслан |
| BA | Покась Ілля |
| Dev/QA | Мульков Максим |
