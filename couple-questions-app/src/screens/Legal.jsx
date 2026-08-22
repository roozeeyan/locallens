import React, { useEffect, useState } from "react";
import { c, font } from "../theme.js";
import { screenHeight, screenTop, lockScroll } from "../viewport.js";
import { Card, Label } from "../ui.jsx";
import { PRIVACY, TERMS, LEGAL_UPDATED } from "../legal.js";

const T = {
  ru: { privacy: "Конфиденциальность", terms: "Соглашение", updated: "Обновлено", back: "Назад" },
  en: { privacy: "Privacy", terms: "Terms", updated: "Updated", back: "Back" },
};

export default function Legal({ lang = "ru", initial = "privacy", onClose }) {
  const [doc, setDoc] = useState(initial);
  useEffect(lockScroll, []);

  const t = T[lang] || T.ru;
  const source = doc === "privacy" ? PRIVACY : TERMS;
  const text = source[lang] || source.ru;

  return (
    <div style={wrap}>
      <div style={top}>
        <button onClick={onClose} style={back} aria-label={t.back}>
          ←
        </button>
        <div style={{ font: `700 18px ${font.serif}`, color: c.ink }}>{text.title}</div>
      </div>

      <div style={body}>
        <div style={{ display: "flex", gap: 8 }}>
          <Tab active={doc === "privacy"} onClick={() => setDoc("privacy")}>
            {t.privacy}
          </Tab>
          <Tab active={doc === "terms"} onClick={() => setDoc("terms")}>
            {t.terms}
          </Tab>
        </div>

        <span style={{ font: `400 11.5px ${font.mono}`, color: c.mute }}>
          {t.updated}: {LEGAL_UPDATED}
        </span>

        {text.sections.map((sec) => (
          <Card key={sec.h} pad={14} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Label>{sec.h}</Label>
            {sec.p.map((line, i) => (
              <p key={i} style={para}>
                {line}
              </p>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}

function Tab({ children, active, onClick }) {
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
      aria-pressed={active}
    >
      {children}
    </button>
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
  zIndex: 40,
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
  gap: 11,
  overflowY: "auto",
  maxWidth: 560,
  width: "100%",
  margin: "0 auto",
};
const para = { margin: 0, font: `400 13.5px/1.5 ${font.sans}`, color: c.ink };
