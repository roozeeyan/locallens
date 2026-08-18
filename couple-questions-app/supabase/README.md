# Подключение сервера

Пока ключей нет, приложение работает локально: ответы лежат в браузере, связи
не синхронизируются. Чтобы заработали приглашения и общий доступ, нужен проект
Supabase. Это бесплатно и занимает минут десять.

## 1. Создать проект

1. Зайти на supabase.com, войти через GitHub
2. **New project** — имя любое, регион ближе к пользователям (Frankfurt)
3. Придумать пароль базы и сохранить его
4. Дождаться, пока проект поднимется

## 2. Создать таблицы

**SQL Editor** → **New query** → вставить целиком содержимое `schema.sql` →
**Run**. Должно выполниться без ошибок.

Здесь же задаётся главное правило приватности: чужой ответ не отдаётся, пока вы
не ответили на тот же вопрос. Оно живёт в базе, а не в приложении, — обойти его
из клиента нельзя.

## 3. Подключить вход через Telegram

Нужен Supabase CLI (`npm i -g supabase`):

```
supabase login
supabase link --project-ref <ref из адреса проекта>
supabase functions deploy telegram-auth --no-verify-jwt
supabase secrets set TELEGRAM_BOT_TOKEN=<токен от BotFather>
```

Токен бота — тот, что BotFather прислал при создании. Он остаётся на сервере;
в приложение не попадает.

## 4. Прописать ключи в Vercel

**Settings → Environment Variables** проекта на Vercel, добавить две переменные:

| Имя | Где взять |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | там же → Project API keys → `anon` `public` |

Ключ `anon` публичный, его видно в браузере — так и задумано, доступ к данным
ограничивают политики из `schema.sql`. **Ключ `service_role` в приложение
добавлять нельзя** — он даёт полный доступ ко всем данным в обход правил.

После сохранения переменных сделать **Redeploy**.

## 5. Оплата и напоминания

Ещё три функции. Секреты задаются один раз:

```
supabase functions deploy create-invoice
supabase functions deploy telegram-webhook --no-verify-jwt
supabase functions deploy send-reminders
supabase secrets set TELEGRAM_WEBHOOK_SECRET=<длинная случайная строка>
supabase secrets set REMINDER_SECRET=<ещё одна длинная строка>
```

Подписать бота на вебхук платежей — открыть в браузере:

```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<project>.supabase.co/functions/v1/telegram-webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

Расписание напоминаний — в SQL Editor:

```sql
select cron.schedule('rg-reminders', '0 15 * * *', $$
  select net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/send-reminders',
    headers := '{"x-reminder-secret": "<REMINDER_SECRET>"}'::jsonb
  );
$$);
```

Чтобы принимать звёзды, у бота должны быть включены платежи — это делается
в BotFather, раздел **Payments**.

## 6. Проверить

Открыть мини-апп в Telegram. Если всё срослось, на экране «Связи» кнопка
«Пригласить» создаёт рабочую ссылку, а принятое приглашение появляется у обоих.

## Локальная разработка

Файл `.env.local` в корне `couple-questions-app`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Он в `.gitignore` и в репозиторий не попадёт.
