import { useSyncExternalStore } from "react";
import { CATEGORIES, QUESTIONS } from "./data.js";
import { DEFAULT_PALETTE } from "./theme.js";
import { DECKS, DECK_QUESTIONS, findDeck } from "./decks.js";
import { pushAnswer, pushProfile, pushReaction } from "./sync.js";
import { cloudSet, hasCloud } from "./cloud.js";

const KEY = "rg_state_v2";
const CLOUD_KEY = "rgstate";

const empty = {
  profile: {
    name: "",
    status: "taken", // taken | free
    theme: DEFAULT_PALETTE,
    hiddenBlocks: [], // id блоков, скрытых от всех связей
    premium: false,
    onboarded: false,
    situation: null, // together | choosing | engaged
    together: null, // срок отношений
    topics: [], // блоки, с которых хочет начать
    reminder: "week", // twice | week | off
    lang: "ru", // ru | en
  },
  answers: {}, // { [questionId]: { text, at } }
  connections: [], // до подключения Supabase живёт локально
  invites: [], // отправленные мной приглашения: принятые и ожидающие
  seen: 0, // отметка времени последнего просмотра ленты
  sync: "local", // local | connecting | online | error
  syncMsg: "", // текст ошибки сервера, если она была
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    const profile = { ...empty.profile, ...(parsed.profile || {}) };
    if (profile.reminder === "twoweeks") profile.reminder = "week"; // старый вариант убран
    return {
      ...empty,
      ...parsed,
      sync: "local", // состояние связи определяется заново при каждом запуске
      syncMsg: "",
      profile,
    };
  } catch {
    return empty;
  }
}

let state = load();
const listeners = new Set();

/** То, что стоит сохранять: состояние связи с сервером вычисляется заново. */
function persistable(s) {
  return { profile: s.profile, answers: s.answers, connections: s.connections, seen: s.seen };
}

let cloudTimer = null;
function saveToCloud() {
  if (!hasCloud()) return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => {
    cloudSet(CLOUD_KEY, JSON.stringify(persistable(state)));
  }, 1000);
}

function commit(next) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(persistable(state)));
  } catch {
    // приватный режим браузера — работаем без сохранения
  }
  saveToCloud();
  listeners.forEach((l) => l());
}

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore(selector = (x) => x) {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(empty)
  );
}

export const actions = {
  saveAnswer(questionId, text) {
    const t = text.trim();
    const answers = { ...state.answers };
    if (t) answers[questionId] = { text: t, at: Date.now() };
    else delete answers[questionId];
    commit({ ...state, answers });
    pushAnswer(questionId, t);
  },

  setProfile(patch) {
    commit({ ...state, profile: { ...state.profile, ...patch } });
    pushProfile(patch);
  },

  completeOnboarding(data) {
    commit({ ...state, profile: { ...state.profile, ...data, onboarded: true } });
    pushProfile(data);
  },

  /** Записать копию в облако, даже если состояние не менялось. */
  backupNow() {
    saveToCloud();
  },

  setSync(value, message = "") {
    if (state.sync === value && state.syncMsg === message) return;
    commit({ ...state, sync: value, syncMsg: message });
  },

  /**
   * Восстановление из облака Telegram. Локальные правки не теряются:
   * по каждому вопросу побеждает более свежий ответ.
   */
  applyBackup(saved) {
    if (!saved) return;
    const answers = { ...state.answers };
    for (const [id, v] of Object.entries(saved.answers || {})) {
      if (!answers[id] || (v.at || 0) > (answers[id].at || 0)) answers[id] = v;
    }
    const profile = state.profile.onboarded
      ? { ...saved.profile, ...state.profile }
      : { ...state.profile, ...saved.profile };

    commit({
      ...state,
      profile,
      answers,
      connections: state.connections.length ? state.connections : saved.connections || [],
      seen: Math.max(state.seen || 0, saved.seen || 0),
    });
  },

  /** Заменяет локальное состояние тем, что пришло с сервера. */
  applyRemote({ profile, answers, connections, invites }) {
    commit({
      ...state,
      profile: { ...state.profile, ...profile },
      answers,
      connections,
      invites: invites || [],
    });
  },

  toggleHiddenBlock(catId) {
    const h = state.profile.hiddenBlocks;
    const next = h.includes(catId) ? h.filter((x) => x !== catId) : [...h, catId];
    commit({ ...state, profile: { ...state.profile, hiddenBlocks: next } });
    pushProfile({ hiddenBlocks: next });
  },

  addConnection(conn) {
    const c = {
      id: conn.id || `c${Date.now()}`,
      name: conn.name,
      kind: conn.kind || "candidate", // partner | candidate
      createdAt: Date.now(),
      answers: conn.answers || {},
      reactions: {}, // { [questionId]: 'match' | 'talk' | 'differ' }
      ...conn,
    };
    commit({ ...state, connections: [...state.connections, c] });
    return c.id;
  },

  removeConnection(id) {
    commit({ ...state, connections: state.connections.filter((c) => c.id !== id) });
  },

  setReaction(connId, questionId, value) {
    const connections = state.connections.map((c) => {
      if (c.id !== connId) return c;
      const reactions = { ...c.reactions };
      if (reactions[questionId] === value) delete reactions[questionId];
      else reactions[questionId] = value;
      return { ...c, reactions };
    });
    commit({ ...state, connections });
    const cur = connections.find((c) => c.id === connId);
    pushReaction(connId, questionId, cur?.reactions?.[questionId] || null);
  },

  markFeedSeen() {
    commit({ ...state, seen: Date.now() });
  },

  reset() {
    commit(empty);
  },
};

