import React, { useEffect, useState } from "react";
import { screenHeight, screenTop } from "../viewport.js";

// Заставка при открытии приложения.
//
// Свет собран из наложенных радиальных градиентов и размыт: тёмное ядро
// цвета тёмного вина уходит через бордо в кремовый и гаснет пастельным
// голубым по краю — те же цвета, что и во всём приложении.
//
// Курсивная строка набрана латиницей намеренно: каллиграфических шрифтов
// такого рисунка с кириллицей не существует, а смысл несут строки под ней.

const FONTS = {
  mark: '"Archivo", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  script: '"Pinyon Script", "Snell Roundhand", cursive',
};

const COPY = {
  mark: "RELATIONSHIP GAME",
  kicker: "119 ВОПРОСОВ — RU + EN",
  script: "Know each other",
  blocks: [
    ["ВДВОЁМ", "КАЖДЫЙ ОТВЕЧАЕТ САМ", "СО СВОЕГО ТЕЛЕФОНА"],
    ["ЧЕСТНО", "ОТВЕТ ПАРТНЁРА ОТКРОЕТСЯ,", "КОГДА ОТВЕТИТЕ ВЫ"],
    ["ГЛУБОКО", "11 БЛОКОВ · 119 ВОПРОСОВ", "ОТ КОРНЕЙ ДО СВОБОДЫ"],
  ],
  footer: "РАЗГОВОР, КОТОРЫЙ ОБЫЧНО ОТКЛАДЫВАЮТ",
};

// Набор идёт посимвольно, паузы между строками считаются в тех же
// «символах» — так одна скорость управляет и печатью, и остановками.
const SPEED_MS = 8;
const GAP_LINE = 5;
const GAP_BLOCK = 14;
const GAP_FOOTER = 14;

const TYPED = [
  { text: COPY.kicker, gap: 18 },
  ...COPY.blocks.flatMap((lines, b) =>
    lines.map((text, i) => ({
      text,
      gap: i === 2 ? (b === 2 ? GAP_FOOTER : GAP_BLOCK) : GAP_LINE,
    }))
  ),
  { text: COPY.footer, gap: 0 },
];

const TOTAL = TYPED.reduce((sum, item) => sum + item.text.length + item.gap, 0);

const OFFSETS = TYPED.reduce((acc, item) => {
  const prev = acc[acc.length - 1];
  acc.push(prev === undefined ? 0 : prev + TYPED[acc.length - 1].text.length + TYPED[acc.length - 1].gap);
  return acc;
}, []);

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Сколько символов строки уже набрано. */
function shown(index, cursor) {
  const done = cursor - OFFSETS[index];
  if (done <= 0) return 0;
  return Math.min(done, TYPED[index].text.length);
}

