// Слой доступа к данным.
//
// Пока в окружении нет ключей Supabase, приложение работает локально —
// ровно как сейчас. Как только ключи появятся, те же вызовы уходят на сервер.
import { createClient } from "@supabase/supabase-js";

/**
 * Адрес проекта должен быть голым: https://xxxx.supabase.co
 * Лишняя косая черта или путь в конце ломают все запросы к серверу
 * с ошибкой «Invalid path specified in request URL», поэтому чистим сами.
 */
function cleanUrl(value) {
  if (!value) return value;
  const trimmed = value.trim();
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new globalThis.URL(withScheme).origin;
  } catch {
    return withScheme.replace(/\/+$/, "");
  }
}

const URL = cleanUrl(import.meta.env.VITE_SUPABASE_URL);
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isRemote = Boolean(URL && ANON);
export { URL as serverUrl, ANON as anonKey };

export const supabase = isRemote
  ? createClient(URL, ANON, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

/** Вход через Telegram: подпись проверяет функция telegram-auth. */
export async function signIn() {
  if (!isRemote) return { ok: false, reason: "local" };

  const { data: current } = await supabase.auth.getSession();
  if (current.session) return { ok: true };

  const initData = window.Telegram?.WebApp?.initData;
  if (!initData) return { ok: false, reason: "no-telegram" };

  const res = await fetch(`${URL}/functions/v1/telegram-auth`, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: ANON },
    body: JSON.stringify({ initData }),
  });
  if (!res.ok) return { ok: false, reason: "auth-failed" };

  const { token_hash, email } = await res.json();
  const { error } = await supabase.auth.verifyOtp({ token_hash, type: "magiclink", email });
  return error ? { ok: false, reason: "otp-failed" } : { ok: true };
}

export async function currentUserId() {
  if (!isRemote) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id || null;
}

// ------------------------------------------------------------------ профиль

export async function loadProfile() {
  const { data } = await supabase.from("profiles").select("*").maybeSingle();
  return data;
}

export async function saveProfile(patch) {
  const id = await currentUserId();
  return supabase.from("profiles").update(patch).eq("id", id);
}

// ------------------------------------------------------------------ ответы

/** Свои ответы плюс все чужие, которые база согласилась показать. */
export async function loadAnswers() {
  const { data, error } = await supabase.from("answers").select("user_id, question_id, body, updated_at");
  return error ? [] : data;
}

export async function saveAnswer(questionId, block, body) {
  const id = await currentUserId();
  return supabase
    .from("answers")
    .upsert({ user_id: id, question_id: questionId, block, body, updated_at: new Date().toISOString() });
}

export async function deleteAnswer(questionId) {
  const id = await currentUserId();
  return supabase.from("answers").delete().eq("user_id", id).eq("question_id", questionId);
}

// ------------------------------------------------------------------- связи

export function makeInviteCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return [...bytes].map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 12);
}

export async function loadConnections() {
  const { data, error } = await supabase
    .from("connections")
    .select("id, a, b, kind, invite_code, status, created_at");
  return error ? [] : data;
}

export async function createInvite(kind = "candidate") {
  const id = await currentUserId();
  const invite_code = makeInviteCode();
  const { data, error } = await supabase
    .from("connections")
    .insert({ a: id, kind, invite_code, status: "pending" })
    .select()
    .single();
  return error ? null : data;
}

export async function acceptInvite(code) {
  const { data, error } = await supabase.rpc("accept_invite", { code });
  return error ? { ok: false, message: error.message } : { ok: true, connection: data };
}

export async function removeConnection(id) {
  return supabase.from("connections").delete().eq("id", id);
}

// ----------------------------------------------------------------- отметки

export async function loadReactions() {
  const { data, error } = await supabase
    .from("reactions")
    .select("connection_id, user_id, question_id, value");
  return error ? [] : data;
}

export async function saveReaction(connectionId, questionId, value) {
  const id = await currentUserId();
  if (!value) {
    return supabase
      .from("reactions")
      .delete()
      .eq("connection_id", connectionId)
      .eq("user_id", id)
      .eq("question_id", questionId);
  }
  return supabase.from("reactions").upsert({
    connection_id: connectionId,
    user_id: id,
    question_id: questionId,
    value,
    updated_at: new Date().toISOString(),
  });
}

// ------------------------------------------------------------------ оплата

/**
 * Покупка Premium за Telegram Stars. Ссылку на счёт создаёт серверная функция —
 * токен бота в приложение не попадает. Оплату проводит сам Telegram, а премиум
 * проставляет вебхук после подтверждения платежа.
 */
export async function buyPremium() {
  if (!isRemote) return { ok: false, reason: "local" };

  const tg = window.Telegram?.WebApp;
  if (!tg?.openInvoice) return { ok: false, reason: "no-telegram" };

  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) return { ok: false, reason: "no-session" };

  const res = await fetch(`${URL}/functions/v1/create-invoice`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: ANON,
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ product: "premium" }),
  });
  // Причину отказа тащим наружу: без неё на телефоне видно только
  // «не получилось», и разбираться приходится по журналам сервера.
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || !payload.link) {
    return { ok: false, reason: "invoice-failed", detail: payload.error || `код ${res.status}` };
  }

  const { link } = payload;

  return new Promise((resolve) => {
    tg.openInvoice(link, (status) => {
      if (status === "paid") resolve({ ok: true });
      else if (status === "cancelled") resolve({ ok: false, reason: "cancelled" });
      else resolve({ ok: false, reason: status || "failed" });
    });
  });
}
