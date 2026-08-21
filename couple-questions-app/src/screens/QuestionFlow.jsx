import React, { useEffect, useMemo, useState } from "react";
import { c, font } from "../theme.js";
import { screenHeight } from "../viewport.js";
import { Button, Field, Progress } from "../ui.jsx";
import { useStore, actions, questionsOf, setTitle, qText } from "../store.js";
import { shareQuestion } from "../share.js";

const T = {
  ru: { back: "Назад", skip: "Пропустить", saved: "Ответ сохранён", share: "Поделиться вопросом",
        next: "Сохранить и дальше", last: "Сохранить и закрыть" },
  en: { back: "Back", skip: "Skip", saved: "Answer saved", share: "Share this question",
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => { if (dirty) actions.saveAnswer(q.id, draft); onClose(); }} style={back} aria-label={t.back}>
            ←
          </button>
          <span style={{ ...blockName, flex: 1 }}>{setTitle(catId, lang)}</span>
          <span style={{ font: `600 12px ${font.mono}`, color: c.mute, flexShrink: 0 }}>
            {i + 1}/{list.length}
          </span>
          <button
            onClick={() => shareQuestion(qText(q, lang), theme, lang)}
            style={share}
            aria-label={t.share}
            title={t.share}
          >
            <ShareIcon />
          </button>
        </div>
        <Progress value={(doneCount / list.length) * 100} height={8} />
      </div>

      <div style={body}>
        <p style={question}>{qText(q, lang)}</p>

        <Field
          value={draft}
          onChange={setDraft}
          placeholder={lang === "en" ? "Your answer — your partner sees it once they answer too" : "Ваш ответ — его увидит партнёр, когда ответит сам"}
          grow
        />

        {saved && !dirty && <span style={savedPill}>{t.saved}</span>}
      </div>

      <div style={footer}>
        <div style={{ display: "flex", gap: 9 }}>
          {i > 0 && (
            <Button variant="secondary" onClick={() => go(-1)} style={{ flex: 1 }}>
              {t.back}
            </Button>
          )}
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

function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 10.5V2M8 2 5 5M8 2l3 3M3 9v4.5h10V9"
        stroke={c.ink}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const wrap = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: screenHeight,
  background: c.bg,
  display: "flex",
  flexDirection: "column",
  zIndex: 20,
};
const top = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: "16px 16px 10px",
};
const blockName = {
  font: `600 10.5px/1.35 ${font.mono}`,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: c.mute,
  minWidth: 0,
};
const savedPill = {
  alignSelf: "flex-start",
  background: c.sage,
  border: `2px solid ${c.ink}`,
  borderRadius: 999,
  padding: "5px 12px",
  font: `700 12px ${font.sans}`,
  color: c.ink,
  flexShrink: 0,
};
const share = {
  width: 34,
  height: 34,
  flexShrink: 0,
  background: c.paper,
  border: `2px solid ${c.ink}`,
  borderRadius: "50%",
  boxShadow: `0 2px 0 ${c.ink}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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
  minHeight: 0,
  padding: "10px 16px",
  display: "flex",
  flexDirection: "column",
  gap: 14,
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
