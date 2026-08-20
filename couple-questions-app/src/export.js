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
 * Отдаёт текст пользователю: копирует в буфер и, где это разрешено,
 * дополнительно сохраняет файлом.
 */
export async function exportAnswers(answers, profile) {
  const text = answersToText(answers, profile);

  let copied = false;
  try {
    await navigator.clipboard.writeText(text);
    copied = true;
  } catch {
    // буфер недоступен — остаётся файл
  }

  let saved = false;
  try {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-answers.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    saved = true;
  } catch {
    // внутри Telegram скачивание блокируется — это ожидаемо
  }

  return { copied, saved, text };
}
