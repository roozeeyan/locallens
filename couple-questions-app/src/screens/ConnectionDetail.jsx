import React, { useEffect, useRef, useState } from "react";
import { c, font } from "../theme.js";
import { screenHeight, screenTop, lockScroll } from "../viewport.js";
import { Card, Button, Progress, Label } from "../ui.jsx";
import { dropConnection, setExportConsent, fetchVerdict, loadVerdicts } from "../sync.js";
import { exportPair } from "../export.js";
import { RichText } from "../richtext.jsx";
import { BlockArt } from "../blockart.jsx";
import { track, STEP } from "../track.js";
import {
  useStore,
  actions,
  CATEGORIES,
  revealed,
  pending,
  matchStats,
  connBlockProgress,
  blocksReadyForVerdict,
  setTitle,
  qText,
} from "../store.js";

function Tag({ children, warm }) {
  return (
    <span
      style={{
        font: `600 11px ${font.sans}`,
        background: warm ? c.coral : c.sage,
        color: warm ? c.onCoral : c.ink,
        border: `1.5px solid ${c.ink}`,
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
    topics: "Темы",
    topicsNote: "Внутри темы — ваши ответы рядом и разбор по ней.",
    openedOf: (n, total) => `открыто ${n} из ${total}`,
    waitingBoth: "ждём ответов",
    verdictReady: "разбор готов",
    verdictDone: "разбор собран",
    verdictHere: (name) => `Разбор готов: ${name}`,
    verdictGo: "Открыть",
    verdictMade: "Разбор собран — нажмите, чтобы прочитать",
    hide: "Свернуть",
    emptyTopic: "В этой теме пока нет общих ответов.",
    nothingYet: "Пока нечего сравнивать",
    nothingBody: "Ответ открывается, когда вы оба ответили на один и тот же вопрос.",
    theirTurn: (name, n) => ` ${name} уже ответил на ${n} — очередь за вами.`,
    you: "Вы",
    hidden: "скрыт",
    verdict: "Заключение",
    verdictBody:
      "Разбор одной темы: где вы сходитесь, где расходитесь принципиально и что стоит проговорить вслух. Первый — бесплатно.",
    soon: "Пока недоступно",
    verdictOffline: "Разбор ещё не подключён на сервере. Появится вместе с оплатой.",
    build: (name) => `Разобрать «${name}»`,
    again: "Собрать заново",
    thinking: "Читаю ваши ответы…",
    oneADay: "Одна тема в сутки: разбор стоит прочитать вдвоём и проговорить, прежде чем брать следующую.",
    fallbackUsed: "Основная модель не ответила — разбор собрала запасная, она слабее. Попробуйте «Собрать заново».",
    needBlock: "Разбор собирается, когда вы оба закроете хотя бы одну тему целиком.",
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
    topics: "Topics",
    topicsNote: "Inside a topic: your answers side by side, and the summary for it.",
    openedOf: (n, total) => `${n} of ${total} open`,
    waitingBoth: "waiting for answers",
    verdictReady: "summary ready",
    verdictDone: "summary written",
    verdictHere: (name) => `Summary ready: ${name}`,
    verdictGo: "Open",
    verdictMade: "Summary is ready — tap to read it",
    hide: "Collapse",
    emptyTopic: "No shared answers in this topic yet.",
    nothingYet: "Nothing to compare yet",
    nothingBody: "An answer opens when you have both answered the same question.",
    theirTurn: (name, n) => ` ${name} has already answered ${n} — your turn.`,
    you: "You",
    hidden: "hidden",
    verdict: "Summary",
    verdictBody:
      "A read of one whole topic: where you agree, where you differ in principle, and what is worth saying out loud. The first one is free.",
    soon: "Not available yet",
    verdictOffline: "The summary is not deployed on the server yet. It arrives with payments.",
    build: (name) => `Read “${name}”`,
    again: "Build again",
    thinking: "Reading your answers…",
    oneADay: "One topic a day: a summary is worth reading together and talking through before taking the next one.",
    fallbackUsed: "The main model did not answer — a weaker backup wrote this. Try “Build again”.",
    needBlock: "The summary arrives once you have both completed at least one whole topic.",
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

export default function ConnectionDetail({ connId, onClose, onPaywall }) {
  useEffect(lockScroll, []);

  const { answers, connections, profile } = useStore();
  const hiddenBlocks = profile.hiddenBlocks;
  const lang = profile.lang === "en" ? "en" : "ru";
  const t = T[lang];
  const conn = connections.find((x) => x.id === connId);
  // Экран связи двухуровневый. Наверху — сетка тем, внутри темы — ответы
  // по ней и её разбор. Плоский список всех открытых вопросов работал,
  // пока их было двенадцать; на ста девятнадцати это лента без дна.
  const [openTopic, setOpenTopic] = useState(null);
  // Разбор теперь принадлежит теме, а не связи целиком: у каждой закрытой
  // темы свой текст, и держать их надо порознь.
  const [verdicts, setVerdicts] = useState({});
  const [verdictNote, setVerdictNote] = useState("");
  const [verdictOpen, setVerdictOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef(null);

  // Разборы, собранные раньше, подтягиваем при открытии связи. Иначе тема
  // с готовым разбором выглядит как тема без него, и человек жмёт
  // «собрать» ради текста, который давно написан.
  useEffect(() => {
    let alive = true;
    loadVerdicts(connId, lang).then((made) => {
      if (alive) setVerdicts(made);
    });
    return () => {
      alive = false;
    };
  }, [connId, lang]);

  if (!conn) return null;

  const consent = conn.exportConsent || { mine: false, theirs: false };
  const bothAgreed = consent.mine && consent.theirs;
  const open = revealed(answers, conn, hiddenBlocks);
  const p = pending(answers, conn);
  const m = matchStats(conn);
  const ready = blocksReadyForVerdict(answers, conn, hiddenBlocks);
  const current = openTopic || "";
  const verdict = verdicts[current] || "";

  // Сколько вопросов темы открыто обоим — число, ради которого человек
  // и заходит в связь.
  const openBy = {};
  for (const q of open) openBy[q.cat] = (openBy[q.cat] || 0) + 1;

  function enterTopic(id) {
    setOpenTopic(id);
    setVerdictNote("");
    // Готовый разбор открываем свёрнутым: это простыня на два экрана, и
    // разворачивать её человек должен сам, когда собрался читать.
    setVerdictOpen(false);
    bodyRef.current?.scrollTo({ top: 0 });
  }

  function leaveTopic() {
    setOpenTopic(null);
    setVerdictNote("");
    bodyRef.current?.scrollTo({ top: 0 });
  }

  async function buildVerdict() {
    if (!current) return;
    bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setBusy(true);
    setVerdictNote("");
    // Тексты вопросов живут в приложении, а не в базе. Без них модель
    // разбирала ответы вслепую и додумывала, о чём вообще спрашивали.
    const asked = {};
    for (const q of open) if (q.cat === current) asked[q.id] = qText(q, lang);
    const size = Object.keys(asked).length;
    track(STEP.verdictAsked, { block: current, pairs: size });
    const res = await fetchVerdict(conn.id, lang, {
      refresh: Boolean(verdict),
      questions: asked,
      block: current,
      blockTitle: setTitle(current, lang),
    });
    setBusy(false);
    if (res.ok) track(STEP.verdictGot, { block: current, pairs: size });
    // Первый разбор бесплатен; за следующим сервер отправляет
    // к покупке — открываем её сразу, без промежуточных надписей.
    if (res.locked) onPaywall?.();
    else if (res.ok) {
      setVerdicts((prev) => ({ ...prev, [current]: res.body }));
      setVerdictOpen(true);
      // Запасная модель заметно слабее основной. Молчать об этом нечестно:
      // человек решит, что так продукт и работает.
      if (res.fallback) setVerdictNote(t.fallbackUsed);
    }
    else setVerdictNote(res.offline ? t.verdictOffline : res.message);
  }

  const topicOpen = openTopic ? openBy[openTopic] || 0 : 0;
  const bp = openTopic ? connBlockProgress(answers, conn, openTopic) : null;
  const topicTotal = bp ? bp.total : 0;
  const topicQuestions = openTopic ? open.filter((q) => q.cat === openTopic) : [];

  return (
    <div style={wrap}>
      <div style={top}>
        <button onClick={openTopic ? leaveTopic : onClose} style={back} aria-label={t.back}>
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: `700 19px ${font.serif}`, color: c.ink }}>
            {openTopic ? setTitle(openTopic, lang) : conn.name}
          </div>
          <div style={{ font: `400 12px ${font.sans}`, color: c.mute }}>
            {openTopic
              ? `${conn.name} · ${t.openedOf(topicOpen, topicTotal)}`
              : `${t.kinds[conn.kind] || t.kinds.other}${t.opened(open.length)}`}
          </div>
        </div>
      </div>

      <div style={body} ref={bodyRef}>
        {openTopic ? (
          <>
            <VerdictCard
              t={t}
              lang={lang}
              topic={openTopic}
              ready={ready.includes(openTopic)}
              verdict={verdict}
              note={verdictNote}
              busy={busy}
              open={verdictOpen}
              onToggle={() => setVerdictOpen((x) => !x)}
              onBuild={buildVerdict}
            />

            {topicQuestions.length === 0 ? (
              <Card pad={16} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <Label>{t.nothingYet}</Label>
                <p style={{ margin: 0, font: `400 15.5px/1.5 ${font.sans}`, color: c.ink }}>
                  {t.emptyTopic} {t.nothingBody}
                </p>
                <MiniRow label={t.you} pct={bp.minePct} n={bp.mine} total={topicTotal} />
                <MiniRow label={conn.name} pct={bp.theirsPct} n={bp.theirs} total={topicTotal} />
              </Card>
            ) : (
              topicQuestions.map((q) => (
                <Comparison
                  key={q.id}
                  q={q}
                  lang={lang}
                  t={t}
                  mine={answers[q.id].text}
                  theirs={conn.answers[q.id].text}
                  theirName={conn.name}
                  mark={conn.reactions?.[q.id]}
                  onMark={(value) => actions.setReaction(conn.id, q.id, value)}
                />
              ))
            )}
          </>
        ) : (
          <>
            {/* Разбор — то, ради чего человек сюда шёл. Одна строка вместо
                прежней карточки на пол-экрана: сам разбор живёт в теме. */}
            {ready.length > 0 && (
              <Card
                pad={13}
                onClick={() => enterTopic(ready[0])}
                style={{ display: "flex", alignItems: "center", gap: 10, background: c.sage }}
              >
                <span style={{ flex: 1, font: `700 15px ${font.sans}`, color: c.ink }}>
                  {t.verdictHere(setTitle(ready[0], lang))}
                </span>
                <span style={{ font: `600 18px ${font.sans}`, color: c.ink }}>›</span>
              </Card>
            )}

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

            <div>
              <Label>{t.topics}</Label>
              <p style={{ margin: "5px 0 0", font: `400 13.5px/1.45 ${font.sans}`, color: c.mute }}>
                {t.topicsNote}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {CATEGORIES.map((x) => (
                <TopicCard
                  key={x.id}
                  id={x.id}
                  t={t}
                  lang={lang}
                  hidden={hiddenBlocks.includes(x.id)}
                  opened={openBy[x.id] || 0}
                  total={connBlockProgress(answers, conn, x.id).total}
                  ready={ready.includes(x.id)}
                  made={Boolean(verdicts[x.id])}
                  onOpen={() => enterTopic(x.id)}
                />
              ))}
            </div>

            {open.length === 0 && (
              <Card pad={16} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <Label>{t.nothingYet}</Label>
                <p style={{ margin: 0, font: `400 15.5px/1.5 ${font.sans}`, color: c.ink }}>
                  {t.nothingBody}
                  {p.waitingMe > 0 && t.theirTurn(conn.name, p.waitingMe)}
                </p>
              </Card>
            )}
          </>
        )}

        {!openTopic && (
        <>
        <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Label>{t.pairExport}</Label>
          <p style={{ margin: 0, font: `400 14.5px/1.55 ${font.sans}`, color: c.ink }}>{t.pairBody}</p>

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
        </>
        )}
      </div>
    </div>
  );
}

/**
 * Тема внутри связи. Тот же язык, что и на главной анкете: человек уже
 * научился узнавать темы по рисунку, и переучивать его на другом экране
 * незачем.
 *
 * Число здесь одно и главное — сколько вопросов открыто обоим. Свой
 * прогресс человек смотрит в анкете; сюда он приходит читать общее.
 */
function TopicCard({ id, t, lang, hidden, opened, total, ready, made, onOpen }) {
  const alive = !hidden;

  return (
    <button
      onClick={alive ? onOpen : undefined}
      disabled={!alive}
      style={{
        ...topicCard,
        background: opened > 0 ? c.paper : c.dim,
        cursor: alive ? "pointer" : "default",
      }}
    >
      <span
        style={{
          display: "flex",
          justifyContent: "center",
          color: c.ink,
          opacity: opened > 0 ? 0.9 : 0.45,
        }}
      >
        <BlockArt id={id} size={92} />
      </span>

      <span
        style={{
          font: `600 14px/1.28 ${font.sans}`,
          color: c.ink,
          opacity: opened > 0 ? 1 : 0.75,
        }}
      >
        {setTitle(id, lang)}
      </span>

      {hidden ? (
        <span style={{ font: `500 11px ${font.mono}`, color: c.mute }}>{t.hidden}</span>
      ) : opened > 0 ? (
        <>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ flex: 1 }}>
              <Progress value={total ? (opened / total) * 100 : 0} height={5} />
            </span>
            <span style={{ font: `500 11px ${font.mono}`, color: c.ink }}>
              {opened}/{total}
            </span>
          </span>
          {(made || ready) && (
            <span style={{ font: `600 11.5px ${font.sans}`, color: c.ink }}>
              {made ? t.verdictDone : t.verdictReady} →
            </span>
          )}
        </>
      ) : (
        <span style={{ font: `500 11px ${font.mono}`, color: c.mute }}>{t.waitingBoth}</span>
      )}
    </button>
  );
}

const topicCard = {
  border: "none",
  borderRadius: 26,
  padding: "13px 13px 12px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  width: "100%",
  textAlign: "left",
  font: "inherit",
  color: "inherit",
};

/**
 * Разбор темы. Свёрнут по умолчанию: это текст на два-три экрана, и пока
 * он развёрнут, до самих ответов надо долистать. Заголовок — кнопка.
 */
function VerdictCard({ t, lang, topic, ready, verdict, note, busy, open, onToggle, onBuild }) {
  return (
    <Card pad={16} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {verdict ? (
        <button onClick={onToggle} style={verdictHead}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", font: `600 11px ${font.mono}`, letterSpacing: "0.1em", textTransform: "uppercase", color: c.mute }}>
              {t.verdict}
            </span>
            {!open && (
              <span style={{ display: "block", marginTop: 3, font: `400 13.5px/1.4 ${font.sans}`, color: c.ink }}>
                {t.verdictMade}
              </span>
            )}
          </span>
          <span
            style={{
              font: `600 15px ${font.sans}`,
              color: c.ink,
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform .15s",
            }}
          >
            ⌄
          </span>
        </button>
      ) : (
        <>
          <Label>{t.verdict}</Label>
          <p style={{ margin: 0, font: `400 15.5px/1.5 ${font.sans}`, color: c.ink }}>
            {t.verdictBody}
          </p>
        </>
      )}

      {verdict && open && (
        <div style={verdictBox}>
          <RichText text={verdict} />
        </div>
      )}

      {note && (
        <span style={{ font: `500 12px/1.4 ${font.mono}`, color: c.mute }}>{note}</span>
      )}

      {!ready ? (
        !verdict && (
          <span style={{ font: `400 12px/1.4 ${font.sans}`, color: c.mute }}>{t.needBlock}</span>
        )
      ) : (
        <>
          <Button full variant={verdict ? "secondary" : "primary"} disabled={busy} onClick={onBuild}>
            {busy ? t.thinking : verdict ? t.again : t.build(setTitle(topic, lang))}
          </Button>
          <span style={{ font: `400 12px/1.45 ${font.sans}`, color: c.mute }}>{t.oneADay}</span>
        </>
      )}
    </Card>
  );
}

const verdictHead = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  background: "transparent",
  border: "none",
  padding: 0,
  width: "100%",
  textAlign: "left",
  font: "inherit",
  color: "inherit",
  cursor: "pointer",
};

