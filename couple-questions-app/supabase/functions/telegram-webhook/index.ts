// Вебхук бота: подтверждает платежи и включает Premium.
//
// Премиум ставится только здесь, после того как Telegram подтвердил оплату.
// Клиент такую отметку выставить не может — в политиках RLS поле premium
// закрыто на запись.
//
// Деплой:
//   supabase functions deploy telegram-webhook --no-verify-jwt
//   supabase secrets set TELEGRAM_WEBHOOK_SECRET=<любая длинная строка>
//
// Подписка бота на вебхук:
//   https://api.telegram.org/bot<TOKEN>/setWebhook
//     ?url=https://<project>.supabase.co/functions/v1/telegram-webhook
//     &secret_token=<TELEGRAM_WEBHOOK_SECRET>
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  // Telegram присылает секрет в заголовке — чужой запрос сюда не пройдёт.
  if (req.headers.get("x-telegram-bot-api-secret-token") !== WEBHOOK_SECRET) {
    return new Response("forbidden", { status: 403 });
  }

  const update = await req.json();

  // Шаг 1: подтверждаем готовность принять платёж.
  if (update.pre_checkout_query) {
    await tg("answerPreCheckoutQuery", {
      pre_checkout_query_id: update.pre_checkout_query.id,
      ok: true,
    });
    return new Response("ok");
  }

  // Шаг 2: платёж прошёл — открываем доступ.
  const payment = update.message?.successful_payment;
  if (payment) {
    let payload: { user_id?: string; product?: string } = {};
    try {
      payload = JSON.parse(payment.invoice_payload || "{}");
    } catch {
      payload = {};
    }

    if (payload.user_id && payload.product === "premium") {
      const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      await admin.from("profiles").update({ premium: true }).eq("id", payload.user_id);
      await admin.from("payments").insert({
        user_id: payload.user_id,
        product: payload.product,
        stars: payment.total_amount,
        charge_id: payment.telegram_payment_charge_id,
      });
    }

    await tg("sendMessage", {
      chat_id: update.message.chat.id,
      text: "Доступ открыт. Возвращайтесь в приложение — все блоки уже на месте.",
    });
    return new Response("ok");
  }

  return new Response("ok");
});

function tg(method: string, body: unknown) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
