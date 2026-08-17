import React from "react";
import { c, font } from "../theme.js";
import { Screen, Card, Progress, Label } from "../ui.jsx";
import { useStore, CATEGORIES, blockProgress, totalProgress } from "../store.js";

export default function Questionnaire({ onOpenBlock }) {
  const answers = useStore((s) => s.answers);
  const total = totalProgress(answers);

  return (
    <Screen title="Анкета" subtitle="Отвечаете только вы. Ответы партнёра откроются, когда он ответит на тот же вопрос.">
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
        {CATEGORIES.map((cat, i) => {
          const p = blockProgress(answers, cat.id);
          const done = p.done === p.total;
          return (
            <Card key={cat.id} onClick={() => onOpenBlock(cat.id)} pad={13}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ ...icon, background: done ? c.sage : c.paper }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                  <span style={{ font: `700 14.5px ${font.sans}`, color: c.ink }}>{cat.ru.replace(/^Блок \d+\.\s*/, "")}</span>
                  <Progress value={p.pct} height={7} />
                </div>
                <span style={{ font: `600 12px ${font.mono}`, color: c.mute, whiteSpace: "nowrap" }}>
                  {p.done}/{p.total}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
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
