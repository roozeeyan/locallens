// Проверка подписи Telegram Mini App и выдача сессии Supabase.
//
// Клиент передаёт сырую строку initData. Подделать её нельзя: подпись
// считается ботовым токеном, который лежит только здесь, в секретах функции.
//
// Деплой:
//   supabase functions deploy telegram-auth --no-verify-jwt
//   supabase secrets set TELEGRAM_BOT_TOKEN=...
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function hmac(key: ArrayBuffer | Uint8Array, msg: string) {
  const k = await crypto.subtle.importKey(
    "raw",
    key as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg)));
}

const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");

/** Возвращает данные пользователя, если подпись верна и свежая. */
async function verifyInitData(initData: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;

  params.delete("hash");
  const checkString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secret = await hmac(new TextEncoder().encode("WebAppData"), BOT_TOKEN);
  const signature = await hmac(secret, checkString);
  if (hex(signature) !== hash) return null;

  // Данные старше суток не принимаем — защита от переигрывания.
  const authDate = Number(params.get("auth_date") || 0);
  if (!authDate || Date.now() / 1000 - authDate > 86400) return null;

  const user = params.get("user");
  return user ? JSON.parse(user) : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { initData } = await req.json();
    const tgUser = await verifyInitData(initData || "");
    if (!tgUser?.id) {
      return json({ error: "Подпись Telegram не подтвердилась" }, 401);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const email = `tg${tgUser.id}@telegram.local`;

    // Профиль уже заводили — просто входим. Нет — создаём пользователя.
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("tg_id", tgUser.id)
      .maybeSingle();

    let userId = existing?.id as string | undefined;

    if (userId) {
      // Аккаунт мог быть заведён анонимно — тогда почты у него нет, и
      // одноразовый вход по ней не выдать. Проставляем её задним числом,
      // иначе человек с прежними ответами остался бы за дверью.
      const { data: who } = await admin.auth.admin.getUserById(userId);
      if (who.user && who.user.email !== email) {
        const { error: upErr } = await admin.auth.admin.updateUserById(userId, {
          email,
          email_confirm: true,
        });
        if (upErr) return json({ error: `Не удалось привязать вход: ${upErr.message}` }, 500);
      }
    } else {
      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { tg_id: tgUser.id },
      });
      if (error || !created.user) return json({ error: "Не удалось создать пользователя" }, 500);
      userId = created.user.id;

      const name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");
      await admin.from("profiles").insert({ id: userId, tg_id: tgUser.id, name });
    }

    // Одноразовый токен: клиент обменяет его на сессию через verifyOtp.
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkErr || !link?.properties?.hashed_token) {
      return json({ error: `Не удалось выдать сессию: ${linkErr?.message || ""}` }, 500);
    }

    return json({ token_hash: link.properties.hashed_token, email });
  } catch (e) {
    return json({ error: `Сбой функции: ${e instanceof Error ? e.message : e}` }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}
