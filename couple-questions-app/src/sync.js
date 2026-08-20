// Связка приложения с сервером.
//
// Пока ключей Supabase нет, все функции молча ничего не делают и приложение
// работает локально. Как только ключи появились — состояние подтягивается
// с сервера и каждое изменение уходит туда же.
import { isRemote, supabase, makeInviteCode, serverUrl, anonKey } from "./backend.js";
import { hasCloud, cloudGet, cloudSet } from "./cloud.js";
import { QUESTIONS } from "./data.js";
import { DECK_QUESTIONS } from "./decks.js";

const ALL = [...QUESTIONS, ...DECK_QUESTIONS];
const blockOf = (qid) => ALL.find((q) => q.id === qid)?.cat || "unknown";

const SESSION_KEY = "rgsess";

let me = null;
let lastError = "";

/** Текст последней ошибки сервера — показывается в профиле. */
export function lastSyncError() {
  return lastError;
}

/** Кладёт вход в облако Telegram, чтобы при следующем запуске узнать человека. */
async function rememberSession() {
  if (!hasCloud()) return;
  const { data } = await supabase.auth.getSession();
  const s = data.session;
  if (!s) return;
  await cloudSet(
    SESSION_KEY,
    JSON.stringify({ access_token: s.access_token, refresh_token: s.refresh_token })
  );
}

/** Пробует продолжить прошлый вход, сохранённый в облаке Telegram. */
async function restoreSession() {
  if (!hasCloud()) return null;
  const raw = await cloudGet(SESSION_KEY);
  if (!raw) return null;
  try {
    const { access_token, refresh_token } = JSON.parse(raw);
    if (!access_token || !refresh_token) return null;
    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error || !data.session) return null;
    await rememberSession(); // токен обновился — сохраняем новый
    return data.session.user.id;
  } catch {
    return null;
  }
}

/**
 * Вход. Сначала продолжаем прошлую сессию, затем пробуем Telegram-функцию,
 * и только потом входим анонимно — для этого не нужен ни токен бота, ни консоль.
 */
export async function ensureSession() {
  if (!isRemote) return null;

  const { data: existing } = await supabase.auth.getSession();
  if (existing.session) {
    me = existing.session.user.id;
    await rememberSession();
    return me;
  }

  const restored = await restoreSession();
  if (restored) {
    me = restored;
    return me;
  }

  const initData = window.Telegram?.WebApp?.initData;
  if (initData) {
    try {
      const res = await fetch(`${serverUrl}/functions/v1/telegram-auth`, {
        method: "POST",
        headers: { "content-type": "application/json", apikey: anonKey },
        body: JSON.stringify({ initData }),
      });
      if (res.ok) {
        const { token_hash, email } = await res.json();
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: "magiclink",
          email,
        });
        if (!error) {
          const { data } = await supabase.auth.getUser();
          me = data.user?.id || null;
          await rememberSession();
          return me;
        }
      }
    } catch {
      // функции нет или она недоступна — идём обычным путём
    }
  }

  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      lastError = error.message || "вход отклонён сервером";
      return null;
    }
    me = data.user?.id || null;
    if (!me) lastError = "сервер не вернул пользователя";
    else await rememberSession();
    return me;
  } catch (e) {
    lastError = e?.message || "сервер недоступен";
    return null;
  }
}

/** Создаёт строку профиля при первом входе. */
async function ensureProfile(name) {
  if (!me) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", me).maybeSingle();
  if (data) return data;

  const row = { id: me, name: name || "" };
  const { data: created, error } = await supabase.from("profiles").insert(row).select().single();
  if (error) lastError = error.message;
  return created || row;
}

/**
 * Создаёт приглашение. Профиль создаётся здесь же: без строки в profiles
 * база не примет связь.
 */
export async function createInviteRemote(kind, localName) {
  if (!isRemote) return { ok: false, message: "Сервер не подключён." };
  if (!me) return { ok: false, message: "Нет входа на сервер. Откройте приложение заново." };

  await ensureProfile(localName);
  const { data, error } = await supabase
    .from("connections")
    .insert({ a: me, kind, invite_code: makeInviteCode(), status: "pending" })
    .select()
    .single();

  return error ? { ok: false, message: error.message } : { ok: true, code: data.invite_code };
}

