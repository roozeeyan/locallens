import React, { useEffect, useMemo, useState } from "react";
import { c, font } from "../theme.js";
import { Button, Field, Progress, Label } from "../ui.jsx";
import { useStore, actions, questionsOf, setTitle, qText } from "../store.js";
import { shareQuestion } from "../share.js";

const T = {
  ru: { back: "Назад", skip: "Пропустить", saved: "Ответ сохранён",
        next: "Сохранить и дальше", last: "Сохранить и закрыть" },
  en: { back: "Back", skip: "Skip", saved: "Answer saved",
        next: "Save and continue", last: "Save and close" },
};

export default function QuestionFlow({ catId, onClose }) {
  const answers = useStore((s) => s.answers);
  const theme = useStore((s) => s.profile.theme);
  const lang = useStore((s) => s.profile.lang) || "ru";
  const t = T[lang] || T.ru;
  const list = useMemo(() => questionsOf(catId), [catId]);

  const firstUnanswered = list.findIndex((q) => !answers[q.id]);
  const [i, setI] = useState(firstUnanswered === -1 ? 0 : firstUnanswered);
  const q = list[i];
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setDraft(answers[q.id]?.text || "");
  }, [q.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saved = answers[q.id]?.text || "";
  const dirty = draft.trim() !== saved;
  const doneCount = list.filter((x) => answers[x.id]).length;

  const go = (d) => {
    if (dirty) actions.saveAnswer(q.id, draft);
    const n = i + d;
    if (n < 0) return;
    if (n >= list.length) return onClose();
    setI(n);
  };

  const save = () => {
    actions.saveAnswer(q.id, draft);
    if (i + 1 < list.length) setI(i + 1);
    else onClose();
  };

  return (
    <div style={wrap}>
      <div style={top}>
        <button onClick={() => { if (dirty) actions.saveAnswer(q.id, draft); onClose(); }} style={back} aria-label={t.back}>
          ←
        </button>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <Label>{setTitle(catId, lang)}</Label>
          <Progress value={(doneCount / list.length) * 100} height={7} />
        </div>
        <span style={{ font: `600 12px ${font.mono}`, color: c.mute }}>
          {i + 1}/{list.length}
        </span>
        <button
          onClick={() => shareQuestion(qText(q, lang), theme, lang)}
          style={share}
          aria-label="Поделиться вопросом"
          title="Поделиться вопросом"
        >
          ↑
        </button>
      </div>

      <div style={body}>
        <p style={question}>{qText(q, lang)}</p>

        <Field
          value={draft}
          onChange={setDraft}
          placeholder={lang === "en" ? "Your answer — your partner sees it once they answer too" : "Ваш ответ — его увидит партнёр, когда ответит сам"}
          rows={6}
        />

        {saved && !dirty && (
          <span style={{ font: `600 12px ${font.mono}`, color: c.mute }}>{t.saved}</span>
        )}
      </div>

      <div style={footer}>
        <div style={{ display: "flex", gap: 9 }}>
          <Button variant="secondary" onClick={() => go(-1)} disabled={i === 0} style={{ flex: 1 }}>
            {t.back}
          </Button>
          <Button variant="secondary" onClick={() => go(1)} style={{ flex: 1 }}>
            {t.skip}
          </Button>
        </div>
        <Button full onClick={save} disabled={!draft.trim()}>
          {i + 1 === list.length ? t.last : t.next}
        </Button>
      </div>
    </div>
  );
}

const wrap = {
  position: "fixed",
  inset: 0,
  background: c.bg,
  display: "flex",
  flexDirection: "column",
  zIndex: 20,
};
const top = { display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 10px" };
const share = {
  width: 34,
  height: 34,
  flexShrink: 0,
  background: c.paper,
  border: `2px solid ${c.ink}`,
  borderRadius: "50%",
  boxShadow: `0 2px 0 ${c.ink}`,
  font: "16px/1 sans-serif",
  color: c.ink,
  cursor: "pointer",
};
const back = {
  width: 36,
  height: 36,
  flexShrink: 0,
  background: c.paper,
  border: `2px solid ${c.ink}`,
  borderRadius: "50%",
  boxShadow: `0 2px 0 ${c.ink}`,
  font: "18px/1 sans-serif",
  color: c.ink,
  cursor: "pointer",
};
const body = {
  flex: 1,
  padding: "10px 16px",
  display: "flex",
  flexDirection: "column",
  gap: 16,
  overflowY: "auto",
};
const question = {
  font: `600 25px/1.2 ${font.serif}`,
  letterSpacing: "-0.01em",
  color: c.ink,
  margin: "10px 0 0",
};
const footer = {
  padding: "12px 16px calc(16px + env(safe-area-inset-bottom))",
  display: "flex",
  flexDirection: "column",
  gap: 9,
  background: c.bg,
};
