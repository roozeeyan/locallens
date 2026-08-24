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

  // Неактивная кнопка гасится целиком, вместе с рамкой — от этого рамка
  // выглядит сломанной. Вместо прозрачности приглушаем сами цвета.
  const off = disabled
    ? {
        background: c.bg,
        color: c.mute,
        border: `1.5px solid ${c.mute}`,
        boxShadow: `0 2px 0 ${c.mute}`,
        cursor: "default",
      }
    : null;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...s.btn,
        ...v,
        width: full ? "100%" : undefined,
        ...off,
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

/**
 * Полоса прогресса. Первый ответ из двенадцати — это несколько пикселей,
 * которых не видно, поэтому у ненулевого прогресса есть минимальная
 * заметная ширина.
 */
export function Progress({ value, height = 10 }) {
  const pct = Math.max(0, Math.min(100, value));
  const shown = pct > 0 ? Math.max(pct, 7) : 0;
  return (
    <div style={{ ...s.prog, height }} role="progressbar" aria-valuenow={Math.round(pct)}>
      <i style={{ ...s.progFill, width: `${shown}%` }} />
    </div>
  );
}

/**
 * Подпись раздела. `light` — для подписей, лежащих прямо на подложке:
 * тёмная надпись на снимке пропадает, а обводить её ореолом некрасиво.
 */
export function Label({ children, light }) {
  return <span style={light ? { ...s.label, ...s.labelLight } : s.label}>{children}</span>;
}

/**
 * Переключатель как в настройках iOS, в наших цветах. На бегунке — замок:
 * без него плашка не объясняет, что именно она делает.
 */
export function LockSwitch({ on, onClick, label }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      aria-label={label}
      style={{
        ...s.switchTrack,
        background: on ? c.coral : "var(--rg-bg)",
        borderColor: on ? c.coral : c.mute,
      }}
    >
      <span style={{ ...s.switchKnob, transform: on ? "translateX(20px)" : "translateX(0)" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
          <rect
            x="5" y="10.5" width="14" height="10" rx="2.6"
            fill="none" stroke={on ? c.coral : c.mute} strokeWidth="2"
          />
          {on ? (
            <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke={c.coral} strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M8.5 10.5V8a3.5 3.5 0 0 1 6.6-1.6" fill="none" stroke={c.mute} strokeWidth="2" strokeLinecap="round" />
          )}
        </svg>
      </span>
    </button>
  );
}

export function Lock() {
  return <span style={s.lock} aria-label="Premium" />;
}

/**
 * Поле для ответа. С `grow` оно занимает всё свободное место экрана:
 * иначе под коротким ответом остаётся полэкрана пустоты, а длинный
 * приходится прокручивать внутри маленького окошка.
 */
export function Field({ value, onChange, placeholder, rows = 5, grow }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={grow ? undefined : rows}
      // Клавиатура появляется не мгновенно: подтягиваем поле к видимой
      // части экрана уже после того, как она заняла своё место.
      onFocus={(e) => {
        const el = e.target;
        setTimeout(() => el.scrollIntoView({ block: "nearest", behavior: "smooth" }), 320);
      }}
      style={grow ? { ...s.field, flex: "1 1 auto" } : s.field}
    />
  );
}

/** Геометрическая иллюстрация: фигура на коралловой подложке из точек. */
export function Iso({ size = 92, shape = "square" }) {
  const pad = Math.round(size * 0.34);
  return (
    <span style={{ display: "block", width: size * 1.06, height: size + pad, position: "relative" }}>
      <span
        style={{
          position: "absolute",
          left: -size * 0.06,
          top: size * 0.8,
          width: size * 1.12,
          height: size * 0.42,
          borderRadius: 20,
          backgroundImage: `radial-gradient(${c.coral} 2px, transparent 2.1px)`,
          backgroundSize: "7px 7px",
        }}
      />
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: size,
          height: size,
          borderRadius: shape === "circle" ? "50%" : size * 0.18,
          background: c.sage,
          border,
        }}
      />
    </span>
  );
}

/**
 * Нижнее меню. Выделение — отдельная плашка, которая переезжает на
 * выбранный пункт: подсветка самой кнопки не даёт этого движения, а
 * именно оно читается как «переключение».
 *
 * Позицию плашки берём измерением, а не расчётом по числу пунктов:
 * подписи разной длины, и на равные доли меню не делится.
 */
