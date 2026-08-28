// Создаёт счёт на Telegram Stars и возвращает ссылку на оплату.
//
// Токен бота живёт только здесь. Клиент получает лишь готовую ссылку и
// открывает её через Telegram.WebApp.openInvoice.
//
// Деплой:
//   supabase functions deploy create-invoice
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const PRICE_STARS = 499;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // Счёт выставляем только вошедшему пользователю: его id уходит в payload,
    // чтобы вебхук знал, кому включать премиум.
    const auth = req.headers.get("authorization") || "";
    const supabase = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return json({ error: "Нужно войти" }, 401);

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Relationship Game — доступ для двоих",
        description:
          "Все 11 блоков, сколько угодно связей и разбор от ИИ. Разовая покупка: открывается вам и вашему партнёру.",
        payload: JSON.stringify({ user_id: userId, product: "premium" }),
        currency: "XTR",
        prices: [{ label: "Полный доступ", amount: PRICE_STARS }],
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error("createInvoiceLink", res.status, JSON.stringify(data));
      return json({ error: `Telegram: ${data.description || res.status}` }, 502);
    }

    return json({ link: data.result });
  } catch (e) {
    console.error("create-invoice", e);
    return json({ error: `Сбой функции: ${e instanceof Error ? e.message : e}` }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}
