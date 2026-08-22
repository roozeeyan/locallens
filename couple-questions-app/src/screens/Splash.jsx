import React from "react";
import { screenHeight, screenTop } from "../viewport.js";

// Заставка при открытии приложения.
//
// Свет собран из наложенных радиальных градиентов и размыт: тёмное ядро
// цвета тёмного вина уходит через бордо в кремовый и гаснет пастельным
// голубым по краю — те же цвета, что и во всём приложении.
//
// Курсивная строка набрана латиницей намеренно: каллиграфических шрифтов
// такого рисунка с кириллицей не существует. Вариант `script="ru"`
// показывает кириллический рукописный шрифт — рисунок другой, мягче.

const FONTS = {
  mark: '"Archivo", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  scriptEn: '"Pinyon Script", "Snell Roundhand", cursive',
  scriptRu: '"Marck Script", cursive',
};

const COPY = {
  mark: "RELATIONSHIP GAME",
  kicker: "119 ВОПРОСОВ — RU + EN",
  script: { en: "Know each other", ru: "Узнать друг друга" },
  blocks: [
    ["ВДВОЁМ", "КАЖДЫЙ ОТВЕЧАЕТ САМ", "СО СВОЕГО ТЕЛЕФОНА"],
    ["ЧЕСТНО", "ОТВЕТ ПАРТНЁРА ОТКРОЕТСЯ,", "КОГДА ОТВЕТИТЕ ВЫ"],
    ["ГЛУБОКО", "11 БЛОКОВ · 119 ВОПРОСОВ", "ОТ КОРНЕЙ ДО СВОБОДЫ"],
  ],
  footer: "РАЗГОВОР, КОТОРЫЙ ОБЫЧНО ОТКЛАДЫВАЮТ",
};

export default function Splash({ script = "en", onDone }) {
  return (
    <div style={wrap} onClick={onDone}>
      <div style={aura} aria-hidden="true" />
      <div style={grain} aria-hidden="true" />

      <div style={content}>
        <div style={mark}>{COPY.mark}</div>
        <div style={kicker}>{COPY.kicker}</div>

        <div
          style={{
            ...scriptLine,
            // Кириллический рукописный шире латинской каллиграфии,
            // поэтому кегль под него свой.
            fontFamily: script === "ru" ? FONTS.scriptRu : FONTS.scriptEn,
            fontSize: script === "ru" ? 31 : 41,
            marginTop: script === "ru" ? 6 : 0,
            marginBottom: script === "ru" ? 4 : 0,
          }}
        >
          {COPY.script[script] || COPY.script.en}
        </div>

        <div style={blocks}>
          {COPY.blocks.map((lines) => (
            <div key={lines[0]} style={block}>
              {lines.map((line, i) => (
                <div key={line} style={i === 0 ? blockHead : blockLine}>
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={footer}>{COPY.footer}</div>
      </div>
    </div>
  );
}

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
  marginTop: 13,
  fontFamily: FONTS.mono,
  fontWeight: 400,
  fontSize: 11.5,
  letterSpacing: "0.1em",
  color: "#E7E0D6",
};

const scriptLine = {
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
  fontFamily: FONTS.mono,
  fontWeight: 500,
  fontSize: 11.5,
  lineHeight: 1.55,
  letterSpacing: "0.14em",
  color: "#F2EEE7",
};

const blockLine = {
  fontFamily: FONTS.mono,
  fontWeight: 400,
  fontSize: 11.5,
  lineHeight: 1.55,
  letterSpacing: "0.05em",
  color: "#D6CEC4",
};

const footer = {
  marginTop: 17,
  fontFamily: FONTS.mono,
  fontWeight: 400,
  fontSize: 11,
  letterSpacing: "0.05em",
  color: "#C8C0B5",
};