export default function Splash({ leaving = false, onDone, onTyped }) {
  const instant = reduceMotion();
  const [cursor, setCursor] = useState(instant ? TOTAL : 0);

  // Курсивная строка и название не печатаются, а проявляются: печатная
  // машинка на каллиграфии выглядит неряшливо.
  const [shownHead, setShownHead] = useState(instant);

  useEffect(() => {
    if (instant) {
      onTyped?.();
      return undefined;
    }
    const head = setTimeout(() => setShownHead(true), 60);
    const id = setInterval(() => {
      setCursor((n) => {
        if (n >= TOTAL) {
          clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, SPEED_MS);
    return () => {
      clearTimeout(head);
      clearInterval(id);
    };
  }, [instant]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cursor >= TOTAL) onTyped?.();
  }, [cursor]); // eslint-disable-line react-hooks/exhaustive-deps

  const typing = (index) => {
    const done = shown(index, cursor);
    return done > 0 && done < TYPED[index].text.length;
  };

  return (
    <div
      style={{ ...wrap, opacity: leaving ? 0 : 1 }}
      onClick={onDone}
      role="button"
      aria-label="Пропустить заставку"
    >
      <div style={aura} aria-hidden="true" />
      <div style={grain} aria-hidden="true" />

      <div style={content}>
        <div style={{ ...mark, ...fade(shownHead, 0) }}>{COPY.mark}</div>

        <div style={kicker}>
          {TYPED[0].text.slice(0, shown(0, cursor))}
          {typing(0) && <Caret />}
        </div>

        <div style={{ ...scriptLine, ...fade(shownHead, 260) }}>{COPY.script}</div>

        <div style={blocks}>
          {COPY.blocks.map((lines, b) => (
            <div key={lines[0]} style={block}>
              {lines.map((line, i) => {
                const index = 1 + b * 3 + i;
                return (
                  <div key={line} style={i === 0 ? blockHead : blockLine}>
                    {line.slice(0, shown(index, cursor))}
                    {typing(index) && <Caret />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={footer}>
          {COPY.footer.slice(0, shown(TYPED.length - 1, cursor))}
          {typing(TYPED.length - 1) && <Caret />}
        </div>
      </div>
    </div>
  );
}

function Caret() {
  return <span style={caret} aria-hidden="true" />;
}

/** Плавное проявление: непечатаемые строки не должны возникать рывком. */
function fade(on, delayMs) {
  return {
    opacity: on ? 1 : 0,
    transform: on ? "none" : "translateY(4px)",
    transition: `opacity 520ms ease ${delayMs}ms, transform 520ms ease ${delayMs}ms`,
  };
}

const caret = {
  display: "inline-block",
  width: "0.55em",
  height: "1em",
  marginLeft: 1,
  verticalAlign: "-0.12em",
  background: "currentColor",
  opacity: 0.75,
};

const wrap = {
  position: "fixed",
  top: screenTop,
  left: 0,
  right: 0,
  height: screenHeight,
  overflow: "hidden",
  background: "linear-gradient(180deg, #DFE4E5 0%, #D3DADC 50%, #DADEDE 100%)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  zIndex: 60,
  transition: "opacity 380ms ease",
};

// Ядро свечения смещено вверх, как в референсе: текст ложится на самую
// тёмную часть, а свет расходится к краям кадра.
const aura = {
  position: "absolute",
  inset: "5% 11% 4%",
  borderRadius: "26% / 12%",
  background: [
    "radial-gradient(66% 50% at 50% 44%, #100A09 0%, #170F0D 44%, rgba(23,15,13,0) 78%)",
    "radial-gradient(82% 66% at 50% 52%, #2E1815 0%, rgba(46,24,21,0.9) 48%, rgba(46,24,21,0) 84%)",
    "radial-gradient(96% 84% at 50% 60%, #61291F 0%, rgba(97,41,31,0.7) 52%, rgba(97,41,31,0) 88%)",
    "radial-gradient(112% 100% at 50% 70%, #9A5233 0%, rgba(154,82,51,0.42) 54%, rgba(154,82,51,0) 92%)",
  ].join(", "),
  filter: "blur(52px)",
};

// Тонкая крупа поверх свечения: без неё градиент выглядит слишком гладким.
const grain = {
  position: "absolute",
  inset: 0,
  opacity: 0.16,
  mixBlendMode: "overlay",
  backgroundImage:
    "radial-gradient(rgba(255,255,255,0.55) 0.6px, transparent 0.7px), radial-gradient(rgba(0,0,0,0.45) 0.6px, transparent 0.7px)",
  backgroundSize: "3px 3px, 4px 4px",
  backgroundPosition: "0 0, 1px 2px",
};

// В референсе весь набор занимает нижнюю треть кадра и держится плотно:
// мелкий кегль, короткие интервалы, между блоками — одна пустая строка.
const content = {
  position: "relative",
  width: "100%",
  maxWidth: 360,
  // Отступ снизу считаем от высоты кадра: проценты в padding берутся
  // от ширины, и на телефоне стек уезжал бы вниз.
  padding: "0 24px",
  paddingBottom: "calc(var(--rg-vh, 100vh) * 0.13)",
  textAlign: "center",
  color: "#F2EEE7",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const mark = {
  fontFamily: FONTS.mark,
  fontWeight: 600,
  fontSize: 15,
  letterSpacing: "0.3em",
  textIndent: "0.3em",
  lineHeight: 1,
  whiteSpace: "nowrap",
};

const kicker = {
  minHeight: "1.2em",
  marginTop: 13,
  fontFamily: FONTS.mono,
  fontWeight: 400,
  fontSize: 11.5,
  letterSpacing: "0.1em",
  color: "#E7E0D6",
};

const scriptLine = {
  fontFamily: FONTS.script,
  fontSize: 41,
  whiteSpace: "nowrap",
  lineHeight: 1.2,
  color: "#F6F2EA",
  textShadow: "0 1px 18px rgba(0,0,0,0.35)",
};

const blocks = {
  marginTop: 4,
  display: "flex",
  flexDirection: "column",
  gap: 15,
};

const block = { display: "flex", flexDirection: "column" };

const blockHead = {
  minHeight: "1.55em",
  fontFamily: FONTS.mono,
  fontWeight: 500,
  fontSize: 11.5,
  lineHeight: 1.55,
  letterSpacing: "0.14em",
  color: "#F2EEE7",
};

const blockLine = {
  minHeight: "1.55em",
  fontFamily: FONTS.mono,
  fontWeight: 400,
  fontSize: 11.5,
  lineHeight: 1.55,
  letterSpacing: "0.05em",
  color: "#D6CEC4",
};

const footer = {
  minHeight: "1.3em",
  marginTop: 17,
  fontFamily: FONTS.mono,
  fontWeight: 400,
  fontSize: 11,
  letterSpacing: "0.05em",
  color: "#C8C0B5",
};
