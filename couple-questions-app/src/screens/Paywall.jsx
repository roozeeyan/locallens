import React, { useEffect, useState } from "react";
import { c, font } from "../theme.js";
import { screenHeight, screenTop, lockScroll } from "../viewport.js";
import { Button, Iso, Label } from "../ui.jsx";
import { useStore, actions } from "../store.js";
import { PRICE_STARS, lockedQuestionCount } from "../limits.js";
import { buyPremium, isRemote } from "../backend.js";

const T = {
  ru: {
    perks: [
      "Открывается обоим — платит один",
      "Все 11 блоков вместо трёх",
      "Сколько угодно связей — партнёры, кандидаты, друзья",
      "Разбор от ИИ по каждой связи",
      "Все темы оформления",
    ],
    close: "Закрыть",
    titleConnections: "Добавляйте сколько угодно людей",
    titleBlocks: (n) => `Ещё ${n} ${plural(n, "вопрос", "вопроса", "вопросов")} впереди`,
    titleWaiting: (name, n) =>
      `${name} ответил на ${n} ${plural(n, "вопрос", "вопроса", "вопросов")}`,
    ledeWaiting: (name) =>
      `Эти ответы уже лежат и ждут вас. Откройте — и они станут видны обоим: ${name} платить не придётся.`,
    ledeConnections:
      "Бесплатно доступна одна связь. Premium снимает ограничение — можно вести и партнёра, и кандидатов одновременно.",
    ledeBlocks:
      "Бесплатно открыты три блока. Остальные — про деньги, детей, конфликты и границы: то, из-за чего пары чаще всего расходятся, если не проговорили заранее.",
    forever: "Навсегда, для двоих",
    oneTime: "Разовая покупка. Открывается и партнёру",
    buy: "Открыть для нас двоих",
    opening: "Открываем оплату…",
    cancelled: "Покупка отменена",
    localPay: "Оплата включится, когда подключим сервер и бота.",
    payFailed: "Не получилось открыть оплату. Попробуйте ещё раз.",
    devMode: "Режим разработки",
    devNote:
      "Оплата подключается вместе с сервером. Чтобы посмотреть, как выглядит приложение с Premium, можно включить его вручную.",
    devCta: "Включить Premium локально",
  },
  en: {
    perks: [
      "Opens for both of you — only one pays",
      "All 11 blocks instead of three",
      "As many connections as you like — partners, candidates, friends",
      "An AI summary for every connection",
      "All appearance themes",
    ],
    close: "Close",
    titleConnections: "Add as many people as you like",
    titleBlocks: (n) => `${n} more ${n === 1 ? "question" : "questions"} ahead`,
    titleWaiting: (name, n) => `${name} answered ${n} ${n === 1 ? "question" : "questions"}`,
    ledeWaiting: (name) =>
      `Those answers are already waiting for you. Unlock, and both of you see them: ${name} pays nothing.`,
    ledeConnections:
      "One connection is free. Premium removes the limit — you can keep a partner and candidates at the same time.",
    ledeBlocks:
      "Three blocks are free. The rest are about money, children, conflict and boundaries: the things couples most often break up over when they never talked them through.",
    forever: "Forever, for both",
    oneTime: "One-time purchase. Your partner gets it too",
    buy: "Unlock for both of us",
    opening: "Opening payment…",
    cancelled: "Purchase cancelled",
    localPay: "Payment turns on once the server and the bot are connected.",
    payFailed: "Could not open payment. Please try again.",
    devMode: "Development mode",
    devNote:
      "Payment arrives together with the server. To see how the app looks with Premium, you can switch it on manually.",
    devCta: "Enable Premium locally",
  },
};

/** Связь, у которой больше всего неоткрытых ответов. */
function mostAnswers(connections = []) {
  let best = null;
  for (const conn of connections) {
    const n = Object.values(conn.blockCounts || {}).reduce((sum, x) => sum + x, 0);
    if (n > 0 && (!best || n > best.n)) best = { name: conn.name, n };
  }
  return best;
}

