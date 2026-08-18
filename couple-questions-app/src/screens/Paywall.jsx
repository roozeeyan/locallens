import React, { useState } from "react";
import { c, font } from "../theme.js";
import { Button, Iso, Label } from "../ui.jsx";
import { useStore, actions } from "../store.js";
import { PRICE_STARS, lockedQuestionCount } from "../limits.js";
import { buyPremium, isRemote } from "../backend.js";

const PERKS = [
  "Все 11 блоков вместо трёх",
  "Сколько угодно связей — партнёры и кандидаты",
  "Разбор от ИИ по каждой связи",
  "Все темы оформления",
  "Новые колоды по мере выхода",
];

export default function Paywall({ onClose, reason }) {
  const profile = useStore((s) => s.profile);
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
      setNote("Покупка отменена");
    } else if (res.reason === "local") {
      setNote("Оплата включится, когда подключим сервер и бота.");
    } else {
      setNote("Не получилось открыть оплату. Попробуйте ещё раз.");
    }
  };

  return (
    <div style={wrap}>
      <button onClick={onClose} style={close} aria-label="Закрыть">
        ✕
      </button>

      <div style={body}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Iso size={92} />
        </div>

        <h1 style={h1}>
          {reason === "connections"
            ? "Добавляйте сколько угодно людей"
            : `Ещё ${locked} ${plural(locked, "вопрос", "вопроса", "вопросов")} впереди`}
        </h1>

        <p style={lede}>
          {reason === "connections"
            ? "Бесплатно доступна одна связь. Premium снимает ограничение — можно вести и партнёра, и кандидатов одновременно."
            : "Бесплатно открыты три блока. Остальные — про деньги, детей, конфликты и границы: то, из-за чего пары чаще всего расходятся, если не проговорили заранее."}
        </p>

        <div style={list}>
          {PERKS.map((t) => (
            <div key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={tick} />
              <span style={{ font: `400 14px/1.45 ${font.sans}`, color: c.ink }}>{t}</span>
            </div>
          ))}
        </div>

        <div style={priceCard}>
          <div>
            <div style={{ font: `700 15px ${font.sans}`, color: c.ink }}>Навсегда</div>
            <div style={{ font: `400 12px ${font.sans}`, color: c.mute }}>
              Разовая покупка, без подписки
            </div>
          </div>
          <div style={{ font: `700 22px ${font.serif}`, color: c.ink, whiteSpace: "nowrap" }}>
            {PRICE_STARS} ★
          </div>
        </div>

        <Button full onClick={buy} disabled={busy}>
          {busy ? "Открываем оплату…" : "Открыть доступ"}
        </Button>

        {note && (
          <p style={{ margin: 0, font: `600 13px ${font.sans}`, color: c.ink, textAlign: "center" }}>
            {note}
          </p>
        )}

        {!isRemote && (
          <div style={devBox}>
            <Label>Режим разработки</Label>
            <p style={{ margin: 0, font: `400 13px/1.45 ${font.sans}`, color: c.ink }}>
              Оплата подключается вместе с сервером. Чтобы посмотреть, как выглядит
              приложение с Premium, можно включить его вручную.
            </p>
            <Button
              full
              variant="secondary"
              onClick={() => {
                actions.setProfile({ premium: true });
                onClose();
              }}
            >
              Включить Premium локально
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
  inset: 0,
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
