import React, { useEffect, useMemo, useState } from "react";
import { c, font } from "../theme.js";
import { screenHeight, screenTop, lockScroll } from "../viewport.js";
import { Button, Field, Progress } from "../ui.jsx";
import { useStore, actions, questionsOf, setTitle, qText } from "../store.js";
import { shareQuestion } from "../share.js";

// Перемещение между вопросами и ответ на вопрос — разные функции, и
// выглядеть они должны по-разному. Наверху — только навигация: закрыть,
// счётчик со списком, шкала, стрелки. Внизу — одно действие: ответить.
// Всё остальное убрано в тихие ссылки, чтобы заметной кнопка была одна.

const T = {
  ru: {
    close: "Закрыть",
    prev: "Предыдущий вопрос",
    nextQ: "Следующий вопрос",
    skip: "Отложить и вернуться позже",
    saved: "Ответ сохранён",
    share: "Поделиться вопросом",
    next: "Сохранить и дальше",
    last: "Сохранить и закрыть",
    listTitle: "Вопросы темы",
    allQuestions: "Все вопросы",
    answered: "отвечен",
    skipped: "отложен",
    empty: "без ответа",
    placeholder: "Ваш ответ — его увидит партнёр, когда ответит сам",
  },
  en: {
    close: "Close",
    prev: "Previous question",
    nextQ: "Next question",
    skip: "Put aside for later",
    saved: "Answer saved",
    share: "Share this question",
    next: "Save and continue",
    last: "Save and close",
    listTitle: "Questions in this block",
    allQuestions: "All questions",
    answered: "answered",
    skipped: "for later",
    empty: "no answer",
    placeholder: "Your answer — your partner sees it once they answer too",
  },
};

