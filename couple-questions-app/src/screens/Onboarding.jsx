import React, { useEffect, useState } from "react";
import { c, font, palettes, applyPalette } from "../theme.js";
import { screenHeight, screenTop, lockScroll } from "../viewport.js";
import { Button, Progress, Iso } from "../ui.jsx";
import { actions, CATEGORIES, setTitle } from "../store.js";
import { PAIR_ONLY } from "../access.js";
import Legal from "./Legal.jsx";

const T = {
  ru: {
    langTitle: "Выберите язык",
    langNote: "Язык всего приложения — вопросов, кнопок и подсказок. Можно поменять в профиле.",
    coverTitle: "Поговорить о том, что обычно откладывают",
    coverBody:
      "119 вопросов про деньги, близость, детей и границы. Каждый отвечает сам, со своего телефона, — а потом вы видите, где сходитесь и о чём стоит поговорить.",
    start: "Начать",
    consentTitle: "Прежде чем начать",
    consentBody:
      "Вопросы касаются близости, денег и семейных конфликтов. Сервис для совершеннолетних.",
    consentCheck: "Мне есть 18 лет. Я принимаю соглашение и политику конфиденциальности.",
    terms: "Соглашение",
    privacy: "Конфиденциальность",
    agree: "Согласен, дальше",
    situationTitle: "С чего начнём?",
    situations: [
      { id: "together", label: "Мы вместе", note: "Пара, брак, отношения" },
      { id: "engaged", label: "Готовимся к свадьбе", note: "Помолвка, скоро съезжаемся" },
      { id: "choosing", label: "Присматриваюсь", note: "Есть кандидаты, хочу разобраться" },
    ],
    togetherTitle: "Как давно вы вместе?",
    together: [
      { id: "new", label: "Меньше полугода" },
      { id: "year", label: "Около года" },
      { id: "few", label: "Два–пять лет" },
      { id: "long", label: "Больше пяти лет" },
    ],
    topicsTitle: "Что важнее обсудить?",
    topicsNote: "Выберите одно или несколько — с них начнём анкету.",
    next: "Дальше",
    p1Title: "Каждый отвечает сам, со своего телефона",
    p1Body:
      "Никто не подсматривает и не подстраивается. Вы видите, насколько заполнена анкета у другого — но не сами ответы.",
    p2Title: "Ответы открываются только по взаимности",
    p2Body:
      "Ответ другого человека вы увидите, когда ответите на тот же вопрос сами. Это правило работает на уровне базы данных, а не просто в интерфейсе.",
    got: "Понятно",
    reminderTitle: "Как часто напоминать?",
    reminderNote:
      "Разговор вдвоём — не ежедневная привычка. Лучше редко, но по-настоящему.",
    reminders: [
      { id: "twice", label: "Два раза в неделю" },
      { id: "week", label: "Раз в неделю", note: "Спокойный ритм, хватает на разговор" },
      { id: "off", label: "Без напоминаний" },
    ],
    themeTitle: "Выберите оформление",
    themeNote: "Потом можно поменять в профиле.",
    demoTitle: "Так это выглядит",
    demoNote: "Когда вы оба ответили, ответы встают рядом.",
    demoQuestion: "Как ты понимаешь слово «верность»?",
    demoYou: "Вы",
    demoName: "Владимир",
    demoMine: "Что мы выбираем друг друга каждый день.",
    demoTheirs: "Верность — это про выбор, а не про запрет.",
    demoTags: ["Совпадаем", "Обсудить", "Расходимся"],
    nameTitle: "Как вас зовут?",
    nameNote: "Имя увидят только те, кого вы сами добавите.",
    namePlaceholder: "Имя",
    done: "Перейти к анкете",
    inviteTitle: "Позовите второго",
    inviteBody:
      "Ответы открываются только по взаимности — значит, одному здесь делать нечего. Отправьте ссылку тому, с кем собираетесь отвечать.",
    inviteCta: "Пригласить партнёра",
    inviteLater: "Сначала посмотрю сам",
    back: "Назад",
  },
  en: {
    langTitle: "Choose your language",
    langNote:
      "This sets the language of the whole app — questions, buttons and hints. You can change it in your profile.",
    coverTitle: "Talk about what usually gets postponed",
    coverBody:
      "119 questions about money, intimacy, children and boundaries. Each of you answers alone, on your own phone — then you see where you agree and what is worth talking about.",
    start: "Start",
    consentTitle: "Before we begin",
    consentBody:
      "The questions touch on intimacy, money and family conflict. This service is for adults.",
    consentCheck: "I am 18 or older. I accept the terms and the privacy policy.",
    terms: "Terms",
    privacy: "Privacy",
    agree: "I agree, continue",
    situationTitle: "Where do we start?",
    situations: [
      { id: "together", label: "We are together", note: "A couple, marriage, a relationship" },
      { id: "engaged", label: "Getting married", note: "Engaged, moving in soon" },
      { id: "choosing", label: "Still looking", note: "I have candidates and want clarity" },
    ],
    togetherTitle: "How long have you been together?",
    together: [
      { id: "new", label: "Less than six months" },
      { id: "year", label: "About a year" },
      { id: "few", label: "Two to five years" },
      { id: "long", label: "More than five years" },
    ],
    topicsTitle: "What matters most to discuss?",
    topicsNote: "Pick one or several — we will start there.",
    next: "Next",
    p1Title: "Each of you answers alone, on your own phone",
    p1Body:
      "Nobody peeks and nobody adjusts. You see how much the other person has filled in — but not their answers.",
    p2Title: "Answers open only both ways",
    p2Body:
      "You see the other person's answer once you answer the same question yourself. This rule lives in the database, not just in the interface.",
    got: "Got it",
    reminderTitle: "How often should we remind you?",
    reminderNote: "A real conversation is not a daily habit. Better rare and genuine.",
    reminders: [
      { id: "twice", label: "Twice a week" },
      { id: "week", label: "Once a week", note: "A calm pace, enough for a conversation" },
      { id: "off", label: "No reminders" },
    ],
    themeTitle: "Choose an appearance",
    themeNote: "You can change it later in your profile.",
    demoTitle: "Here is how it looks",
    demoNote: "Once you have both answered, the answers stand side by side.",
    demoQuestion: "What does the word “faithfulness” mean to you?",
    demoYou: "You",
    demoName: "Vladimir",
    demoMine: "That we choose each other every day.",
    demoTheirs: "Faithfulness is about choice, not prohibition.",
    demoTags: ["We match", "Worth talking", "We differ"],
    nameTitle: "What is your name?",
    nameNote: "Only people you add yourself will see it.",
    namePlaceholder: "Name",
    done: "Go to the questions",
    inviteTitle: "Bring the second person in",
    inviteBody:
      "Answers open only both ways, so there is nothing here for one person alone. Send the link to whoever you plan to answer with.",
    inviteCta: "Invite partner",
    inviteLater: "I will look around first",
    back: "Back",
  },
};