function Answer({ who, text, accent }) {
  return (
    <div style={{ display: "flex", gap: 9 }}>
      <span style={{ width: 4, borderRadius: 8, background: accent, flexShrink: 0 }} />
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

/**
 * Одно сравнение. Свёрнуто по умолчанию: сотня раскрытых пар ответов —
 * это простыня, по которой невозможно двигаться, и она же тормозит экран.
 * Виден вопрос и отметка; ответы открываются нажатием.
 */
function Comparison({ q, lang, t, mine, theirs, theirName, mark, onMark }) {
  const [open, setOpen] = useState(false);

  return (
    <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: open ? 11 : 8 }}>
      <button onClick={() => setOpen((x) => !x)} style={head}>
        <span style={{ flex: 1, font: `600 17px/1.25 ${font.serif}`, color: c.ink }}>
          {qText(q, lang)}
        </span>
        <span
          style={{
            font: `600 15px ${font.sans}`,
            color: c.mute,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .18s ease",
          }}
          aria-hidden="true"
        >
          ⌄
        </span>
      </button>

      {!open && mark && (
        <span style={{ font: `600 12px ${font.sans}`, color: c.mute }}>{t[mark]}</span>
      )}

      {open && (
        <>
          <Answer who={t.you} text={mine} accent={c.sage} />
          <Answer who={theirName} text={theirs} accent={c.coral} />

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {REACTIONS.map((rx) => (
              <button
                key={rx.id}
                onClick={() => onMark(rx.id)}
                style={{ ...reactBtn, background: mark === rx.id ? c.sage : c.bg }}
                aria-pressed={mark === rx.id}
              >
                {rx[lang]}
              </button>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

const head = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  background: "none",
  border: "none",
  padding: 0,
  width: "100%",
  textAlign: "left",
  font: "inherit",
  color: "inherit",
  cursor: "pointer",
};

function Stat({ n, label, bg, onBg = c.ink }) {
  return (
    <div
      style={{
        flex: 1,
        background: bg,
        border: `1.5px solid ${c.ink}`,
        borderRadius: 24,
        padding: "9px 6px",
        textAlign: "center",
      }}
    >
      <div style={{ font: `700 19px ${font.serif}`, color: onBg }}>{n}</div>
      <div style={{ font: `600 10.5px ${font.sans}`, color: onBg, opacity: 0.75 }}>{label}</div>
    </div>
  );
}

const verdictBox = {
  minWidth: 0,
  maxWidth: "100%",
  overflowWrap: "anywhere",
  background: c.bg,
  border: `1.5px solid ${c.ink}`,
  borderRadius: 24,
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
  background: c.veil,
  backdropFilter: "blur(2px)",
  WebkitBackdropFilter: "blur(2px)",
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
  border: `1.5px solid ${c.ink}`,
  borderRadius: "50%",
  boxShadow: `0 2px 0 ${c.ink}`,
  font: "18px/1 sans-serif",
  color: c.ink,
  cursor: "pointer",
};
const body = {
  flex: 1,
  padding: "8px 16px calc(96px + env(safe-area-inset-bottom))",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  overflowY: "auto",
  // Ничто внутри не должно уметь утащить страницу вбок: один разъехавшийся
  // блок превращал весь экран в горизонтально прокручиваемый.
  overflowX: "hidden",
  maxWidth: 560,
  width: "100%",
  margin: "0 auto",
};
const reactBtn = {
  border: `1.5px solid ${c.ink}`,
  borderRadius: 999,
  boxShadow: `0 2px 0 ${c.ink}`,
  padding: "7px 13px",
  font: `600 12.5px ${font.sans}`,
  color: c.ink,
  cursor: "pointer",
};
