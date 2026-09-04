import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { watchViewport } from "./viewport.js";

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  // Без этого мини-приложение можно утянуть вниз пальцем, и оно уезжает
  // вместе с клавиатурой, когда человек начинает печатать ответ.
  tg.disableVerticalSwipes?.();
}

watchViewport();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
