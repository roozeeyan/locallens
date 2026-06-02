# LocalLens 🧭
Платформа для гайдов по городам — Telegram Mini App

---

## 🚀 Деплой на Vercel (пошагово)

### Шаг 1 — GitHub
1. Зайди на https://github.com и создай аккаунт (если нет)
2. Нажми кнопку **"New repository"** (зелёная кнопка)
3. Назови репозиторий: `locallens`
4. Нажми **"Create repository"**
5. Нажми **"uploading an existing file"**
6. Перетащи ВСЕ файлы из этой папки (сохраняя структуру папок)
7. Нажми **"Commit changes"**

### Шаг 2 — Vercel
1. Зайди на https://vercel.com/new
2. Нажми **"Continue with GitHub"**
3. Найди репозиторий `locallens` → нажми **Import**
4. Ничего не меняй → нажми **Deploy**
5. Через ~2 минуты получишь ссылку вида: `locallens-xxx.vercel.app`

### Шаг 3 — Telegram Bot
1. Открой @BotFather в Telegram
2. Напиши `/newbot`
3. Придумай имя бота (например: LocalLens Guide)
4. Придумай username (например: locallens_bot)
5. Сохрани токен который пришлёт BotFather

### Шаг 4 — Подключить Mini App
1. В @BotFather напиши `/newapp`
2. Выбери своего бота
3. Вставь ссылку с Vercel
4. Готово! Приложение работает внутри Telegram

---

## 📁 Структура проекта
```
locallens/
├── public/
│   └── index.html
├── src/
│   ├── index.js
│   └── App.jsx
├── package.json
└── README.md
```
