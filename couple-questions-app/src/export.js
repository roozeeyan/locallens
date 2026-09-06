// Выгрузка своих ответов.
//
// Право забрать свои данные должно работать без обращения к владельцу
// сервиса. Файл собирается прямо на телефоне — на сервер ничего не уходит.
//
// Внутри Telegram скачивание файла заблокировано, поэтому текст ещё и
// копируется в буфер обмена: это работает везде.

import { CATEGORIES, QUESTIONS } from "./data.js";
import { DECKS } from "./decks.js";
import { FRIEND_DECK } from "./friends.js";

function setsFor(lang) {
  const main = CATEGORIES.map((cat) => ({
    title: (cat[lang] || cat.ru).replace(/^(Блок|Block)\s*\d+\.\s*/, ""),
    questions: QUESTIONS.filter((q) => q.cat === cat.id),
  }));
  const extra = [...DECKS, FRIEND_DECK].map((d) => ({
    title: d[lang] || d.ru,
    questions: d.questions,
  }));
  return [...main, ...extra];
}

/** Собирает ответы в читаемый текст. Пустые вопросы пропускаются. */
export function answersToText(answers, profile) {
  const lang = profile.lang === "en" ? "en" : "ru";
  const w =
    lang === "en"
      ? { title: "My answers", who: "Name", when: "Exported", none: "No answers yet." }
      : { title: "Мои ответы", who: "Имя", when: "Выгружено", none: "Ответов пока нет." };

  const lines = [
    w.title,
    `${w.who}: ${profile.name || "—"}`,
    `${w.when}: ${new Date().toLocaleString(lang === "en" ? "en-GB" : "ru-RU")}`,
    "",
  ];

  let count = 0;
  for (const set of setsFor(lang)) {
    const filled = set.questions.filter((q) => answers[q.id]?.text);
    if (!filled.length) continue;

    lines.push(`— ${set.title} —`, "");
    for (const q of filled) {
      lines.push((lang === "en" ? q.en : q.ru) || q.ru);
      lines.push(answers[q.id].text);
      lines.push("");
      count++;
    }
  }

  if (!count) lines.push(w.none);
  return lines.join("\n");
}

/**
 * Ответы пары рядом. Попадают только те вопросы, которые уже открыты обоим:
 * оба ответили и блок не скрыт. Собирается только при согласии обоих —
 * проверку делает вызывающий экран.
 */
export function pairToText(answers, conn, profile) {
  const lang = profile.lang === "en" ? "en" : "ru";
  const hidden = profile.hiddenBlocks || [];
  const w =
    lang === "en"
      ? { title: "Our answers", with: "With", when: "Exported", you: "You", none: "Nothing is open yet." }
      : { title: "Наши ответы", with: "С кем", when: "Выгружено", you: "Вы", none: "Открытых ответов пока нет." };

  const lines = [
    w.title,
    `${w.with}: ${conn.name}`,
    `${w.when}: ${new Date().toLocaleString(lang === "en" ? "en-GB" : "ru-RU")}`,
    "",
  ];

  let count = 0;
  for (const set of setsFor(lang)) {
    const open = set.questions.filter(
      (q) => answers[q.id]?.text && conn.answers?.[q.id]?.text && !hidden.includes(q.cat)
    );
    if (!open.length) continue;

    lines.push(`— ${set.title} —`, "");
    for (const q of open) {
      lines.push((lang === "en" ? q.en : q.ru) || q.ru);
      lines.push(`${w.you}: ${answers[q.id].text}`);
      lines.push(`${conn.name}: ${conn.answers[q.id].text}`);
      lines.push("");
      count++;
    }
  }

  if (!count) lines.push(w.none);
  return lines.join("\n");
}

/**
 * Отдаёт текст человеку: буфер обмена, а файл — только если буфер не дался.
 *
 * Раньше делали и то и другое сразу. Внутри Telegram скачивание не падает
 * молча, как мы рассчитывали: оно превращается в предложение открыть
 * blob-ссылку, а дальше — в поиск приложения в App Store. Человек видел
 * «ответы скопированы», жал ОК и попадал в три чужих окна подряд.
 *
 * Скопировано — значит, дело сделано, и больше ничего происходить не
 * должно. Файл остаётся запасным путём там, где буфер недоступен.
 */
export async function handOver(text, filename = "my-answers.txt") {
  try {
    await navigator.clipboard.writeText(text);
    return { copied: true, saved: false, text };
  } catch {
    // буфер недоступен — остаётся файл
  }

  try {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { copied: false, saved: true, text };
  } catch {
    return { copied: false, saved: false, text };
  }
}

/** Выгрузка своих ответов. */
export async function exportAnswers(answers, profile) {
  return handOver(answersToText(answers, profile), "my-answers.txt");
}

/** Выгрузка ответов пары. Вызывается только при согласии обоих. */
export async function exportPair(answers, conn, profile) {
  return handOver(pairToText(answers, conn, profile), "our-answers.txt");
}