// --- производные данные ---

/** Набор вопросов по id: это может быть блок основного курса или колода. */
export function questionsOf(setId) {
  const deck = findDeck(setId);
  if (deck) return deck.questions;
  return QUESTIONS.filter((q) => q.cat === setId);
}

/** Заголовок набора на нужном языке. */
export function setTitle(setId, lang = "ru") {
  const deck = findDeck(setId);
  if (deck) return deck[lang] || deck.ru;
  const cat = CATEGORIES.find((x) => x.id === setId);
  if (!cat) return "";
  return (cat[lang] || cat.ru).replace(/^(Блок|Block)\s*\d+\.\s*/, "");
}

/** Текст вопроса на нужном языке. */
export function qText(q, lang = "ru") {
  return (lang === "en" ? q.en : q.ru) || q.ru;
}

/** Все вопросы приложения — основной курс плюс колоды. */
export const ALL_QUESTIONS = [...QUESTIONS, ...DECK_QUESTIONS];

export function blockProgress(answers, catId) {
  const qs = questionsOf(catId);
  const done = qs.filter((q) => answers[q.id]).length;
  return { done, total: qs.length, pct: qs.length ? (done / qs.length) * 100 : 0 };
}

export function totalProgress(answers) {
  const done = QUESTIONS.filter((q) => answers[q.id]).length;
  return { done, total: QUESTIONS.length, pct: (done / QUESTIONS.length) * 100 };
}

/** Вопросы, открытые для сравнения: оба ответили и блок не скрыт. */
export function revealed(myAnswers, conn, hiddenBlocks = []) {
  return QUESTIONS.filter(
    (q) => myAnswers[q.id] && conn.answers[q.id] && !hiddenBlocks.includes(q.cat)
  );
}

/** Сколько вопросов ждут ответа партнёра, и сколько — моего. */
export function pending(myAnswers, conn) {
  let waitingThem = 0;
  let waitingMe = 0;
  for (const q of QUESTIONS) {
    const mine = !!myAnswers[q.id];
    const theirs = !!conn.answers[q.id];
    if (mine && !theirs) waitingThem++;
    if (!mine && theirs) waitingMe++;
  }
  return { waitingThem, waitingMe };
}

/**
 * Совпадения считаются по оценкам, которые пользователь ставит открытым парам
 * ответов. Автоматически сравнивать свободный текст нельзя — это работа ИИ,
 * она появится в отдельном блоке.
 */
export function matchStats(conn) {
  const vals = Object.values(conn.reactions || {});
  const rated = vals.length;
  const match = vals.filter((v) => v === "match").length;
  const talk = vals.filter((v) => v === "talk").length;
  const differ = vals.filter((v) => v === "differ").length;
  return { rated, match, talk, differ, pct: rated ? (match / rated) * 100 : null };
}

export function connBlockProgress(myAnswers, conn, catId) {
  const qs = questionsOf(catId);
  const mine = qs.filter((q) => myAnswers[q.id]).length;
  const theirs = qs.filter((q) => conn.answers[q.id]).length;
  return {
    total: qs.length,
    mine,
    theirs,
    minePct: qs.length ? (mine / qs.length) * 100 : 0,
    theirsPct: qs.length ? (theirs / qs.length) * 100 : 0,
  };
}

export { CATEGORIES, QUESTIONS, DECKS };
