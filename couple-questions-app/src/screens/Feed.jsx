import React from "react";
import { c, font } from "../theme.js";
import { Screen, Card, Label, Progress } from "../ui.jsx";
import { useStore, revealed, pending, totalProgress } from "../store.js";

export default function Feed({ onOpenConn, onGoForm }) {
  const { answers, connections, profile } = useStore();
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
        title: `${unrated} ${plural(unrated, "сравнение", "сравнения", "сравнений")} ждут вашей отметки`,
        note: `С ${conn.name}. Отметьте, где совпадаете, а где стоит поговорить.`,
        action: () => onOpenConn(conn.id),
        accent: true,
      });
    }
    if (p.waitingMe > 0) {
      events.push({
        id: `${conn.id}-waiting-me`,
        title: `${conn.name} ответил на ${p.waitingMe} ${plural(p.waitingMe, "вопрос", "вопроса", "вопросов")} раньше вас`,
        note: "Ответьте на те же — и увидите его ответы.",
        action: onGoForm,
      });
    }
    if (p.waitingThem > 0) {
      events.push({
        id: `${conn.id}-waiting-them`,
        title: `Ждём ${conn.name}: ${p.waitingThem} ${plural(p.waitingThem, "вопрос", "вопроса", "вопросов")}`,
        note: "Ваши ответы откроются, как только он ответит на те же.",
      });
    }
  }

  if (mine.done < mine.total) {
    events.push({
      id: "fill",
      title: `Заполнено ${mine.done} из ${mine.total}`,
      note: "Чем больше ответов, тем точнее сравнение.",
      action: onGoForm,
    });
  }

  return (
    <Screen title="Лента" subtitle="Что изменилось с прошлого захода.">
      {connections.length === 0 && (
        <Card pad={16} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Label>Пусто</Label>
          <p style={{ margin: 0, font: `400 14px/1.5 ${font.sans}`, color: c.ink }}>
            Здесь появятся открытые сравнения и реакции, когда у вас будет хотя бы одна связь.
          </p>
          <Progress value={mine.pct} height={8} />
          <span style={{ font: `400 12px ${font.sans}`, color: c.mute }}>
            Ваша анкета: {mine.done} из {mine.total}
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
  borderRadius: 4,
  border: `2px solid ${c.ink}`,
};
