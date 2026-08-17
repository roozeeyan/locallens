import { useSyncExternalStore } from "react";
import { CATEGORIES, QUESTIONS } from "./data.js";
import { DEFAULT_PALETTE } from "./theme.js";

const KEY = "rg_state_v2";

const empty = {
  profile: {
    name: "",
    status: "taken", // taken | free
    theme: DEFAULT_PALETTE,
    hiddenBlocks: [], // id блоков, скрытых от всех связей
    premium: false,
  },
  answers: {}, // { [questionId]: { text, at } }
  connections: [], // до подключения Supabase живёт локально
  seen: 0, // отметка времени последнего просмотра ленты
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return { ...empty, ...parsed, profile: { ...empty.profile, ...(parsed.profile || {}) } };
  } catch {
    return empty;
  }
}

let state = load();
const listeners = new Set();

function commit(next) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // приватный режим браузера — работаем без сохранения
  }
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
  },

  setProfile(patch) {
    commit({ ...state, profile: { ...state.profile, ...patch } });
  },

  toggleHiddenBlock(catId) {
    const h = state.profile.hiddenBlocks;
    const next = h.includes(catId) ? h.filter((x) => x !== catId) : [...h, catId];
    commit({ ...state, profile: { ...state.profile, hiddenBlocks: next } });
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
  },

  markFeedSeen() {
    commit({ ...state, seen: Date.now() });
  },

  reset() {
    commit(empty);
  },
};

// --- производные данные ---

export function questionsOf(catId) {
  return QUESTIONS.filter((q) => q.cat === catId);
}

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

export { CATEGORIES, QUESTIONS };
