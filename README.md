# LiLu E-Commerce — Demo Repository

Репозиторій розробки для проєкту «Взуттєва фабрика LiLu».

## Структура

```
demo/
├── docs/
│   └── documentation.md   ← Технічна документація проєкту
├── sprint1/               ← Каталог, фільтри, облік складу, адмін-панель
└── sprint2/               ← Авторизація, кабінет, чат-підтримка, адмін-інструменти
```

---

## Запуск

```bash
cd sprint2        # або sprint1
npm install
npx prisma migrate dev
node prisma/seed.js
npm run dev
```

- **Сайт:** http://localhost:3000
- **Адмін-панель:** http://localhost:3000/admin
- **Адмін за замовчуванням:** `admin@lilu.ua` / `admin123`

---

## Документація

Технічна документація знаходиться у [`docs/documentation.md`](./docs/documentation.md).

---

## Команда

| Роль | Учасник |
|------|---------|
| PM | Мурадян Руслан |
| BA | Покась Ілля |
| Dev/QA | Мульков Максим |
