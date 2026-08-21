import React, { useEffect, useState } from "react";
import { c, font } from "../theme.js";
import { screenHeight, screenTop, lockScroll } from "../viewport.js";
import { Card, Button, Progress, Label } from "../ui.jsx";
import { dropConnection, setExportConsent, fetchVerdict } from "../sync.js";
import { exportPair } from "../export.js";
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

function Tag({ children, warm }) {
  return (
    <span
      style={{
        font: `600 11px ${font.sans}`,
        color: c.ink,
        background: warm ? c.coral : c.sage,
        color: warm ? c.onCoral : c.ink,
        border: `2px solid ${c.ink}`,
        borderRadius: 999,
        padding: "3px 9px",
      }}
    >
      {children}
    </span>
  );
}

const REACTIONS = [
  { id: "match", ru: "Совпадаем", en: "We match" },
  { id: "talk", ru: "Обсудить", en: "Worth talking" },
  { id: "differ", ru: "Расходимся", en: "We differ" },
];

const T = {
  ru: {
    back: "Назад",
    kinds: { partner: "партнёр", candidate: "кандидат", friend: "друг", other: "связь" },
    opened: (n) => ` · открыто ${n}`,
    marks: "Ваши отметки",
    match: "совпадаем",
    talk: "обсудить",
    differ: "расходимся",
    comparisons: (n) => `Сравнения (${n})`,
    byBlocks: "По блокам",
    nothingYet: "Пока нечего сравнивать",
    nothingBody: "Ответ открывается, когда вы оба ответили на один и тот же вопрос.",
    theirTurn: (name, n) => ` ${name} уже ответил на ${n} — очередь за вами.`,
    you: "Вы",
    hidden: "скрыт",
    verdict: "Заключение",
    verdictBody:
      "Разбор по всем открытым ответам: где вы сходитесь, что стоит обсудить и на что обратить внимание. Появится в блоке про ИИ — он читает оба ответа и ваши отметки.",
    soon: "Пока недоступно",
    build: "Собрать разбор",
    again: "Собрать заново",
    thinking: "Читаю ваши ответы…",
    needMore: (n) => `Нужно хотя бы 5 открытых пар ответов, сейчас ${n}.`,
    remove: "Удалить связь",
    removeConfirm: (name) => `Удалить связь с ${name}? Вы перестанете видеть ответы друг друга.`,
    failed: (msg) => `Не получилось: ${msg}`,
    pairExport: "Совместная выгрузка",
    pairBody:
      "Файл с ответами вас обоих собирается, только когда согласны оба. Ответы другого человека — его данные: без его разрешения они в файл не попадут.",
    youAgreed: (ok) => `вы: ${ok ? "разрешили" : "не разрешили"}`,
    theyAgreed: (name, ok) => `${name}: ${ok ? "разрешил" : "не разрешил"}`,
    allow: "Разрешить совместную выгрузку",
    revoke: "Отозвать разрешение",
    doExport: "Выгрузить наши ответы",
    waitBoth: "Ждём согласия обоих",
    copiedPair: "Ответы пары скопированы. Вставьте их куда нужно.",
    savedPair: "Файл с ответами пары сохранён.",
    exportFailed: "Не удалось выгрузить. Попробуйте открыть приложение в браузере.",
  },
  en: {
    back: "Back",
    kinds: { partner: "partner", candidate: "candidate", friend: "friend", other: "connection" },
    opened: (n) => ` · ${n} revealed`,
    marks: "Your marks",
    match: "match",
    talk: "discuss",
    differ: "differ",
    comparisons: (n) => `Comparisons (${n})`,
    byBlocks: "By block",
    nothingYet: "Nothing to compare yet",
    nothingBody: "An answer opens when you have both answered the same question.",
    theirTurn: (name, n) => ` ${name} has already answered ${n} — your turn.`,
    you: "You",
    hidden: "hidden",
    verdict: "Summary",
    verdictBody:
      "A read of every revealed answer: where you agree, what is worth discussing, and what to watch out for. It arrives with the AI block, which reads both answers and your marks.",
    soon: "Not available yet",
    build: "Build the summary",
    again: "Build again",
    thinking: "Reading your answers…",
    needMore: (n) => `At least 5 revealed answer pairs are needed, you have ${n}.`,
    remove: "Remove connection",
    removeConfirm: (name) => `Remove your connection with ${name}? You will stop seeing each other's answers.`,
    failed: (msg) => `Did not work: ${msg}`,
    pairExport: "Joint export",
    pairBody:
      "A file with both of your answers is created only when you both agree. The other person's answers are their data: without their permission they stay out of the file.",
    youAgreed: (ok) => `you: ${ok ? "agreed" : "not yet"}`,
    theyAgreed: (name, ok) => `${name}: ${ok ? "agreed" : "not yet"}`,
    allow: "Allow joint export",
    revoke: "Withdraw permission",
    doExport: "Export our answers",
    waitBoth: "Waiting for both",
    copiedPair: "Both sets of answers copied. Paste them wherever you need.",
    savedPair: "File with both sets of answers saved.",
    exportFailed: "Export did not work. Try opening the app in a browser.",
  },
};

