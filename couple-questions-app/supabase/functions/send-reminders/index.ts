// Рассылает напоминания о разговоре тем, кто их не отключил.
//
// Ритм задаёт сам пользователь: раз в неделю или раз в две. Ежедневных
// напоминаний тут нет намеренно — разговор вдвоём не бывает ежедневной
// привычкой, и частые пинги только раздражают.
//
// Деплой:
//   supabase functions deploy send-reminders
//   supabase secrets set REMINDER_SECRET=<длинная строка>
//
// Расписание — в SQL Editor (раз в сутки в 15:00 UTC):
//   select cron.schedule('rg-reminders', '0 15 * * *', $$
//     select net.http_post(
//       url := 'https://<project>.supabase.co/functions/v1/send-reminders',
//       headers := '{"x-reminder-secret": "<REMINDER_SECRET>"}'::jsonb
//     );
//   $$);
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SECRET = Deno.env.get("REMINDER_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BOT_NAME = "relationship_game_by_roo_bot";

const DAYS: Record<string, number> = { week: 7, twoweeks: 14 };

Deno.serve(async (req) => {
  if (req.headers.get("x-reminder-secret") !== SECRET) {
    return new Response("forbidden", { status: 403 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: people } = await admin
    .from("profiles")
    .select("id, tg_id, name, reminder, last_reminded_at")
    .neq("reminder", "off")
    .not("tg_id", "is", null);

  const now = Date.now();
  let sent = 0;

  for (const person of people || []) {
    const gap = DAYS[person.reminder] ?? 7;
    const last = person.last_reminded_at ? new Date(person.last_reminded_at).getTime() : 0;
    if (now - last < gap * 86400_000) continue;

    // Считаем, сколько сравнений ждёт отметки: это и есть повод написать.
    const { count } = await admin
      .from("reactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", person.id);

    const text =
      count && count > 0
        ? "Время для разговора. Откройте приложение — там ждут новые вопросы и ответы вашей пары."
        : "Время для разговора. Один вопрос сегодня — уже разговор, которого раньше не было.";

    const ok = await send(person.tg_id, text);
    if (ok) {
      await admin
        .from("profiles")
        .update({ last_reminded_at: new Date().toISOString() })
        .eq("id", person.id);
      sent++;
    }
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { "content-type": "application/json" },
  });
});

async function send(chatId: number, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: {
        inline_keyboard: [[{ text: "Открыть", url: `https://t.me/${BOT_NAME}?startapp=reminder` }]],
      },
    }),
  });
  const data = await res.json();
  // Человек заблокировал бота — это не ошибка рассылки, просто пропускаем.
  return Boolean(data.ok);
}
