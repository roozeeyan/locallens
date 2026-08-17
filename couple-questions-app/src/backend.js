// Слой доступа к данным.
//
// Пока в окружении нет ключей Supabase, приложение работает локально —
// ровно как сейчас. Как только ключи появятся, те же вызовы уходят на сервер.
import { createClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isRemote = Boolean(URL && ANON);

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
