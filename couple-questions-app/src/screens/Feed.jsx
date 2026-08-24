import React from "react";
import { c, font } from "../theme.js";
import { Screen, Card, Label, Progress } from "../ui.jsx";
import { useStore, revealed, pending, totalProgress } from "../store.js";

const T = {
  ru: {
    title: "Лента",
    subtitle: "Что изменилось с прошлого захода.",
    empty: "Пусто",
    emptyBody:
      "Здесь появятся открытые сравнения и реакции, когда у вас будет хотя бы одна связь.",
    yours: (done, total) => `Ваша анкета: ${done} из ${total}`,
    unrated: (n) =>
      `${n} ${plural(n, "сравнение", "сравнения", "сравнений")} ждут вашей отметки`,
    unratedNote: (name) => `С ${name}. Отметьте, где совпадаете, а где стоит поговорить.`,
    aheadOfYou: (name, n) =>
      `${name} ответил на ${n} ${plural(n, "вопрос", "вопроса", "вопросов")} раньше вас`,
    aheadNote: "Ответьте на те же — и увидите его ответы.",
    waiting: (name, n) =>
      `Ждём ${name}: ${n} ${plural(n, "вопрос", "вопроса", "вопросов")}`,
    waitingNote: "Ваши ответы откроются, как только он ответит на те же.",
    fill: (done, total) => `Заполнено ${done} из ${total}`,
    fillNote: "Чем больше ответов, тем точнее сравнение.",
  },
  en: {
    title: "Feed",
    subtitle: "What changed since your last visit.",
    empty: "Nothing yet",
    emptyBody:
      "Revealed comparisons and reactions will show up here once you have at least one connection.",
    yours: (done, total) => `Your answers: ${done} of ${total}`,
    unrated: (n) => `${n} ${n === 1 ? "comparison is" : "comparisons are"} waiting for your mark`,
    unratedNote: (name) => `With ${name}. Mark where you agree and what is worth discussing.`,
    aheadOfYou: (name, n) =>
      `${name} answered ${n} ${n === 1 ? "question" : "questions"} before you`,
    aheadNote: "Answer the same ones to see their answers.",
    waiting: (name, n) => `Waiting for ${name}: ${n} ${n === 1 ? "question" : "questions"}`,
    waitingNote: "Your answers open as soon as they answer the same ones.",
    fill: (done, total) => `${done} of ${total} answered`,
    fillNote: "The more you answer, the sharper the comparison.",
  },
};

export default function Feed({ onOpenConn, onGoForm }) {
  const { answers, connections, profile } = useStore();
  const t = T[profile.lang === "en" ? "en" : "ru"];
  const hiddenBlocks = profile.hiddenBlocks;

  const mine = totalProgress(answers);
  const events = [];

  for (const conn of connections) {
    const open = revealed(answers, conn, hiddenBlocks);
    const p = pending(answers, conn);
    const unrated = open.filter((q) => !conn.reactions?.[q.id]).length;

    if (unrated > 0) {
      events.push({
        id: `${conn.id}-unrated`,
        title: t.unrated(unrated),
        note: t.unratedNote(conn.name),
        action: () => onOpenConn(conn.id),
        accent: true,
      });
    }
    if (p.waitingMe > 0) {
      events.push({
        id: `${conn.id}-waiting-me`,
        title: t.aheadOfYou(conn.name, p.waitingMe),
        note: t.aheadNote,
        action: onGoForm,
      });
    }
    if (p.waitingThem > 0) {
      events.push({
        id: `${conn.id}-waiting-them`,
        title: t.waiting(conn.name, p.waitingThem),
        note: t.waitingNote,
      });
    }
  }

  if (mine.done < mine.total) {
    events.push({
      id: "fill",
      title: t.fill(mine.done, mine.total),
      note: t.fillNote,
      action: onGoForm,
    });
  }

  return (
    <Screen title={t.title} subtitle={t.subtitle}>
      {connections.length === 0 && (
        <Card pad={16} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Label>{t.empty}</Label>
          <p style={{ margin: 0, font: `400 14px/1.5 ${font.sans}`, color: c.ink }}>
            {t.emptyBody}
          </p>
          <Progress value={mine.pct} height={8} />
          <span style={{ font: `400 12px ${font.sans}`, color: c.mute }}>
            {t.yours(mine.done, mine.total)}
          </span>
        </Card>
      )}

      {events.map((e) => (
        <Card
          key={e.id}
          pad={14}
          onClick={e.action}
          style={{ display: "flex", alignItems: "center", gap: 11 }}
        >
          <span style={{ ...bullet, background: e.accent ? c.coral : c.sage }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: `700 14px/1.35 ${font.sans}`, color: c.ink }}>{e.title}</div>
            <div style={{ font: `400 12.5px/1.4 ${font.sans}`, color: c.mute, marginTop: 2 }}>
              {e.note}
            </div>
          </div>
          {e.action && <span style={{ font: `600 18px ${font.sans}`, color: c.mute }}>›</span>}
        </Card>
      ))}
    </Screen>
  );
}

function plural(n, one, few, many) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

const bullet = {
  width: 12,
  height: 12,
  flexShrink: 0,
  borderRadius: 8,
  border: `2px solid ${c.ink}`,
};
