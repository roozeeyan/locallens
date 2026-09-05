// Разбор приходит от модели размеченным текстом: заголовки, списки,
// выделения. Раньше мы печатали его строка-в-строку, и человек видел
// на экране звёздочки и дефисы вместо документа. Здесь минимальный
// разбор разметки — ровно те приёмы, которыми модель пользуется.
import React from "react";
import { c, font } from "./theme.js";

/** Жирное и курсивное внутри строки. Возвращает готовые узлы React. */
function inline(text, keyBase) {
  const out = [];
  // Без lookbehind: старые Safari на нём падают с синтаксической ошибкой,
  // а это уронило бы весь экран, а не только выделение.
  const re = /\*\*(.+?)\*\*|__(.+?)__|_([^\s_][^_]*?)_/g;
  let last = 0;
  let m;
  let n = 0;

  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const bold = m[1] ?? m[2];
    if (bold != null) {
      out.push(
        <strong key={`${keyBase}b${n++}`} style={{ fontWeight: 700 }}>
          {bold}
        </strong>
      );
    } else {
      out.push(
        <em key={`${keyBase}i${n++}`} style={{ fontStyle: "italic" }}>
          {m[3]}
        </em>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length ? out : text;
}

const BULLET = /^\s*([-*•–—]|\d+[.)])\s+/;

// Модель разделяет слова узкими неразрывными пробелами — их в тексте
// оказалось больше половины. Браузеру запрещено переносить по такому
// пробелу, поэтому полстроки склеивается в одно «слово», не помещается
// в экран и утаскивает вбок всю страницу. Приводим к обычным пробелам
// до разбора: приложение не должно ломаться от того, как модель набрала
// текст.
const NO_BREAK = /[\u00A0\u2007\u202F\u2060\uFEFF]/g;

/** Строки → блоки. Соседние обычные строки склеиваются в один абзац. */
function parse(text) {
  const lines = String(text || "")
    .replace(/\r/g, "")
    .replace(NO_BREAK, " ")
    .split("\n");
  const blocks = [];
  let para = [];

  const flush = () => {
    if (para.length) blocks.push({ kind: "p", text: para.join(" ") });
    para = [];
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    const bare = line.trim();

    if (!bare) {
      flush();
      continue;
    }
    if (/^([-*_])\1{2,}$/.test(bare)) {
      flush();
      blocks.push({ kind: "hr" });
      continue;
    }

    const head = bare.match(/^(#{1,6})\s+(.*)$/);
    if (head) {
      flush();
      blocks.push({ kind: "h", level: head[1].length, text: head[2] });
      continue;
    }

    // Модель часто делает заголовком просто жирную строку целиком.
    const fat = bare.match(/^\*\*(.+?)\*\*[:：]?$/);
    if (fat) {
      flush();
      blocks.push({ kind: "h", level: 3, text: fat[1] });
      continue;
    }

    if (bare.startsWith("> ")) {
      flush();
      blocks.push({ kind: "quote", text: bare.slice(2) });
      continue;
    }

    const li = line.match(BULLET);
    if (li) {
      flush();
      const indent = (line.match(/^\s*/) || [""])[0].length;
      blocks.push({
        kind: "li",
        deep: indent >= 2,
        marker: /\d/.test(li[1]) ? li[1] : "•",
        text: line.slice(li[0].length),
      });
      continue;
    }

    para.push(bare);
  }
  flush();
  return blocks;
}

/**
 * Показывает размеченный текст. Размеры подобраны под карточку разбора:
 * заголовки заметно крупнее строк, но не кричат.
 */
export function RichText({ text, size = 14 }) {
  const blocks = parse(text);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 0, overflowWrap: "anywhere" }}>
      {blocks.map((b, i) => {
        if (b.kind === "hr") {
          return (
            <div
              key={i}
              style={{ height: 1.5, background: c.ink, opacity: 0.15, margin: "3px 0" }}
            />
          );
        }
        if (b.kind === "h") {
          return (
            <div
              key={i}
              style={{
                font: `700 ${b.level <= 2 ? size + 2.5 : size + 0.5}px/1.35 ${font.sans}`,
                color: c.ink,
                marginTop: i === 0 ? 0 : 7,
              }}
            >
              {inline(b.text, i)}
            </div>
          );
        }
        if (b.kind === "quote") {
          return (
            <div
              key={i}
              style={{
                borderLeft: `2.5px solid ${c.ink}`,
                paddingLeft: 10,
                font: `400 ${size - 0.5}px/1.55 ${font.sans}`,
                color: c.ink,
                opacity: 0.85,
              }}
            >
              {inline(b.text, i)}
            </div>
          );
        }
        if (b.kind === "li") {
          return (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 7,
                paddingLeft: b.deep ? 16 : 0,
                font: `400 ${size}px/1.55 ${font.sans}`,
                color: c.ink,
              }}
            >
              <span style={{ opacity: 0.55, flexShrink: 0 }}>{b.marker}</span>
              <span style={{ minWidth: 0 }}>{inline(b.text, i)}</span>
            </div>
          );
        }
        return (
          <p key={i} style={{ margin: 0, font: `400 ${size}px/1.6 ${font.sans}`, color: c.ink }}>
            {inline(b.text, i)}
          </p>
        );
      })}
    </div>
  );
}
