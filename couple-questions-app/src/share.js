import { palettes, DEFAULT_PALETTE } from "./theme.js";

const W = 1080;
const H = 1920;

const SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif';
const SANS = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';

function wrap(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}


/** Относительная яркость hex-цвета, 0..1. */
function luminance(hex) {
  const v = hex.replace("#", "");
  const n = v.length === 3 ? v.split("").map((x) => x + x) : v.match(/../g);
  const [r, g, b] = n.map((x) => parseInt(x, 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Из двух цветов берёт тот, что заметнее на данном фоне. */
function onColor(bg, a, b) {
  const l = luminance(bg);
  return Math.abs(luminance(a) - l) >= Math.abs(luminance(b) - l) ? a : b;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Рисует карточку вопроса под сторис. Возвращает Blob с PNG. */
export function renderStoryCard(questionText, themeId = DEFAULT_PALETTE) {
  const p = palettes[themeId] || palettes[DEFAULT_PALETTE];
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, W, H);

  const cardX = 110;
  const cardW = W - 220;

  ctx.font = `600 74px ${SERIF}`;
  const lines = wrap(ctx, questionText, cardW - 130);
  const lineH = 100;
  const cardH = lines.length * lineH + 210;
  const cardY = Math.max(220, (H - cardH) / 2 - 110);

  // Коралловая подложка из точек — выглядывает из-под карточки справа и снизу.
  ctx.fillStyle = p.warm;
  for (let y = cardY + 60; y < cardY + cardH + 46; y += 26) {
    for (let x = cardX + 60; x < cardX + cardW + 46; x += 26) {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = p.paper;
  roundRect(ctx, cardX, cardY, cardW, cardH, 48);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = p.ink;
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = p.mute;
  ctx.font = `600 30px ${SANS}`;
  ctx.fillText("ВОПРОС ДЛЯ ПАРЫ", cardX + 65, cardY + 95);

  ctx.fillStyle = p.ink;
  ctx.font = `600 74px ${SERIF}`;
  lines.forEach((l, i) => {
    ctx.fillText(l, cardX + 65, cardY + 200 + i * lineH);
  });

  // Подпись внизу.
  ctx.fillStyle = p.accent;
  roundRect(ctx, cardX, H - 330, cardW, 132, 66);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = p.ink;
  ctx.stroke();

  ctx.fillStyle = onColor(p.accent, p.ink, p.bg);
  ctx.font = `700 44px ${SANS}`;
  ctx.textAlign = "center";
  ctx.fillText("Relationship Game", W / 2, H - 246);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/**
 * Отдаёт карточку пользователю: системным «Поделиться», если оно есть,
 * иначе — обычным скачиванием.
 */
export async function shareQuestion(questionText, themeId) {
  const blob = await renderStoryCard(questionText, themeId);
  if (!blob) return { ok: false };

  const file = new File([blob], "question.png", { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return { ok: true, via: "share" };
    } catch (e) {
      if (e?.name === "AbortError") return { ok: false, via: "cancelled" };
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "question.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return { ok: true, via: "download" };
}
