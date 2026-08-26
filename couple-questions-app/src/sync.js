// Связка приложения с сервером.
//
// Пока ключей Supabase нет, все функции молча ничего не делают и приложение
// работает локально. Как только ключи появились — состояние подтягивается
// с сервера и каждое изменение уходит туда же.
import { isRemote, supabase, makeInviteCode, serverUrl, anonKey } from "./backend.js";
import { hasCloud, cloudGet, cloudGetSure, cloudSet } from "./cloud.js";
import { QUESTIONS } from "./data.js";
import { DECK_QUESTIONS } from "./decks.js";

const ALL = [...QUESTIONS, ...DECK_QUESTIONS];
const blockOf = (qid) => ALL.find((q) => q.id === qid)?.cat || "unknown";

const SESSION_KEY = "rgsess";
const ID_KEY = "rgid";

/**
 * Отметка о том, что аккаунт у человека уже был. Нужна, чтобы при сбое
 * восстановления не завести новый: старые ответы и связи остались бы на
 * сервере без хозяина, а человек увидел бы пустое приложение.
 */
function localId() {
  try {
    return localStorage.getItem(ID_KEY) || null;
  } catch {
    return null;
  }
}

function rememberId(id) {
  if (!id) return;
  try {
    localStorage.setItem(ID_KEY, id);
  } catch {
    // приватный режим — остаётся облако
  }
  cloudSet(ID_KEY, id);
}

let me = null;
let lastError = "";

/** Текст последней ошибки сервера — показывается в профиле. */
export function lastSyncError() {
  return lastError;
}

/** Кладёт вход в облако Telegram, чтобы при следующем запуске узнать человека. */
async function saveSession(s) {
  if (!hasCloud() || !s?.refresh_token) return;
  await cloudSet(
    SESSION_KEY,
    JSON.stringify({ access_token: s.access_token, refresh_token: s.refresh_token })
  );
}

async function rememberSession() {
  if (!hasCloud()) return;
  const { data } = await supabase.auth.getSession();
  await saveSession(data.session);
}

/**
 * Ключ входа одноразовый: как только клиент обновляет его сам (а он делает
 * это молча, пока приложение открыто), прежний ключ сервер больше не примет.
 * Поэтому копию в облаке переписываем при каждом обновлении — иначе при
 * следующем запуске вход не восстановится уже никогда.
 */
if (isRemote) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (session && (event === "TOKEN_REFRESHED" || event === "SIGNED_IN" || event === "USER_UPDATED")) {
      saveSession(session);
    }
  });
}

/**
 * Пробует продолжить прошлый вход, сохранённый в облаке Telegram.
 * Возвращает { id } при успехе либо { reason } — почему не вышло.
 */
async function restoreSession() {
  if (!hasCloud()) return { reason: "no-cloud" };

  const raw = await cloudGetSure(SESSION_KEY);
  if (raw === undefined) return { reason: "cloud-unreachable" };
  if (!raw) return { reason: "nothing-stored" };

  let keys;
  try {
    keys = JSON.parse(raw);
  } catch {
    return { reason: "broken" };
  }
  if (!keys?.access_token || !keys?.refresh_token) return { reason: "broken" };

  const { data, error } = await supabase.auth.setSession(keys);
  if (error || !data.session) return { reason: "rejected" };

  await saveSession(data.session); // ключ обновился — сохраняем новый
  return { id: data.session.user.id };
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
    rememberId(me);
    await rememberSession();
    return me;
  }

  const restored = await restoreSession();
  if (restored.id) {
    me = restored.id;
    rememberId(me);
    return me;
  }

  // Вход не восстановился. Прежде чем заводить новый аккаунт, убеждаемся,
  // что прежнего не было: иначе человек потеряет доступ к своим данным.
  const cloudId = hasCloud() ? await cloudGetSure(ID_KEY) : null;
  const hadAccount = Boolean(localId() || cloudId);

  if (cloudId === undefined || restored.reason === "cloud-unreachable") {
    lastError = "Telegram не отдал сохранённый вход. Закройте приложение и откройте заново.";
    return null;
  }

  if (hadAccount) {
    // Аккаунт был, но ключ входа устарел. Новый заводить нельзя — прежние
    // ответы и связи остались бы на сервере без хозяина.
    lastError =
      "Ключ входа устарел. Откройте приложение заново — если не поможет, напишите в поддержку, доступ вернём.";
    return null;
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
    else {
      rememberId(me);
      await rememberSession();
    }
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

  // Каждое нажатие даёт новую ссылку: одну можно отправить одному человеку,
  // и приглашать следующих, не дожидаясь, пока предыдущий примет.
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
    { data: consents },
  ] = await Promise.all([
    supabase.from("connections").select("id, a, b, kind, invite_code, status, created_at"),
    supabase.from("answers").select("user_id, question_id, body, updated_at"),
    supabase.from("reactions").select("connection_id, user_id, question_id, value"),
    supabase.from("export_consents").select("connection_id, user_id"),
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
      const mineOk = (consents || []).some(
        (x) => x.connection_id === c.id && x.user_id === me
      );
      const theirOk = (consents || []).some(
        (x) => x.connection_id === c.id && x.user_id === other
      );

      return {
        id: c.id,
        name: names[other] || "Партнёр",
        kind: c.kind,
        answers: theirs[other] || {},
        reactions,
        exportConsent: { mine: mineOk, theirs: theirOk },
      };
    });

  // История приглашений: всё, что отправила я сама, принятое и ещё ждущее.
  const invites = (conns || [])
    .filter((c) => c.a === me)
    .map((c) => ({
      id: c.id,
      code: c.invite_code,
      kind: c.kind,
      accepted: c.status === "active" && Boolean(c.b),
      name: c.b ? names[c.b] || "" : "",
      at: Date.parse(c.created_at) || 0,
    }))
    .sort((x, y) => y.at - x.at);

  return {
    ok: !failed,
    invites,
    profile: {
      name: profile?.name || localName || "",
      status: profile?.status || "taken",
      theme: profile?.theme || "cream",
      lang: profile?.lang || "ru",
      hiddenBlocks: profile?.hidden_blocks || [],
      premium: Boolean(profile?.premium),
      reminder: profile?.reminder || "week",
      consentAt: profile?.consent_at ? Date.parse(profile.consent_at) : null,
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
  if ("consentAt" in patch && patch.consentAt) {
    row.consent_at = new Date(patch.consentAt).toISOString();
  }
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

/**
 * Разбор от ИИ. Считает его серверная функция: ключ модели не должен
 * попадать в приложение, а отбор ответов нельзя доверять клиенту.
 */
export async function fetchVerdict(connectionId, lang, refresh = false) {
  if (!isRemote || !me) return { ok: false, message: "Нет связи с сервером." };

  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) return { ok: false, message: "Нет входа. Откройте приложение заново." };

  try {
    const res = await fetch(`${serverUrl}/functions/v1/verdict`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: anonKey,
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ connectionId, lang, refresh }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, message: payload.error || "Разбор пока недоступен.", info: payload };
    }
    return { ok: true, body: payload.body, cached: payload.cached };
  } catch (e) {
    return { ok: false, message: e?.message || "Сервер не ответил." };
  }
}

