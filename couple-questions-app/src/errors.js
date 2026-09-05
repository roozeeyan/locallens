// Журнал сбоев.
//
// До него о поломках узнавали так: человек натыкался на них руками и
// рассказывал. Groq выключил модель в июне — заметили в конце августа.
// Теперь приложение само рассказывает о сбоях, и смотреть можно в базу.
//
// Что сюда НЕ попадает: ответы на вопросы, имена, содержимое переписки.
// Только место в коде, текст ошибки и версия сборки — то, по чему можно
// понять, что сломалось, но нельзя узнать, у кого.
import { isRemote, supabase } from "./backend.js";

const SENT = new Set();
let count = 0;

/**
 * Записывает сбой. Одинаковые сообщения шлём один раз за сеанс, и не
 * больше двадцати всего: сломанный цикл иначе завалит таблицу за минуту.
 */
export async function reportError(place, err, detail = "") {
  const message = String(err?.message || err || "").slice(0, 500);
  const key = `${place}:${message}`;
  if (!message || SENT.has(key) || count >= 20) return;
  SENT.add(key);
  count += 1;

  // В консоль пишем всегда: она помогает, когда сервер как раз и лежит.
  console.error(`[${place}]`, err);
  if (!isRemote) return;

  try {
    await supabase.from("app_errors").insert({
      place: String(place).slice(0, 100),
      message,
      detail: String(detail || err?.stack || "").slice(0, 2000),
      version: typeof __BUILD_TIME__ === "string" ? __BUILD_TIME__ : "",
      agent: navigator.userAgent.slice(0, 300),
    });
  } catch {
    // Сообщить о сбое не вышло — это не повод падать ещё раз.
  }
}

/** Ловит то, что не поймали на месте: битый код и оборванные обещания. */
export function watchErrors() {
  window.addEventListener("error", (e) => {
    reportError("window", e.error || e.message, `${e.filename}:${e.lineno}`);
  });
  window.addEventListener("unhandledrejection", (e) => {
    reportError("promise", e.reason);
  });
}