export default function Paywall({ onClose, reason }) {
  useEffect(lockScroll, []);

  const { profile, connections } = useStore();
  const t = T[profile.lang === "en" ? "en" : "ru"];
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const locked = lockedQuestionCount(profile, connections);

  // Самый сильный довод — не список возможностей, а конкретный человек,
  // чьи ответы уже написаны и лежат за закрытой дверью.
  const waiting = mostAnswers(connections);

  const buy = async () => {
    setBusy(true);
    setNote("");
    const res = await buyPremium();
    setBusy(false);

    if (res.ok) {
      actions.setProfile({ premium: true });
      onClose();
    } else if (res.reason === "cancelled") {
      setNote(t.cancelled);
    } else if (res.reason === "local") {
      setNote(t.localPay);
    } else {
      setNote(t.payFailed);
    }
  };

  return (
    <div style={wrap}>
      <button onClick={onClose} style={close} aria-label={t.close}>
        ✕
      </button>

      <div style={body}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Iso size={92} />
        </div>

        <h1 style={h1}>
          {waiting
            ? t.titleWaiting(waiting.name, waiting.n)
            : reason === "connections"
              ? t.titleConnections
              : t.titleBlocks(locked)}
        </h1>

        <p style={lede}>
          {waiting
            ? t.ledeWaiting(waiting.name)
            : reason === "connections"
              ? t.ledeConnections
              : t.ledeBlocks}
        </p>

        <div style={list}>
          {t.perks.map((perk) => (
            <div key={perk} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={tick} />
              <span style={{ font: `400 14px/1.45 ${font.sans}`, color: c.ink }}>{perk}</span>
            </div>
          ))}
        </div>

        <div style={priceCard}>
          <div>
            <div style={{ font: `700 15px ${font.sans}`, color: c.ink }}>{t.forever}</div>
            <div style={{ font: `400 12px ${font.sans}`, color: c.mute }}>
              {t.oneTime}
            </div>
          </div>
          <div style={{ font: `700 22px ${font.serif}`, color: c.ink, whiteSpace: "nowrap" }}>
            {PRICE_STARS} ★
          </div>
        </div>

        <Button full onClick={buy} disabled={busy}>
          {busy ? t.opening : t.buy}
        </Button>

        {note && (
          <p style={{ margin: 0, font: `600 13px ${font.sans}`, color: c.ink, textAlign: "center" }}>
            {note}
          </p>
        )}

        {!isRemote && (
          <div style={devBox}>
            <Label>{t.devMode}</Label>
            <p style={{ margin: 0, font: `400 13px/1.45 ${font.sans}`, color: c.ink }}>
              {t.devNote}
            </p>
            <Button
              full
              variant="secondary"
              onClick={() => {
                actions.setProfile({ premium: true });
                onClose();
              }}
            >
              {t.devCta}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function plural(n, one, few, many) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
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
  zIndex: 50,
  overflowY: "auto",
};
const close = {
  position: "absolute",
  top: 14,
  left: 14,
  width: 34,
  height: 34,
  background: c.paper,
  border: `1.5px solid ${c.ink}`,
  borderRadius: "50%",
  boxShadow: `0 2px 0 ${c.ink}`,
  font: "13px/1 sans-serif",
  color: c.ink,
  cursor: "pointer",
  zIndex: 35,
};
const body = {
  maxWidth: 520,
  margin: "0 auto",
  padding: "62px 20px calc(28px + env(safe-area-inset-bottom))",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};
const h1 = {
  font: `700 27px/1.12 ${font.serif}`,
  letterSpacing: "-0.01em",
  color: c.ink,
  margin: 0,
  textAlign: "center",
};
const lede = {
  margin: 0,
  font: `400 14.5px/1.5 ${font.sans}`,
  color: c.mute,
  textAlign: "center",
};
const list = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  background: c.paper,
  border: `1.5px solid ${c.ink}`,
  borderRadius: 32,
  boxShadow: `0 2px 0 ${c.ink}`,
  padding: 16,
};
const tick = {
  width: 14,
  height: 14,
  marginTop: 3,
  flexShrink: 0,
  borderRadius: 8,
  background: c.sage,
  border: `1.5px solid ${c.ink}`,
};
const priceCard = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  background: c.paper,
  border: `1.5px solid ${c.ink}`,
  borderRadius: 32,
  boxShadow: `0 2px 0 ${c.ink}`,
  padding: "14px 16px",
};
const devBox = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  border: `2px dashed ${c.mute}`,
  borderRadius: 28,
  padding: 14,
};