/**
 * Разрешение на совместную выгрузку. Каждый ставит его только за себя;
 * файл с ответами обоих собирается, только когда согласились оба.
 */
export async function setExportConsent(connectionId, granted) {
  if (!isRemote || !me) return { ok: false, message: "Нет связи с сервером." };

  if (!granted) {
    const { error } = await supabase
      .from("export_consents")
      .delete()
      .eq("connection_id", connectionId)
      .eq("user_id", me);
    return error ? { ok: false, message: error.message } : { ok: true };
  }

  // Обычная вставка, а не upsert: upsert требует права на изменение строки,
  // а разрешение менять нечего — оно либо есть, либо его нет. Повторное
  // нажатие упирается в уникальный ключ, и это нормальный исход.
  const { error } = await supabase
    .from("export_consents")
    .insert({ connection_id: connectionId, user_id: me });

  if (error && error.code !== "23505") return { ok: false, message: error.message };
  return { ok: true };
}

/** Разрыв связи: пара расходится, но оба остаются в приложении. */
export async function dropConnection(id) {
  if (!isRemote || !me) return { ok: true };
  const { error } = await supabase.from("connections").delete().eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

/**
 * Полное удаление: стирает профиль, ответы, связи и отметки, а затем сам
 * аккаунт. После этого партнёры перестают видеть ответы этого человека —
 * то, что они успели выгрузить в PDF, остаётся у них на устройстве.
 */
export async function deleteAccount() {
  if (!isRemote || !me) return { ok: true }; // локальный режим — стирать нечего
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { ok: false, message: error.message };
  await supabase.auth.signOut();
  await forgetLogin();
  me = null;
  return { ok: true };
}

/** Стирает следы прошлого входа: и ключ, и отметку о том, что аккаунт был. */
async function forgetLogin() {
  try {
    localStorage.removeItem(ID_KEY);
  } catch {
    // приватный режим
  }
  if (hasCloud()) {
    await cloudSet(SESSION_KEY, "");
    await cloudSet(ID_KEY, "");
  }
}

/**
 * Аварийный вход заново. Нужен, когда ключ входа устарел и приложение
 * само себя разблокировать не может. Заводит новый аккаунт — прежние ответы
 * остаются на сервере, их переносит поддержка. Вызывать только по явной
 * просьбе человека и после подтверждения.
 */
export async function resetLogin() {
  if (!isRemote) return { ok: false, message: "сервер не подключён" };
  try {
    await supabase.auth.signOut();
  } catch {
    // сессии могло и не быть
  }
  await forgetLogin();
  me = null;
  lastError = "";
  const id = await ensureSession();
  if (!id) return { ok: false, message: lastError || "сервер не ответил" };
  return { ok: true, id };
}

export function currentUser() {
  return me;
}
