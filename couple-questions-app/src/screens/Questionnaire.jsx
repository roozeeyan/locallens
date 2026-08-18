import React from "react";
import { c, font } from "../theme.js";
import { Screen, Card, Progress, Label } from "../ui.jsx";
import { useStore, CATEGORIES, blockProgress, totalProgress } from "../store.js";
import { blockOrder, isBlockOpen, lockedQuestionCount } from "../limits.js";

export default function Questionnaire({ onOpenBlock, onPaywall }) {
  const { answers, profile } = useStore();
  const total = totalProgress(answers);
  const order = blockOrder(profile.topics);
  const locked = lockedQuestionCount(profile);

  // Перечисляем то, что действительно закрыто, — состав зависит от выбора
  // тем при знакомстве.
  const lockedNames = order
    .filter((cat) => !isBlockOpen(cat.id, profile))
    .slice(0, 4)
    .map((cat) => cat.ru.replace(/^Блок \d+\.\s*/, "").split(/\s+и\s+|,/)[0]);

  return (
    <Screen
      title="Анкета"
      subtitle="Отвечаете только вы. Ответы партнёра откроются, когда он ответит на тот же вопрос."
    >
      <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Label>Заполнено</Label>
          <span style={{ font: `700 15px ${font.serif}` }}>
            {total.done} из {total.total}
          </span>
        </div>
        <Progress value={total.pct} />
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {order.map((cat) => {
          const p = blockProgress(answers, cat.id);
          const done = p.done === p.total;
          const open = isBlockOpen(cat.id, profile);
          const num = CATEGORIES.findIndex((x) => x.id === cat.id) + 1;

          return (
            <Card
              key={cat.id}
              onClick={() => (open ? onOpenBlock(cat.id) : onPaywall("blocks"))}
              pad={13}
              style={open ? undefined : { opacity: 0.72 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    ...icon,
                    background: !open ? c.coral : done ? c.sage : c.paper,
                  }}
                >
                  {num}
                </span>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                  <span style={{ font: `700 14.5px ${font.sans}`, color: c.ink }}>
                    {cat.ru.replace(/^Блок \d+\.\s*/, "")}
                  </span>
                  {open ? (
                    <Progress value={p.pct} height={7} />
                  ) : (
                    <span style={{ font: `600 11.5px ${font.mono}`, color: c.mute }}>
                      Premium
                    </span>
                  )}
                </div>
                <span
                  style={{ font: `600 12px ${font.mono}`, color: c.mute, whiteSpace: "nowrap" }}
                >
                  {open ? `${p.done}/${p.total}` : `${p.total}`}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {locked > 0 && lockedNames.length > 0 && (
        <Card
          pad={15}
          onClick={() => onPaywall("blocks")}
          style={{ display: "flex", alignItems: "center", gap: 12, background: c.sage }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ font: `700 14.5px ${font.sans}`, color: c.ink }}>
              Открыть остальные {locked}
            </div>
            <div style={{ font: `400 12.5px ${font.sans}`, color: c.ink, opacity: 0.75 }}>
              {lockedNames.join(", ")}
            </div>
          </div>
          <span style={{ font: `600 18px ${font.sans}`, color: c.ink }}>›</span>
        </Card>
      )}
    </Screen>
  );
}

const icon = {
  width: 34,
  height: 34,
  flexShrink: 0,
  border: `2px solid ${c.ink}`,
  borderRadius: 9,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  font: `700 14px ${font.serif}`,
  color: c.ink,
};
