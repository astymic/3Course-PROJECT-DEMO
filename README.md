# LiLu E-Commerce — Demo Repository

Репозиторій розробки для стейкхолдерів проєкту «Взуттєва фабрика LiLu».

## Структура

```
demo/
├── sprint1/   ← Каталог + фільтри + облік складу + адмін-панель
├── sprint2/   ← Кошик + оплата LiqPay + доставка НП (буде додано)
└── sprint3/   ← Інфраструктура + деплой (буде додано)
```

## Sprint 1 — Запуск

```bash
cd sprint1
npm install
npx prisma migrate dev
node prisma/seed.js
npm run dev
```

- **Каталог:** http://localhost:3000
- **Адмін-панель:** http://localhost:3000/admin

## Команда

| Роль | Учасник |
|------|---------|
| PM | Мурадян Руслан |
| BA | Покась Ілля |
| Dev/QA | Мульков Максим |

## Репозиторій документації

Вся проєктна документація (WBS, Backlog, Cost Baseline, Architecture Report тощо):
[3Course-PROJECT](https://github.com/astymic/3Course-PROJECT)