export default function QuestionFlow({ catId, onClose }) {
  useEffect(lockScroll, []);

  const answers = useStore((s) => s.answers);
  const theme = useStore((s) => s.profile.theme);
  const lang = useStore((s) => s.profile.lang) || "ru";
  const t = T[lang] || T.ru;
  const list = useMemo(() => questionsOf(catId), [catId]);

  const firstUnanswered = list.findIndex((q) => !answers[q.id]);
  const [i, setI] = useState(firstUnanswered === -1 ? 0 : firstUnanswered);
  const [draft, setDraft] = useState("");
  const [showList, setShowList] = useState(false);
  // Отметка живёт в профиле, а не в этом экране: закрыл приложение —
  // отложенный вопрос должен остаться отложенным.
  const later = useStore((s) => s.profile.later) || [];

  const q = list[i];

  useEffect(() => {
    setDraft(answers[q.id]?.text || "");
  }, [q.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saved = answers[q.id]?.text || "";
  const dirty = draft.trim() !== saved;
  const doneCount = list.filter((x) => answers[x.id]).length;
  const last = i + 1 === list.length;

  const keep = () => {
    if (dirty && draft.trim()) actions.saveAnswer(q.id, draft);
  };

  const jump = (n) => {
    keep();
    setI(Math.min(Math.max(n, 0), list.length - 1));
    setShowList(false);
  };

  const save = () => {
    actions.saveAnswer(q.id, draft);
    if (last) onClose();
    else setI(i + 1);
  };

  const skip = () => {
    keep();
    actions.markLater(q.id);
    if (last) onClose();
    else setI(i + 1);
  };

  const stateOf = (item) =>
    answers[item.id] ? "answered" : later.includes(item.id) ? "skipped" : "empty";

  return (
    <div style={wrap}>
      {/* ------------------------------------------------ навигация */}
      <div style={top}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => {
              keep();
              onClose();
            }}
            style={round}
            aria-label={t.close}
          >
            ←
          </button>

          <span style={{ ...blockName, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {setTitle(catId, lang)}
          </span>

          {/* Кнопка списка подписана словами: без подписи её не находят,
              а именно она — единственный путь к пропущенному вопросу. */}
          <button onClick={() => setShowList(true)} style={listBtn}>
            <ListIcon />
            {t.allQuestions}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => jump(i - 1)}
            style={i === 0 ? { ...arrow, ...arrowOff } : arrow}
            disabled={i === 0}
            aria-label={t.prev}
          >
            ‹
          </button>
          {/* Шкала только показывает путь. Попасть по ней в нужный вопрос
              всё равно нельзя — точность в один пиксель на вопрос. */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Progress value={(doneCount / list.length) * 100} height={8} />
          </div>
          <button
            onClick={() => jump(i + 1)}
            style={last ? { ...arrow, ...arrowOff } : arrow}
            disabled={last}
            aria-label={t.nextQ}
          >
            ›
          </button>
          <span style={{ font: `600 12.5px ${font.mono}`, color: c.mute, flexShrink: 0 }}>
            {i + 1}/{list.length}
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------- ответ */}
      <div style={body}>
        <p style={question}>{qText(q, lang)}</p>

        <Field value={draft} onChange={setDraft} placeholder={t.placeholder} grow />

        {saved && !dirty && <span style={savedPill}>{t.saved}</span>}

        <button
          onClick={() => shareQuestion(qText(q, lang), theme, lang)}
          style={quietLink}
        >
          {t.share}
        </button>
      </div>

      {/* Заметная кнопка одна. Пропуск — тоже действие, но не главное,
          поэтому выполнен ссылкой: найти можно, в глаза не бросается. */}
      <div style={footer}>
        <Button full onClick={save} disabled={!draft.trim()}>
          {last ? t.last : t.next}
        </Button>
        <button onClick={skip} style={{ ...quietLink, alignSelf: "center" }}>
          {t.skip}
        </button>
      </div>

      {showList && (
        <QuestionList
          list={list}
          lang={lang}
          at={i}
          t={t}
          stateOf={stateOf}
          onPick={jump}
          onClose={() => setShowList(false)}
        />
      )}
    </div>
  );
}

function ListIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 4h12M2 8h12M2 12h8"
        stroke={c.ink}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Список вопросов блока — единственный способ вернуться к пропущенному. */
function QuestionList({ list, lang, at, t, stateOf, onPick, onClose }) {
  return (
    <div style={sheetWrap} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={sheetTop}>
          <span style={blockName}>{t.listTitle}</span>
          <button onClick={onClose} style={round} aria-label={t.close}>
            ✕
          </button>
        </div>
        <div style={sheetBody}>
          {list.map((item, n) => {
            const state = stateOf(item);
            return (
              <button key={item.id} onClick={() => onPick(n)} style={row(n === at)}>
                <span style={dot(state)} />
                <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  {qText(item, lang)}
                </span>
                <span style={{ font: `500 11px ${font.mono}`, color: c.mute, flexShrink: 0 }}>
                  {t[state]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const wrap = {
  position: "fixed",
  top: screenTop,
  left: 0,
  right: 0,
  height: screenHeight,
  background: c.veil,
  backdropFilter: "blur(2px)",
  WebkitBackdropFilter: "blur(2px)",
  display: "flex",
  flexDirection: "column",
  zIndex: 30,
};
const top = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: "16px 16px 10px",
  background: c.veil,
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  flexShrink: 0,
  zIndex: 1,
};
const blockName = {
  font: `600 12.5px/1.35 ${font.sans}`,
  letterSpacing: "0.02em",
  textTransform: "uppercase",
  color: c.mute,
  minWidth: 0,
};
const round = {
  width: 36,
  height: 36,
  flexShrink: 0,
  background: c.paper,
  border: `1.5px solid ${c.ink}`,
  borderRadius: "50%",
  boxShadow: `0 2px 0 ${c.ink}`,
  font: "18px/1 sans-serif",
  color: c.ink,
  cursor: "pointer",
};
// Стрелки — тоже кнопки, и выглядеть должны кнопками: без рамки их
// принимают за украшение и не нажимают.
const arrow = {
  width: 30,
  height: 30,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: c.paper,
  border: `1.5px solid ${c.ink}`,
  borderRadius: "50%",
  font: `600 17px/1 ${font.sans}`,
  color: c.ink,
  cursor: "pointer",
  padding: 0,
};
const listBtn = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: c.paper,
  border: `1.5px solid ${c.ink}`,
  borderRadius: 999,
  boxShadow: `0 2px 0 ${c.ink}`,
  padding: "7px 13px",
  font: `700 12.5px ${font.sans}`,
  color: c.ink,
  cursor: "pointer",
};
const arrowOff = { background: c.bg, border: `1.5px solid ${c.mute}`, color: c.mute, cursor: "default" };
const savedPill = {
  alignSelf: "flex-start",
  background: c.sage,
  border: `1.5px solid ${c.ink}`,
  borderRadius: 999,
  padding: "5px 12px",
  font: `700 12px ${font.sans}`,
  color: c.ink,
  flexShrink: 0,
};
const quietLink = {
  alignSelf: "flex-start",
  background: "transparent",
  border: "none",
  padding: 0,
  font: `500 13.5px ${font.sans}`,
  color: c.mute,
  textDecoration: "underline",
  textUnderlineOffset: 3,
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
  font: `600 27px/1.22 ${font.serif}`,
  letterSpacing: "-0.01em",
  color: c.ink,
  margin: "10px 0 0",
};
const footer = {
  padding: "12px 16px calc(16px + env(safe-area-inset-bottom))",
  display: "flex",
  flexDirection: "column",
  gap: 10,
  background: c.veil,
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};
const sheetWrap = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.28)",
  display: "flex",
  alignItems: "flex-end",
  zIndex: 2,
};
const sheet = {
  width: "100%",
  maxHeight: "78%",
  display: "flex",
  flexDirection: "column",
  background: c.paper,
  border: `1.5px solid ${c.ink}`,
  borderRadius: "32px 32px 0 0",
};
const sheetTop = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "16px 16px 8px",
};
const sheetBody = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  padding: "0 12px calc(16px + env(safe-area-inset-bottom))",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};
const row = (here) => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  background: here ? c.bg : "transparent",
  border: "none",
  borderRadius: 18,
  padding: "10px 10px",
  font: `500 14px/1.35 ${font.sans}`,
  color: c.ink,
  cursor: "pointer",
});
const dot = (state) => ({
  width: 9,
  height: 9,
  flexShrink: 0,
  borderRadius: "50%",
  border: `1.5px solid ${c.ink}`,
  background: state === "answered" ? c.sage : state === "skipped" ? c.coral : "transparent",
});
