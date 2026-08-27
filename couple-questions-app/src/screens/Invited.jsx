import React, { useEffect, useState } from "react";
import { c, font } from "../theme.js";
import { screenHeight, screenTop, lockScroll } from "../viewport.js";
import { Button, Iso } from "../ui.jsx";
import { actions } from "../store.js";
import { ensureSession, inviteInfo } from "../sync.js";
import Legal from "./Legal.jsx";

// Вход по приглашению.
//
// Человек пришёл по ссылке от близкого: он не искал приложение и ничего
// о нём не знает. Ему не нужно выбирать темы — их выбрал позвавший, — ни
// оформление, ни ритм напоминаний. Ему нужны четыре факта и первый вопрос.
// Поэтому здесь два шага вместо тринадцати.

const T = {
  ru: {
    from: (name) => `${name} зовёт вас пройти анкету вместе`,
    fromUnknown: "Вас позвали пройти анкету вместе",
    facts: [
      "119 вопросов про деньги, близость, детей и границы — то, о чём обычно не доходит поговорить.",
      "Отвечает каждый сам, со своего телефона. Можно понемногу: хоть по три вопроса в вечер.",
      "Ваш ответ откроется другому только когда он ответит на тот же вопрос сам. И наоборот.",
      "Любую тему можно скрыть, а все свои ответы — стереть насовсем.",
    ],
    next: "Дальше",
    ready: "Как к вам обращаться?",
    readyNote: "Имя увидит только тот, кто вас позвал.",
    namePlaceholder: "Имя",
    consent: "Мне есть 18 лет. Я принимаю соглашение и политику конфиденциальности.",
    terms: "Соглашение",
    privacy: "Конфиденциальность",
    start: "Начать отвечать",
    back: "Назад",
  },
  en: {
    from: (name) => `${name} invites you to answer together`,
    fromUnknown: "You have been invited to answer together",
    facts: [
      "119 questions about money, intimacy, children and boundaries — the things you never get around to.",
      "Each of you answers alone, on your own phone. A few questions an evening is fine.",
      "Your answer opens to the other person only once they answer the same question. And the other way round.",
      "Any topic can be hidden, and all your answers can be erased for good.",
    ],
    next: "Next",
    ready: "What should we call you?",
    readyNote: "Only the person who invited you will see it.",
    namePlaceholder: "Name",
    consent: "I am 18 or older. I accept the terms and the privacy policy.",
    terms: "Terms",
    privacy: "Privacy",
    start: "Start answering",
    back: "Back",
  },
};

export default function Invited({ code, lang = "ru", onDone }) {
  useEffect(lockScroll, []);

  const t = T[lang] || T.ru;
  const [step, setStep] = useState(0);
  const [inviter, setInviter] = useState("");
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [legal, setLegal] = useState(null);

  // Имя позвавшего — первое, что человек хочет увидеть. Если сервер
  // промолчит, обойдёмся без имени: это не повод останавливать вход.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureSession();
      const info = await inviteInfo(code);
      if (!cancelled && info?.inviter) setInviter(info.inviter);
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const finish = () => {
    actions.completeOnboarding({
      name: name.trim(),
      lang,
      consentAt: Date.now(),
      situation: "together",
      topics: [],
      reminder: "week",
      theme: "cream",
    });
    onDone?.();
  };

  return (
    <div style={wrap}>
      <div style={page}>
        {step === 0 ? (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
              <Iso size={92} />
            </div>
            <h1 style={h1}>{inviter ? t.from(inviter) : t.fromUnknown}</h1>

            <ul style={facts}>
              {t.facts.map((line) => (
                <li key={line} style={fact}>
                  <span style={bullet} />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div style={footer}>
              <Button full onClick={() => setStep(1)}>
                {t.next}
              </Button>
            </div>
          </>
        ) : (
          <>
            <button onClick={() => setStep(0)} style={back} aria-label={t.back}>
              ←
            </button>
            <h1 style={h1}>{t.ready}</h1>
            <p style={lede}>{t.readyNote}</p>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePlaceholder}
              style={input}
            />

            <button
              onClick={() => setAgreed((v) => !v)}
              style={consentRow}
              role="checkbox"
              aria-checked={agreed}
            >
              <span style={{ ...box, background: agreed ? c.sage : c.paper }}>
                {agreed ? "✓" : ""}
              </span>
              <span style={{ flex: 1, textAlign: "left" }}>{t.consent}</span>
            </button>

            <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
              <button onClick={() => setLegal("terms")} style={link}>
                {t.terms}
              </button>
              <button onClick={() => setLegal("privacy")} style={link}>
                {t.privacy}
              </button>
            </div>

            <div style={footer}>
              <Button full onClick={finish} disabled={!agreed || !name.trim()}>
                {t.start}
              </Button>
            </div>
          </>
        )}
      </div>

      {legal && <Legal lang={lang} initial={legal} onClose={() => setLegal(null)} />}
    </div>
  );
}

const wrap = {
  position: "fixed",
  top: screenTop,
  left: 0,
  right: 0,
  height: screenHeight,
  background: c.veil,
  display: "flex",
  flexDirection: "column",
  zIndex: 60,
};
const page = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  padding: "28px 20px calc(24px + env(safe-area-inset-bottom))",
  display: "flex",
  flexDirection: "column",
  maxWidth: 520,
  width: "100%",
  margin: "0 auto",
};
const h1 = {
  font: `700 29px/1.14 ${font.serif}`,
  letterSpacing: "-0.015em",
  color: c.ink,
  margin: "6px 0 0",
};
const lede = {
  margin: "10px 0 0",
  font: `400 15.5px/1.45 ${font.sans}`,
  color: c.mute,
};
const facts = {
  listStyle: "none",
  margin: "26px 0 0",
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};
const fact = {
  display: "flex",
  gap: 12,
  font: `400 15.5px/1.5 ${font.sans}`,
  color: c.ink,
};
const bullet = {
  width: 8,
  height: 8,
  marginTop: 8,
  flexShrink: 0,
  borderRadius: "50%",
  background: c.accent,
  border: `1.5px solid ${c.ink}`,
};
const input = {
  marginTop: 22,
  width: "100%",
  background: c.paper,
  border: `1.5px solid ${c.ink}`,
  borderRadius: 28,
  boxShadow: `0 2px 0 ${c.ink}`,
  padding: "14px 15px",
  font: `400 16px ${font.sans}`,
  color: c.ink,
};
const consentRow = {
  marginTop: 18,
  display: "flex",
  alignItems: "flex-start",
  gap: 11,
  background: "transparent",
  border: "none",
  padding: 0,
  font: `400 14.5px/1.45 ${font.sans}`,
  color: c.ink,
  cursor: "pointer",
};
const box = {
  width: 24,
  height: 24,
  flexShrink: 0,
  border: `1.5px solid ${c.ink}`,
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  font: `700 13px ${font.sans}`,
  color: c.ink,
};
const link = {
  background: "transparent",
  border: "none",
  padding: 0,
  font: `500 13.5px ${font.sans}`,
  color: c.mute,
  textDecoration: "underline",
  textUnderlineOffset: 3,
  cursor: "pointer",
};
const back = {
  width: 36,
  height: 36,
  flexShrink: 0,
  alignSelf: "flex-start",
  marginBottom: 12,
  background: c.paper,
  border: `1.5px solid ${c.ink}`,
  borderRadius: "50%",
  boxShadow: `0 2px 0 ${c.ink}`,
  font: "18px/1 sans-serif",
  color: c.ink,
  cursor: "pointer",
};
const footer = { marginTop: "auto", paddingTop: 28 };
