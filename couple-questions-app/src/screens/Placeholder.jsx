import React from "react";
import { c, font } from "../theme.js";
import { Screen, Card, Label } from "../ui.jsx";

export default function Placeholder({ title, subtitle, items }) {
  return (
    <Screen title={title} subtitle={subtitle}>
      <Card pad={16} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Label>В работе</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((t) => (
            <div key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={dot} />
              <span style={{ font: `400 14px/1.45 ${font.sans}`, color: c.ink }}>{t}</span>
            </div>
          ))}
        </div>
      </Card>
    </Screen>
  );
}

const dot = {
  width: 12,
  height: 12,
  marginTop: 4,
  flexShrink: 0,
  border: `2px solid ${c.ink}`,
  borderRadius: 4,
  background: c.bg,
};
