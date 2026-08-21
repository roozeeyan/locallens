import React, { useState } from "react";
import { c, font } from "../theme.js";
import { screenHeight } from "../viewport.js";
import { Button, Iso, Label } from "../ui.jsx";
import { useStore, actions } from "../store.js";
import { PRICE_STARS, lockedQuestionCount } from "../limits.js";
import { buyPremium, isRemote } from "../backend.js";

const T = {
  ru: {
    perks: [
      "Все 11 блоков вместо трёх",
      "Сколько угодно связей — партнёры и кандидаты",
      "Разбор от ИИ по каждой связи",
      "Все темы оформления",
      "Новые колоды по мере выхода",
    ],
    close: "Закрыть",
    titleConnections: "Добавляйте сколько угодно людей",
    titleBlocks: (n) => `Ещё ${n} ${plural(n, "вопрос", "вопроса", "вопросов")} впереди`,
    ledeConnections:
      "Бесплатно доступна одна связь. Premium снимает ограничение — можно вести и партнёра, и кандидатов одновременно.",
    ledeBlocks:
      "Бесплатно открыты три блока. Остальные — про деньги, детей, конфликты и границы: то, из-за чего пары чаще всего расходятся, если не проговорили заранее.",
    forever: "Навсегда",
    oneTime: "Разовая покупка, без подписки",
    buy: "Открыть доступ",
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
      "All 11 blocks instead of three",
      "As many connections as you like — partners and candidates",
      "An AI summary for every connection",
      "All appearance themes",
      "New decks as they are released",
    ],
    close: "Close",
    titleConnections: "Add as many people as you like",
    titleBlocks: (n) => `${n} more ${n === 1 ? "question" : "questions"} ahead`,
    ledeConnections:
      "One connection is free. Premium removes the limit — you can keep a partner and candidates at the same time.",
    ledeBlocks:
      "Three blocks are free. The rest are about money, children, conflict and boundaries: the things couples most often break up over when they never talked them through.",
    forever: "Forever",
    oneTime: "One-time purchase, no subscription",
    buy: "Unlock access",
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

export default function Paywall({ onClose, reason }) {
  const profile = useStore((s) => s.profile);
  const t = T[profile.lang === "en" ? "en" : "ru"];
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const locked = lockedQuestionCount(profile);

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
          {reason === "connections"
            ? t.titleConnections
            : t.titleBlocks(locked)}
        </h1>

        <p style={lede}>
          {reason === "connections"
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
  top: 0,
  left: 0,
  right: 0,
  height: screenHeight,
  background: c.bg,
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
  border: `2px solid ${c.ink}`,
  borderRadius: "50%",
  boxShadow: `0 2px 0 ${c.ink}`,
  font: "13px/1 sans-serif",
  color: c.ink,
  cursor: "pointer",
  zIndex: 1,
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
  border: `2px solid ${c.ink}`,
  borderRadius: 16,
  boxShadow: `0 3px 0 ${c.ink}`,
  padding: 16,
};
const tick = {
  width: 14,
  height: 14,
  marginTop: 3,
  flexShrink: 0,
  borderRadius: 4,
  background: c.sage,
  border: `2px solid ${c.ink}`,
};
const priceCard = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  background: c.paper,
  border: `2px solid ${c.ink}`,
  borderRadius: 16,
  boxShadow: `0 3px 0 ${c.ink}`,
  padding: "14px 16px",
};
const devBox = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  border: `2px dashed ${c.mute}`,
  borderRadius: 14,
  padding: 14,
};