export default function ConnectionDetail({ connId, onClose }) {
  useEffect(lockScroll, []);

  const { answers, connections, profile } = useStore();
  const hiddenBlocks = profile.hiddenBlocks;
  const lang = profile.lang === "en" ? "en" : "ru";
  const t = T[lang];
  const conn = connections.find((x) => x.id === connId);
  const [tab, setTab] = useState("open");
  const [verdict, setVerdict] = useState("");
  const [verdictNote, setVerdictNote] = useState("");
  const [busy, setBusy] = useState(false);

  if (!conn) return null;

  const consent = conn.exportConsent || { mine: false, theirs: false };
  const bothAgreed = consent.mine && consent.theirs;
  const open = revealed(answers, conn, hiddenBlocks);
  const p = pending(answers, conn);
  const m = matchStats(conn);

  return (
    <div style={wrap}>
      <div style={top}>
        <button onClick={onClose} style={back} aria-label={t.back}>
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: `700 19px ${font.serif}`, color: c.ink }}>{conn.name}</div>
          <div style={{ font: `400 12px ${font.sans}`, color: c.mute }}>
            {t.kinds[conn.kind] || t.kinds.other}
            {t.opened(open.length)}
          </div>
        </div>
      </div>

      <div style={body}>
        {m.rated > 0 && (
          <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Label>{t.marks}</Label>
            <div style={{ display: "flex", gap: 8 }}>
              <Stat n={m.match} label={t.match} bg={c.sage} />
              <Stat n={m.talk} label={t.talk} bg={c.paper} />
              <Stat n={m.differ} label={t.differ} bg={c.coral} onBg={c.onCoral} />
            </div>
          </Card>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <Seg active={tab === "open"} onClick={() => setTab("open")}>
            {t.comparisons(open.length)}
          </Seg>
          <Seg active={tab === "blocks"} onClick={() => setTab("blocks")}>
            {t.byBlocks}
          </Seg>
        </div>

        {tab === "open" && (
          <>
            {open.length === 0 && (
              <Card pad={16} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <Label>{t.nothingYet}</Label>
                <p style={{ margin: 0, font: `400 14px/1.5 ${font.sans}`, color: c.ink }}>
                  {t.nothingBody}
                  {p.waitingMe > 0 && t.theirTurn(conn.name, p.waitingMe)}
                </p>
              </Card>
            )}

            {open.map((q) => (
              <Card key={q.id} pad={14} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                <p style={{ margin: 0, font: `600 17px/1.25 ${font.serif}`, color: c.ink }}>{qText(q, lang)}</p>

                <Answer who={t.you} text={answers[q.id].text} accent={c.sage} />
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
                        {rx[lang]}
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
                      <span style={{ font: `600 11px ${font.mono}`, color: c.mute }}>{t.hidden}</span>
                    )}
                  </div>
                  <MiniRow label={t.you} pct={bp.minePct} n={bp.mine} total={bp.total} />
                  <MiniRow label={conn.name} pct={bp.theirsPct} n={bp.theirs} total={bp.total} />
                </Card>
              );
            })}
          </div>
        )}

        <Card pad={16} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Label>{t.verdict}</Label>
          <p style={{ margin: 0, font: `400 14px/1.5 ${font.sans}`, color: c.ink }}>
            {t.verdictBody}
          </p>

          {verdict && (
            <div style={verdictBox}>
              {verdict.split("\n").map((line, i) =>
                line.trim() ? (
                  <p key={i} style={{ margin: 0, font: `400 13.5px/1.55 ${font.sans}` }}>
                    {line}
                  </p>
                ) : null
              )}
            </div>
          )}

          {verdictNote && (
            <span style={{ font: `500 12px/1.4 ${font.mono}`, color: c.mute }}>{verdictNote}</span>
          )}

          <Button
            full
            variant={verdict ? "secondary" : "primary"}
            disabled={busy || open.length < 5}
            onClick={async () => {
              setBusy(true);
              setVerdictNote("");
              const res = await fetchVerdict(conn.id, lang, Boolean(verdict));
              setBusy(false);
              if (res.ok) setVerdict(res.body);
              else setVerdictNote(res.message);
            }}
          >
            {busy ? t.thinking : verdict ? t.again : t.build}
          </Button>

          {open.length < 5 && (
            <span style={{ font: `400 12px/1.4 ${font.sans}`, color: c.mute }}>
              {t.needMore(open.length)}
            </span>
          )}
        </Card>

        <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Label>{t.pairExport}</Label>
          <p style={{ margin: 0, font: `400 13px/1.5 ${font.sans}`, color: c.ink }}>{t.pairBody}</p>

          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <Tag warm={!consent.mine}>{t.youAgreed(consent.mine)}</Tag>
            <Tag warm={!consent.theirs}>{t.theyAgreed(conn.name, consent.theirs)}</Tag>
          </div>

          <Button
            full
            variant="secondary"
            onClick={async () => {
              const next = !consent.mine;
              const res = await setExportConsent(conn.id, next);
              if (!res.ok) {
                alert(t.failed(res.message));
                return;
              }
              actions.setExportConsent(conn.id, next);
            }}
          >
            {consent.mine ? t.revoke : t.allow}
          </Button>

          <Button
            full
            disabled={!bothAgreed}
            onClick={async () => {
              const res = await exportPair(answers, conn, profile);
              if (res.copied) alert(t.copiedPair);
              else if (res.saved) alert(t.savedPair);
              else alert(t.exportFailed);
            }}
          >
            {bothAgreed ? t.doExport : t.waitBoth}
          </Button>
        </Card>

        <Button
          full
          variant="secondary"
          onClick={async () => {
            if (!confirm(t.removeConfirm(conn.name)))
              return;
            const res = await dropConnection(conn.id);
            if (!res.ok) {
              alert(t.failed(res.message));
              return;
            }
            actions.removeConnection(conn.id);
            onClose();
          }}
        >
          {t.remove}
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

function Stat({ n, label, bg, onBg = c.ink }) {
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
      <div style={{ font: `700 19px ${font.serif}`, color: onBg }}>{n}</div>
      <div style={{ font: `600 10.5px ${font.sans}`, color: onBg, opacity: 0.75 }}>{label}</div>
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

const verdictBox = {
  background: c.bg,
  border: `2px solid ${c.ink}`,
  borderRadius: 12,
  padding: 13,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  color: c.ink,
};
const wrap = {
  position: "fixed",
  top: screenTop,
  left: 0,
  right: 0,
  height: screenHeight,
  background: c.bg,
  display: "flex",
  flexDirection: "column",
  zIndex: 30,
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
