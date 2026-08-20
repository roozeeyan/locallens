import React, { useState } from "react";
import { c, font } from "../theme.js";
import { Card, Button, Progress, Label } from "../ui.jsx";
import { dropConnection } from "../sync.js";
import {
  useStore,
  actions,
  CATEGORIES,
  revealed,
  pending,
  matchStats,
  connBlockProgress,
  setTitle,
  qText,
} from "../store.js";

const REACTIONS = [
  { id: "match", label: "Совпадаем" },
  { id: "talk", label: "Обсудить" },
  { id: "differ", label: "Расходимся" },
];

export default function ConnectionDetail({ connId, onClose }) {
  const { answers, connections, profile } = useStore();
  const hiddenBlocks = profile.hiddenBlocks;
  const lang = profile.lang;
  const conn = connections.find((x) => x.id === connId);
  const [tab, setTab] = useState("open");

  if (!conn) return null;

  const open = revealed(answers, conn, hiddenBlocks);
  const p = pending(answers, conn);
  const m = matchStats(conn);

  return (
    <div style={wrap}>
      <div style={top}>
        <button onClick={onClose} style={back} aria-label="Назад">
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: `700 19px ${font.serif}`, color: c.ink }}>{conn.name}</div>
          <div style={{ font: `400 12px ${font.sans}`, color: c.mute }}>
            {conn.kind === "partner" ? "партнёр" : "кандидат"} · открыто {open.length}
          </div>
        </div>
      </div>

      <div style={body}>
        {m.rated > 0 && (
          <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Label>Ваши отметки</Label>
            <div style={{ display: "flex", gap: 8 }}>
              <Stat n={m.match} label="совпадаем" bg={c.sage} />
              <Stat n={m.talk} label="обсудить" bg={c.paper} />
              <Stat n={m.differ} label="расходимся" bg={c.coral} />
            </div>
          </Card>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <Seg active={tab === "open"} onClick={() => setTab("open")}>
            Сравнения ({open.length})
          </Seg>
          <Seg active={tab === "blocks"} onClick={() => setTab("blocks")}>
            По блокам
          </Seg>
        </div>

        {tab === "open" && (
          <>
            {open.length === 0 && (
              <Card pad={16} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <Label>Пока нечего сравнивать</Label>
                <p style={{ margin: 0, font: `400 14px/1.5 ${font.sans}`, color: c.ink }}>
                  Ответ открывается, когда вы оба ответили на один и тот же вопрос.
                  {p.waitingMe > 0 && ` ${conn.name} уже ответил на ${p.waitingMe} — очередь за вами.`}
                </p>
              </Card>
            )}

            {open.map((q) => (
              <Card key={q.id} pad={14} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                <p style={{ margin: 0, font: `600 17px/1.25 ${font.serif}`, color: c.ink }}>{qText(q, lang)}</p>

                <Answer who="Вы" text={answers[q.id].text} accent={c.sage} />
                <Answer who={conn.name} text={conn.answers[q.id].text} accent={c.coral} />

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {REACTIONS.map((rx) => {
                    const on = conn.reactions?.[q.id] === rx.id;
                    return (
                      <button
                        key={rx.id}
                        onClick={() => actions.setReaction(conn.id, q.id, rx.id)}
                        style={{
                          ...reactBtn,
                          background: on ? c.sage : c.bg,
                        }}
                        aria-pressed={on}
                      >
                        {rx.label}
                      </button>
                    );
                  })}
                </div>
              </Card>
            ))}
          </>
        )}

        {tab === "blocks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {CATEGORIES.map((cat) => {
              const bp = connBlockProgress(answers, conn, cat.id);
              const hidden = hiddenBlocks.includes(cat.id);
              return (
                <Card key={cat.id} pad={13} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ font: `700 14px ${font.sans}`, color: c.ink }}>
                      {setTitle(cat.id, lang)}
                    </span>
                    {hidden && (
                      <span style={{ font: `600 11px ${font.mono}`, color: c.mute }}>скрыт</span>
                    )}
                  </div>
                  <MiniRow label="Вы" pct={bp.minePct} n={bp.mine} total={bp.total} />
                  <MiniRow label={conn.name} pct={bp.theirsPct} n={bp.theirs} total={bp.total} />
                </Card>
              );
            })}
          </div>
        )}

        <Card pad={16} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Label>Заключение</Label>
          <p style={{ margin: 0, font: `400 14px/1.5 ${font.sans}`, color: c.ink }}>
            Разбор по всем открытым ответам: где вы сходитесь, что стоит обсудить и на что
            обратить внимание. Появится в блоке про ИИ — он читает оба ответа и ваши отметки.
          </p>
          <Button full variant="secondary" disabled>
            Пока недоступно
          </Button>
        </Card>

        <Button
          full
          variant="secondary"
          onClick={async () => {
            if (!confirm(`Удалить связь с ${conn.name}? Вы перестанете видеть ответы друг друга.`))
              return;
            const res = await dropConnection(conn.id);
            if (!res.ok) {
              alert(`Не получилось: ${res.message}`);
              return;
            }
            actions.removeConnection(conn.id);
            onClose();
          }}
        >
          Удалить связь
        </Button>
      </div>
    </div>
  );
}

function Answer({ who, text, accent }) {
  return (
    <div style={{ display: "flex", gap: 9 }}>
      <span style={{ width: 4, borderRadius: 4, background: accent, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: `600 11px ${font.mono}`, letterSpacing: "0.1em", textTransform: "uppercase", color: c.mute }}>
          {who}
        </div>
        <p style={{ margin: "3px 0 0", font: `400 14px/1.45 ${font.sans}`, color: c.ink }}>{text}</p>
      </div>
    </div>
  );
}

function MiniRow({ label, pct, n, total }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <span
        style={{
          font: `600 11.5px ${font.sans}`,
          color: c.mute,
          width: 62,
          flexShrink: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1 }}>
        <Progress value={pct} height={7} />
      </div>
      <span style={{ font: `600 11.5px ${font.mono}`, color: c.mute }}>
        {n}/{total}
      </span>
    </div>
  );
}

function Stat({ n, label, bg }) {
  return (
    <div
      style={{
        flex: 1,
        background: bg,
        border: `2px solid ${c.ink}`,
        borderRadius: 12,
        padding: "9px 6px",
        textAlign: "center",
      }}
    >
      <div style={{ font: `700 19px ${font.serif}`, color: c.ink }}>{n}</div>
      <div style={{ font: `600 10.5px ${font.sans}`, color: c.ink, opacity: 0.7 }}>{label}</div>
    </div>
  );
}

function Seg({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? c.sage : c.paper,
        border: `2px solid ${c.ink}`,
        borderRadius: 999,
        boxShadow: `0 2px 0 ${c.ink}`,
        padding: "9px 8px",
        font: `700 13px ${font.sans}`,
        color: c.ink,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
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
const top = { display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 8px" };
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
  padding: "8px 16px calc(24px + env(safe-area-inset-bottom))",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  overflowY: "auto",
  maxWidth: 560,
  width: "100%",
  margin: "0 auto",
};
const reactBtn = {
  border: `2px solid ${c.ink}`,
  borderRadius: 999,
  boxShadow: `0 2px 0 ${c.ink}`,
  padding: "7px 13px",
  font: `600 12.5px ${font.sans}`,
  color: c.ink,
  cursor: "pointer",
};
