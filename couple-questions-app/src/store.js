import { useSyncExternalStore } from "react";
import { CATEGORIES, QUESTIONS } from "./data.js";

const KEY = "rg_state_v1";

const empty = {
  profile: { name: "", status: "taken" }, // taken | free
  answers: {}, // { [questionId]: { text, at } }
  connections: [], // позже придёт из Supabase
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

let state = load();
const listeners = new Set();

function emit() {
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
    state = { ...state, answers };
    emit();
  },
  setProfile(patch) {
    state = { ...state, profile: { ...state.profile, ...patch } };
    emit();
  },
  reset() {
    state = empty;
    emit();
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

export function nextUnanswered(answers, catId) {
  const qs = catId ? questionsOf(catId) : QUESTIONS;
  return qs.find((q) => !answers[q.id]) || null;
}

export { CATEGORIES, QUESTIONS };