/** Принимает приглашение по коду. */
export async function joinByCode(code, localName) {
  if (!isRemote) return { ok: false, message: "Сервер не подключён." };
  if (!me) return { ok: false, message: "Нет входа на сервер. Откройте приложение заново." };

  await ensureProfile(localName);
  const { data, error } = await supabase.rpc("accept_invite", { code });
  return error ? { ok: false, message: error.message } : { ok: true, connection: data };
}

/** Забирает с сервера всё, что положено видеть. */
export async function pullAll(localName) {
  if (!isRemote || !me) return null;

  const profile = await ensureProfile(localName);

  const [
    { data: conns, error: connErr },
    { data: rows, error: ansErr },
    { data: reacts },
  ] = await Promise.all([
    supabase.from("connections").select("id, a, b, kind, invite_code, status"),
    supabase.from("answers").select("user_id, question_id, body, updated_at"),
    supabase.from("reactions").select("connection_id, user_id, question_id, value"),
  ]);

  const failed = connErr || ansErr;
  if (failed) lastError = failed.message;

  // Свои ответы отделяем от чужих: чужие сервер отдал только те,
  // на которые мы уже ответили сами.
  const mine = {};
  const theirs = {};
  for (const r of rows || []) {
    const target = r.user_id === me ? mine : (theirs[r.user_id] ||= {});
    target[r.question_id] = { text: r.body, at: Date.parse(r.updated_at) || Date.now() };
  }

  // Имена собеседников
  const otherIds = (conns || [])
    .map((c) => (c.a === me ? c.b : c.a))
    .filter(Boolean);
  const names = {};
  if (otherIds.length) {
    const { data: people } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", otherIds);
    for (const p of people || []) names[p.id] = p.name;
  }

  const connections = (conns || [])
    .filter((c) => c.status === "active" && c.b)
    .map((c) => {
      const other = c.a === me ? c.b : c.a;
      const reactions = {};
      for (const r of reacts || []) {
        if (r.connection_id === c.id && r.user_id === me) reactions[r.question_id] = r.value;
      }
      return {
        id: c.id,
        name: names[other] || "Партнёр",
        kind: c.kind,
        answers: theirs[other] || {},
        reactions,
      };
    });

  return {
    ok: !failed,
    profile: {
      name: profile?.name || localName || "",
      status: profile?.status || "taken",
      theme: profile?.theme || "cream",
      lang: profile?.lang || "ru",
      hiddenBlocks: profile?.hidden_blocks || [],
      premium: Boolean(profile?.premium),
      reminder: profile?.reminder || "week",
    },
    answers: mine,
    connections,
  };
}

/* ------------------------------------------------------- отправка изменений */

export async function pushAnswer(questionId, text) {
  if (!isRemote || !me) return;
  if (!text) {
    await supabase.from("answers").delete().eq("user_id", me).eq("question_id", questionId);
    return;
  }
  await supabase.from("answers").upsert({
    user_id: me,
    question_id: questionId,
    block: blockOf(questionId),
    body: text,
    updated_at: new Date().toISOString(),
  });
}

export async function pushProfile(patch) {
  if (!isRemote || !me) return;
  const row = {};
  if ("name" in patch) row.name = patch.name;
  if ("status" in patch) row.status = patch.status;
  if ("theme" in patch) row.theme = patch.theme;
  if ("lang" in patch) row.lang = patch.lang;
  if ("reminder" in patch) row.reminder = patch.reminder;
  if ("hiddenBlocks" in patch) row.hidden_blocks = patch.hiddenBlocks;
  // premium сюда не попадает намеренно: его ставит только вебхук платежей
  if (Object.keys(row).length) await supabase.from("profiles").update(row).eq("id", me);
}

export async function pushReaction(connectionId, questionId, value) {
  if (!isRemote || !me) return;
  if (!value) {
    await supabase
      .from("reactions")
      .delete()
      .eq("connection_id", connectionId)
      .eq("user_id", me)
      .eq("question_id", questionId);
    return;
  }
  await supabase.from("reactions").upsert({
    connection_id: connectionId,
    user_id: me,
    question_id: questionId,
    value,
    updated_at: new Date().toISOString(),
  });
}

export function currentUser() {
  return me;
}