export default function Onboarding({ onFinish }) {
  const [step, setStep] = useState(0);
  const [legal, setLegal] = useState(null);
  const [lang, setLang] = useState("ru");
  const [data, setData] = useState({
    situation: null,
    together: null,
    topics: [],
    reminder: "week",
    theme: "cream",
    name: "",
    consentAt: null,
    lang: "ru",
  });

  useEffect(lockScroll, []);

  const t = T[lang];

  const set = (patch) => setData((d) => ({ ...d, ...patch }));
  const skipTogether = data.situation === "choosing";

  // Порядок держится на простом правиле: рассказали — предложили сделать —
  // снова рассказали. Раньше два объяснения шли подряд, а потом три
  // действия без единого слова, и человек терял нить.
  const steps = [
    // 0 · действие: без языка ничего не прочитать
    <Language
      key="lang"
      t={t}
      value={lang}
      onPick={(id) => {
        setLang(id);
        set({ lang: id });
      }}
      onNext={() => setStep(1)}
    />,

    // 1 · рассказали: что это вообще
    <Cover key="cover" t={t} onNext={() => setStep(2)} />,

    // 2 · показали: ради чего всё затевается
    <Demo key="demo" t={t} onNext={() => setStep(3)} />,

    // 3 · действие: согласие
    <Consent
      key="consent"
      t={t}
      onOpen={setLegal}
      onAgree={() => {
        set({ consentAt: Date.now() });
        setStep(4);
      }}
    />,

    // 4 · рассказали: как устроено прохождение
    <Promise
      key="p1"
      title={t.p1Title}
      body={t.p1Body}
      cta={t.got}
      onNext={() => setStep(5)}
    />,

    // 5 · действие
    <Choice
      key="situation"
      title={t.situationTitle}
      options={PAIR_ONLY ? t.situations.filter((x) => x.id !== "choosing") : t.situations}
      value={data.situation}
      onPick={(id) => {
        set({ situation: id });
        setStep(id === "choosing" ? 7 : 6);
      }}
    />,

    // 6 · действие, продолжение предыдущего вопроса
    <Choice
      key="together"
      title={t.togetherTitle}
      options={t.together}
      value={data.together}
      onPick={(id) => {
        set({ together: id });
        setStep(7);
      }}
    />,

    // 7 · рассказали: главное правило
    <Promise
      key="p2"
      shape="circle"
      title={t.p2Title}
      body={t.p2Body}
      cta={t.got}
      onNext={() => setStep(8)}
    />,

    // 8 · действие
    <Multi
      key="topics"
      title={t.topicsTitle}
      subtitle={t.topicsNote}
      nextLabel={t.next}
      options={CATEGORIES.map((cat) => ({
        id: cat.id,
        label: setTitle(cat.id, lang),
      }))}
      value={data.topics}
      onChange={(topics) => set({ topics })}
      onNext={() => setStep(9)}
    />,

    // 9 · действие
    <Choice
      key="reminder"
      title={t.reminderTitle}
      subtitle={t.reminderNote}
      options={t.reminders}
      value={data.reminder}
      onPick={(id) => {
        set({ reminder: id });
        setStep(10);
      }}
    />,

    // 10 · действие
    <Themes
      key="theme"
      t={t}
      lang={lang}
      value={data.theme}
      onPick={(id) => {
        set({ theme: id });
        applyPalette(id);
      }}
      onNext={() => setStep(11)}
    />,

    // 11 · действие
    <Name
      key="name"
      t={t}
      value={data.name}
      onChange={(name) => set({ name })}
      onDone={() => setStep(12)}
    />,

    // 12 · последнее и самое важное действие: без второго человека
    // приложению нечего показывать
    <InvitePartner
      key="invite"
      t={t}
      onInvite={() => {
        actions.completeOnboarding(data);
        onFinish?.(true);
      }}
      onLater={() => {
        actions.completeOnboarding(data);
        onFinish?.(false);
      }}
    />,
  ];

  const total = steps.length - 1;
  const shown = skipTogether && step > 6 ? step - 1 : step;

  return (
    <div style={wrap}>
      {step > 0 && (
        <div style={{ padding: "16px 16px 0", display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setStep((s) => (skipTogether && s === 7 ? 5 : Math.max(0, s - 1)))}
            style={back}
            aria-label={t.back}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <Progress value={(shown / (skipTogether ? total - 1 : total)) * 100} height={8} />
          </div>
        </div>
      )}
      {steps[step]}
      {legal && <Legal initial={legal} lang={lang} onClose={() => setLegal(null)} />}
    </div>
  );
}

function Consent({ t, onAgree, onOpen }) {
  const [ok, setOk] = useState(false);
  return (
    <div style={page}>
      <h1 style={h1}>{t.consentTitle}</h1>
      <p style={lede}>{t.consentBody}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
        <span style={ageBadge}>18+</span>
        <button onClick={() => setOk(!ok)} style={row(ok)}>
          <span style={{ flex: 1, textAlign: "left", font: `600 14px/1.4 ${font.sans}` }}>
            {t.consentCheck}
          </span>
          <span style={box(ok)} />
        </button>

        <div style={{ display: "flex", gap: 14 }}>
          <button onClick={() => onOpen("terms")} style={linkBtn}>
            {t.terms}
          </button>
          <button onClick={() => onOpen("privacy")} style={linkBtn}>
            {t.privacy}
          </button>
        </div>
      </div>

      <div style={footer}>
        <Button full onClick={onAgree} disabled={!ok}>
          {t.agree}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ шаги */

function Language({ t, value, onPick, onNext }) {
  const options = [
    { id: "ru", label: "Русский", note: "Весь интерфейс и вопросы по-русски" },
    { id: "en", label: "English", note: "The whole app and the questions in English" },
  ];
  return (
    <div style={page}>
      <h1 style={h1}>{t.langTitle}</h1>
      <p style={lede}>{t.langNote}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
        {options.map((o) => (
          <button key={o.id} onClick={() => onPick(o.id)} style={row(value === o.id)}>
            <span style={{ flex: 1, textAlign: "left" }}>
              <span style={{ font: `700 15px ${font.sans}`, display: "block" }}>{o.label}</span>
              <span style={{ font: `400 12.5px ${font.sans}`, color: c.mute }}>{o.note}</span>
            </span>
            <span style={radio(value === o.id)} />
          </button>
        ))}
      </div>
      <div style={footer}>
        <Button full onClick={onNext}>
          {t.start}
        </Button>
      </div>
    </div>
  );
}

function Cover({ t, onNext }) {
  return (
    <div style={page}>
      <div style={centered}>
        <Iso size={112} />
        <h1 style={{ ...h1, marginTop: 26 }}>{t.coverTitle}</h1>
        <p style={lede}>{t.coverBody}</p>
      </div>
      <div style={footer}>
        <Button full onClick={onNext}>
          {t.start}
        </Button>
      </div>
    </div>
  );
}

function Choice({ title, subtitle, options, value, onPick }) {
  return (
    <div style={page}>
      <h1 style={h1}>{title}</h1>
      {subtitle && <p style={lede}>{subtitle}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
        {options.map((o) => (
          <button key={o.id} onClick={() => onPick(o.id)} style={row(value === o.id)}>
            <span style={{ flex: 1, textAlign: "left" }}>
              <span style={{ font: `700 15px ${font.sans}`, display: "block" }}>{o.label}</span>
              {o.note && (
                <span style={{ font: `400 12.5px ${font.sans}`, color: c.mute }}>{o.note}</span>
              )}
            </span>
            <span style={radio(value === o.id)} />
          </button>
        ))}
      </div>
    </div>
  );
}

function Multi({ title, subtitle, options, value, onChange, onNext, nextLabel }) {
  const toggle = (id) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <div style={page}>
      <h1 style={h1}>{title}</h1>
      {subtitle && <p style={lede}>{subtitle}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
        {options.map((o) => (
          <button key={o.id} onClick={() => toggle(o.id)} style={row(value.includes(o.id))}>
            <span style={{ flex: 1, textAlign: "left", font: `600 14px ${font.sans}` }}>
              {o.label}
            </span>
            <span style={box(value.includes(o.id))} />
          </button>
        ))}
      </div>
      <div style={footer}>
        <Button full onClick={onNext} disabled={value.length === 0}>
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}

function Promise({ title, body, onNext, shape, cta }) {
  return (
    <div style={page}>
      <div style={centered}>
        <Iso size={100} shape={shape} />
        <h1 style={{ ...h1, marginTop: 26 }}>{title}</h1>
        <p style={lede}>{body}</p>
      </div>
      <div style={footer}>
        <Button full onClick={onNext}>
          {cta}
        </Button>
      </div>
    </div>
  );
}

function Themes({ t, lang, value, onPick, onNext }) {
  return (
    <div style={page}>
      <h1 style={h1}>{t.themeTitle}</h1>
      <p style={lede}>{t.themeNote}</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
        {Object.entries(palettes).map(([id, p]) => (
          <button
            key={id}
            onClick={() => onPick(id)}
            style={{
              width: 104,
              height: 128,
              background: p.bg,
              borderRadius: 32,
              boxShadow: `0 2px 0 ${c.ink}`,
              border: value === id ? `2px solid ${c.coral}` : `1.5px solid ${c.ink}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              cursor: "pointer",
            }}
            aria-label={lang === "en" ? p.nameEn : p.name}
            aria-pressed={value === id}
          >
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                background: p.accent,
                border: `1.5px solid ${p.ink}`,
              }}
            />
            <span style={{ font: `600 12px ${font.sans}`, color: p.ink }}>{lang === "en" ? p.nameEn : p.name}</span>
          </button>
        ))}
      </div>
      <div style={footer}>
        <Button full onClick={onNext}>
          {t.next}
        </Button>
      </div>
    </div>
  );
}

function Demo({ t, onNext }) {
  return (
    <div style={page}>
      <h1 style={h1}>{t.demoTitle}</h1>
      <p style={lede}>{t.demoNote}</p>

      <div style={{ ...demoCard, marginTop: 20 }}>
        <p style={{ margin: 0, font: `600 17px/1.25 ${font.serif}`, color: c.ink }}>
          {t.demoQuestion}
        </p>
        <DemoAnswer who={t.demoYou} accent={c.sage} text={t.demoMine} />
        <DemoAnswer who={t.demoName} accent={c.coral} text={t.demoTheirs} />
        <div style={{ display: "flex", gap: 6 }}>
          {t.demoTags.map((tag, i) => (
            <span
              key={tag}
              style={{
                background: i === 0 ? c.sage : c.bg,
                border: `1.5px solid ${c.ink}`,
                borderRadius: 999,
                boxShadow: `0 2px 0 ${c.ink}`,
                padding: "6px 11px",
                font: `600 12px ${font.sans}`,
                color: c.ink,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div style={footer}>
        <Button full onClick={onNext}>
          {t.next}
        </Button>
      </div>
    </div>
  );
}

function DemoAnswer({ who, text, accent }) {
  return (
    <div style={{ display: "flex", gap: 9 }}>
      <span style={{ width: 4, borderRadius: 8, background: accent, flexShrink: 0 }} />
      <div>
        <div
          style={{
            font: `600 10.5px ${font.mono}`,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: c.mute,
          }}
        >
          {who}
        </div>
        <p style={{ margin: "3px 0 0", font: `400 13.5px/1.45 ${font.sans}`, color: c.ink }}>
          {text}
        </p>
      </div>
    </div>
  );
}

function Name({ t, value, onChange, onDone }) {
  return (
    <div style={page}>
      <h1 style={h1}>{t.nameTitle}</h1>
      <p style={lede}>{t.nameNote}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.namePlaceholder}
        style={{
          marginTop: 22,
          width: "100%",
          background: c.paper,
          border: `1.5px solid ${c.ink}`,
          borderRadius: 28,
          boxShadow: `0 2px 0 ${c.ink}`,
          padding: "14px 15px",
          font: `400 16px ${font.sans}`,
          color: c.ink,
        }}
      />
      <div style={footer}>
        <Button full onClick={onDone} disabled={!value.trim()}>
          {t.done}
        </Button>
      </div>
    </div>
  );
}

/**
 * Последний шаг знакомства. Приглашение — самое важное действие во всём
 * приложении: без второго человека сравнивать не с чем. Поэтому кнопка
 * одна и заметная, а «посмотрю сам» — тихой ссылкой.
 */
function InvitePartner({ t, onInvite, onLater }) {
  return (
    <div style={page}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
        <Iso size={96} />
      </div>
      <h1 style={h1}>{t.inviteTitle}</h1>
      <p style={lede}>{t.inviteBody}</p>
      <div style={footer}>
        <Button full onClick={onInvite}>
          {t.inviteCta}
        </Button>
        <button
          onClick={onLater}
          style={{
            alignSelf: "center",
            marginTop: 12,
            background: "transparent",
            border: "none",
            padding: 0,
            font: `500 14px ${font.sans}`,
            color: c.mute,
            textDecoration: "underline",
            textUnderlineOffset: 3,
            cursor: "pointer",
          }}
        >
          {t.inviteLater}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- стили */

const wrap = {
  position: "fixed",
  top: screenTop,
  left: 0,
  right: 0,
  height: screenHeight,
  background: c.veil,
  backdropFilter: "blur(2px)",
  WebkitBackdropFilter: "blur(2px)",
  display: "flex",
  flexDirection: "column",
  zIndex: 50,
};
const page = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  padding: "24px 20px calc(20px + env(safe-area-inset-bottom))",
  overflowY: "auto",
  maxWidth: 520,
  width: "100%",
  margin: "0 auto",
};
const h1 = {
  font: `700 30px/1.1 ${font.serif}`,
  letterSpacing: "-0.01em",
  color: c.ink,
  margin: 0,
};
const lede = {
  margin: "12px 0 0",
  font: `400 15px/1.5 ${font.sans}`,
  color: c.mute,
};
const footer = { marginTop: "auto", paddingTop: 22, alignSelf: "stretch" };
const centered = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  textAlign: "center",
};
const back = {
  width: 34,
  height: 34,
  flexShrink: 0,
  background: c.paper,
  border: `1.5px solid ${c.ink}`,
  borderRadius: "50%",
  boxShadow: `0 2px 0 ${c.ink}`,
  font: "17px/1 sans-serif",
  color: c.ink,
  cursor: "pointer",
};
const row = (active) => ({
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: active ? c.sage : c.paper,
  border: `1.5px solid ${c.ink}`,
  borderRadius: 28,
  boxShadow: `0 2px 0 ${c.ink}`,
  padding: "14px 15px",
  color: c.ink,
  cursor: "pointer",
  width: "100%",
});
const radio = (active) => ({
  width: 20,
  height: 20,
  flexShrink: 0,
  borderRadius: "50%",
  border: `1.5px solid ${c.ink}`,
  background: active ? c.ink : "transparent",
});
const box = (active) => ({
  width: 20,
  height: 20,
  flexShrink: 0,
  borderRadius: 12,
  border: `1.5px solid ${c.ink}`,
  background: active ? c.ink : "transparent",
});
const ageBadge = {
  alignSelf: "flex-start",
  background: c.coral,
  color: c.onCoral,
  border: `1.5px solid ${c.ink}`,
  borderRadius: 999,
  boxShadow: `0 2px 0 ${c.ink}`,
  padding: "5px 14px",
  font: `700 14px ${font.mono}`,
};
const linkBtn = {
  background: "none",
  border: "none",
  padding: 0,
  font: `600 13px ${font.sans}`,
  color: c.ink,
  textDecoration: "underline",
  cursor: "pointer",
};
const demoCard = {
  background: c.paper,
  border: `1.5px solid ${c.ink}`,
  borderRadius: 32,
  boxShadow: `0 2px 0 ${c.ink}`,
  padding: 15,
  display: "flex",
  flexDirection: "column",
  gap: 11,
};
