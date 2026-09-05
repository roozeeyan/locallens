import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { watchViewport } from "./viewport.js";
import { watchErrors } from "./errors.js";
import { track, STEP } from "./track.js";

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  // Без этого мини-приложение можно утянуть вниз пальцем, и оно уезжает
  // вместе с клавиатурой, когда человек начинает печатать ответ.
  tg.disableVerticalSwipes?.();
}

watchViewport();
watchErrors();

// Первый шаг воронки. Отдельно помечаем приход по ссылке-приглашению:
// это совсем другой человек и совсем другой путь.
track(location.search.includes("tgWebAppStartParam") || location.hash.includes("start")
  ? STEP.invitedOpen
  : STEP.open);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
