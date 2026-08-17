import React, { useState } from "react";
import { c, font } from "./theme.js";
import { TabBar } from "./ui.jsx";
import Questionnaire from "./screens/Questionnaire.jsx";
import QuestionFlow from "./screens/QuestionFlow.jsx";
import Placeholder from "./screens/Placeholder.jsx";

const TABS = [
  { id: "form", label: "Анкета" },
  { id: "links", label: "Связи" },
  { id: "feed", label: "Лента", round: true },
  { id: "me", label: "Профиль", round: true },
];

export default function App() {
  const [tab, setTab] = useState("form");
  const [openBlock, setOpenBlock] = useState(null);

  return (
    <div style={shell}>
      <main style={main}>
        {tab === "form" && <Questionnaire onOpenBlock={setOpenBlock} />}

        {tab === "links" && (
          <Placeholder
            title="Связи"
            subtitle="Люди, с которыми вы проходите анкету."
            items={[
              "Приглашение по ссылке — партнёр или кандидат",
              "Процент заполнения по каждому блоку у обоих",
              "Совпадения открываются только по взаимности",
              "ИИ-заключение по завершённым блокам",
            ]}
          />
        )}

        {tab === "feed" && (
          <Placeholder
            title="Лента"
            subtitle="Что открылось с последнего захода."
            items={[
              "Новые совпадения после ответов партнёра",
              "Реакции на ваши ответы",
              "Напоминание о незаполненных блоках",
            ]}
          />
        )}

        {tab === "me" && (
          <Placeholder
            title="Профиль"
            subtitle="Настройки и доступ."
            items={[
              "Статус: в отношениях или свободен",
              "Приватность: какие блоки скрыть",
              "Темы оформления",
              "Premium и покупки",
            ]}
          />
        )}
      </main>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {openBlock && <QuestionFlow catId={openBlock} onClose={() => setOpenBlock(null)} />}
    </div>
  );
}

const shell = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  background: c.bg,
  color: c.ink,
  fontFamily: font.sans,
};
const main = { flex: 1, maxWidth: 560, width: "100%", margin: "0 auto" };
