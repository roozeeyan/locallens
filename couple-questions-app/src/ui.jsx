import React from "react";
import { c, font, r, hard, border } from "./theme.js";

export function Screen({ title, subtitle, children, action }) {
  return (
    <div style={s.screen}>
      {(title || action) && (
        <header style={s.header}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && <h1 style={s.h1}>{title}</h1>}
            {subtitle && <p style={s.sub}>{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </div>
  );
}

export function Button({ children, onClick, variant = "primary", full, disabled, style }) {
  const v = {
    primary: { background: c.sage },
    secondary: { background: c.paper },
    quiet: { background: "transparent", boxShadow: "none", border: "none" },
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...s.btn,
        ...v,
        width: full ? "100%" : undefined,
        opacity: disabled ? 0.45 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Card({ children, onClick, style, pad = 14 }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      style={{
        ...s.card,
        padding: pad,
        cursor: onClick ? "pointer" : undefined,
        textAlign: "left",
        width: "100%",
        font: "inherit",
        color: "inherit",
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

export function Chip({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...s.chip,
        background: active ? c.sage : c.paper,
      }}
    >
      {children}
    </button>
  );
}

export function Progress({ value, height = 10 }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={{ ...s.prog, height }} role="progressbar" aria-valuenow={Math.round(pct)}>
      <i style={{ ...s.progFill, width: `${pct}%` }} />
    </div>
  );
}

export function Label({ children }) {
  return <span style={s.label}>{children}</span>;
}

export function Lock() {
  return <span style={s.lock} aria-label="Premium" />;
}

export function Field({ value, onChange, placeholder, rows = 5 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={s.field}
    />
  );
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <nav style={s.tabbar}>
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={s.tab} aria-current={on}>
            <span style={{ ...s.tabIcon, background: on ? c.sage : "transparent", borderRadius: t.round ? "50%" : 6 }} />
            <span style={{ ...s.tabText, opacity: on ? 1 : 0.45 }}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export const s = {
  screen: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    padding: "14px 16px 24px",
  },
  header: { display: "flex", alignItems: "flex-start", gap: 12, paddingTop: 6 },
  h1: { font: `700 30px/1.08 ${font.serif}`, letterSpacing: "-0.01em", margin: 0, color: c.ink },
  sub: { margin: "6px 0 0", fontSize: 13.5, color: c.mute, lineHeight: 1.4 },

  btn: {
    border,
    borderRadius: r.pill,
    boxShadow: hard(3),
    padding: "13px 22px",
    font: `700 15px ${font.sans}`,
    color: c.ink,
    cursor: "pointer",
  },
  card: {
    background: c.paper,
    border,
    borderRadius: r.md,
    boxShadow: hard(3),
    display: "block",
  },
  chip: {
    background: c.paper,
    border,
    borderRadius: r.pill,
    boxShadow: hard(2),
    padding: "8px 14px",
    font: `600 13.5px ${font.sans}`,
    color: c.ink,
    cursor: "pointer",
  },
  prog: {
    border,
    borderRadius: r.pill,
    background: c.paper,
    overflow: "hidden",
    flexShrink: 0,
  },
  progFill: { display: "block", height: "100%", background: c.sage, transition: "width .25s ease" },
  label: {
    font: `600 10.5px ${font.mono}`,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: c.mute,
  },
  lock: {
    display: "inline-block",
    width: 14,
    height: 14,
    background: c.coral,
    border,
    borderRadius: 4,
    verticalAlign: "-2px",
  },
  field: {
    width: "100%",
    background: c.paper,
    border,
    borderRadius: r.md,
    boxShadow: hard(3),
    padding: 13,
    font: `400 15px/1.45 ${font.sans}`,
    color: c.ink,
    resize: "vertical",
    boxSizing: "border-box",
  },
  tabbar: {
    position: "sticky",
    bottom: 0,
    margin: "0 12px 12px",
    background: c.paper,
    border,
    borderRadius: r.pill,
    boxShadow: hard(3),
    display: "flex",
    justifyContent: "space-around",
    padding: "8px 4px",
    flexShrink: 0,
  },
  tab: {
    background: "none",
    border: "none",
    padding: "2px 6px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    cursor: "pointer",
    color: c.ink,
  },
  tabIcon: { width: 16, height: 16, border, display: "block" },
  tabText: { font: `650 10px ${font.sans}` },
};