export function TabBar({ tabs, active, onChange }) {
  const items = React.useRef([]);
  const [pill, setPill] = React.useState(null);

  const measure = React.useCallback(() => {
    const el = items.current[tabs.findIndex((t) => t.id === active)];
    if (!el) return;
    setPill({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tabs, active]);

  React.useLayoutEffect(measure, [measure]);

  React.useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <nav style={s.tabbar}>
      {pill && <span style={{ ...s.tabPill, left: pill.left, width: pill.width }} aria-hidden="true" />}
      {tabs.map((t, i) => {
        const on = t.id === active;
        const Icon = ICONS[t.id] || ICONS.form;
        return (
          <button
            key={t.id}
            ref={(el) => (items.current[i] = el)}
            onClick={() => onChange(t.id)}
            style={s.tab}
            aria-current={on}
          >
            <Icon active={on} />
            <span style={{ ...s.tabText, opacity: on ? 1 : 0.55 }}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* --------------------------------------------------------------- иконки */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function Glyph({ children }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
      {children}
    </svg>
  );
}

/** Анкета — стопка вопросов. */
function IconForm({ active }) {
  return (
    <Glyph>
      <rect x="4" y="3" width="16" height="18" rx="3.5" {...stroke} />
      <path d="M8 8.5h8M8 12h8M8 15.5h5" {...stroke} strokeWidth={active ? 2 : 1.6} />
    </Glyph>
  );
}

/** Связи — двое. */
function IconLinks({ active }) {
  return (
    <Glyph>
      <circle cx="9" cy="8" r="3.2" {...stroke} strokeWidth={active ? 2 : 1.6} />
      <circle cx="16.5" cy="9.5" r="2.4" {...stroke} />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" {...stroke} strokeWidth={active ? 2 : 1.6} />
      <path d="M16 14.2c2.4.2 4.5 2 4.5 4.8" {...stroke} />
    </Glyph>
  );
}

/** Лента — список того, что изменилось. */
function IconFeed({ active }) {
  const w = active ? 2 : 1.6;
  return (
    <Glyph>
      <circle cx="5.5" cy="7" r="1.5" {...stroke} strokeWidth={w} />
      <circle cx="5.5" cy="12" r="1.5" {...stroke} strokeWidth={w} />
      <circle cx="5.5" cy="17" r="1.5" {...stroke} strokeWidth={w} />
      <path d="M10.5 7h9M10.5 12h9M10.5 17h5.5" {...stroke} strokeWidth={w} />
    </Glyph>
  );
}

/** Профиль — человек. */
function IconMe({ active }) {
  return (
    <Glyph>
      <circle cx="12" cy="8.5" r="3.6" {...stroke} strokeWidth={active ? 2 : 1.6} />
      <path d="M4.5 20c0-3.8 3.4-6 7.5-6s7.5 2.2 7.5 6" {...stroke} strokeWidth={active ? 2 : 1.6} />
    </Glyph>
  );
}

const ICONS = { form: IconForm, links: IconLinks, feed: IconFeed, me: IconMe };

export const s = {
  screen: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    padding: "14px 16px 24px",
  },
  header: { display: "flex", alignItems: "flex-start", gap: 12, paddingTop: 6 },
  h1: {
    font: `700 33px/1.06 ${font.serif}`,
    letterSpacing: "-0.015em",
    margin: 0,
    color: c.ink,
  },
  // Подзаголовок лежит на подложке, поэтому светлый: тёмный тонет на снимке.
  sub: {
    margin: "7px 0 0",
    font: `400 15px/1.4 ${font.sans}`,
    color: "#F6F1E8",
    opacity: 0.92,
  },

  btn: {
    border,
    borderRadius: r.pill,
    boxShadow: hard(3),
    padding: "13px 22px",
    font: `700 16px ${font.sans}`,
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
    font: `600 14.5px ${font.sans}`,
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
    font: `600 13.5px ${font.sans}`,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    color: c.ink,
    opacity: 0.62,
  },
  switchTrack: {
    width: 50,
    height: 30,
    flexShrink: 0,
    borderRadius: 999,
    border: "1.5px solid",
    padding: 2,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    transition: "background 220ms ease, border-color 220ms ease",
  },
  switchKnob: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: c.paper,
    boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 220ms cubic-bezier(0.3, 0.9, 0.3, 1)",
  },
  labelLight: { color: "#F6F1E8", opacity: 0.92 },
  lock: {
    display: "inline-block",
    width: 14,
    height: 14,
    background: c.coral,
    border,
    borderRadius: 8,
    verticalAlign: "-2px",
  },
  field: {
    width: "100%",
    // Клавиатура ужимает экран: без этого поле для ответа съёживается
    // до одной строки прямо во время набора.
    flexShrink: 0,
    minHeight: 132,
    background: c.paper,
    border,
    borderRadius: r.md,
    boxShadow: hard(3),
    padding: 13,
    font: `400 16px/1.5 ${font.sans}`,
    color: c.ink,
    resize: "vertical",
    boxSizing: "border-box",
  },
  tabbar: {
    // Закреплено внизу экрана: меню видно всегда, а не только после прокрутки.
    position: "fixed",
    left: 0,
    right: 0,
    bottom: "calc(4px + env(safe-area-inset-bottom))",
    width: "min(100% - 24px, 536px)",
    margin: "0 auto",
    zIndex: 20,
    background: c.paper,
    border,
    borderRadius: r.pill,
    boxShadow: hard(3),
    display: "flex",
    justifyContent: "space-between",
    padding: "7px 6px",
    flexShrink: 0,
  },
  tab: {
    position: "relative",
    zIndex: 1,
    flex: 1,
    background: "none",
    border: "none",
    padding: "4px 2px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    cursor: "pointer",
    color: c.ink,
  },
  // Плашка выделения: полупрозрачное стекло с бликом сверху и тенью снизу.
  tabPill: {
    position: "absolute",
    top: 4,
    bottom: 4,
    borderRadius: r.pill,
    background: "rgba(255, 255, 255, 0.34)",
    backdropFilter: "blur(14px) saturate(1.5)",
    WebkitBackdropFilter: "blur(14px) saturate(1.5)",
    border: "1px solid rgba(255, 255, 255, 0.55)",
    boxShadow:
      "inset 0 1px 1px rgba(255,255,255,0.75), inset 0 -1px 2px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.08)",
    transition: "left 420ms cubic-bezier(0.2, 0.9, 0.2, 1), width 420ms cubic-bezier(0.2, 0.9, 0.2, 1)",
    pointerEvents: "none",
  },
  tabText: { font: `600 11.5px ${font.sans}` },
};
