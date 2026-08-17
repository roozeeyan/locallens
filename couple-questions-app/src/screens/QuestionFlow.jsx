import React, { useEffect, useMemo, useState } from "react";
import { c, font } from "../theme.js";
import { Button, Field, Progress, Label } from "../ui.jsx";
import { useStore, actions, CATEGORIES, questionsOf } from "../store.js";

export default function QuestionFlow({ catId, onClose }) {
  const answers = useStore((s) => s.answers);
  const cat = CATEGORIES.find((x) => x.id === catId);
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
        <button onClick={() => { if (dirty) actions.saveAnswer(q.id, draft); onClose(); }} style={back} aria-label="Назад">
          ←
        </button>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <Label>{cat.ru.replace(/^Блок \d+\.\s*/, "")}</Label>
          <Progress value={(doneCount / list.length) * 100} height={7} />
        </div>
        <span style={{ font: `600 12px ${font.mono}`, color: c.mute }}>
          {i + 1}/{list.length}
        </span>
      </div>

      <div style={body}>
        <p style={question}>{q.ru}</p>

        <Field
          value={draft}
          onChange={setDraft}
          placeholder="Ваш ответ — его увидит партнёр, когда ответит сам"
          rows={6}
        />

        {saved && !dirty && (
          <span style={{ font: `600 12px ${font.mono}`, color: c.mute }}>Ответ сохранён</span>
        )}
      </div>

      <div style={footer}>
        <div style={{ display: "flex", gap: 9 }}>
          <Button variant="secondary" onClick={() => go(-1)} disabled={i === 0} style={{ flex: 1 }}>
            Назад
          </Button>
          <Button variant="secondary" onClick={() => go(1)} style={{ flex: 1 }}>
            Пропустить
          </Button>
        </div>
        <Button full onClick={save} disabled={!draft.trim()}>
          {i + 1 === list.length ? "Сохранить и закрыть" : "Сохранить и дальше"}
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
