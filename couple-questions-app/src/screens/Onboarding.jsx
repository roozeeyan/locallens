import React, { useState } from "react";
import { c, font, palettes, applyPalette } from "../theme.js";
import { Button, Progress, Iso } from "../ui.jsx";
import { actions, CATEGORIES } from "../store.js";
import Legal from "./Legal.jsx";

const SITUATIONS = [
  { id: "together", label: "Мы вместе", note: "Пара, брак, отношения" },
  { id: "engaged", label: "Готовимся к свадьбе", note: "Помолвка, скоро съезжаемся" },
  { id: "choosing", label: "Присматриваюсь", note: "Есть кандидаты, хочу разобраться" },
];

const TOGETHER = [
  { id: "new", label: "Меньше полугода" },
  { id: "year", label: "Около года" },
  { id: "few", label: "Два–пять лет" },
  { id: "long", label: "Больше пяти лет" },
];

const REMINDERS = [
  { id: "twice", label: "Два раза в неделю" },
  { id: "week", label: "Раз в неделю", note: "Спокойный ритм, хватает на разговор" },
  { id: "off", label: "Без напоминаний" },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [legal, setLegal] = useState(null);
  const [data, setData] = useState({
    situation: null,
    together: null,
    topics: [],
    reminder: "week",
    theme: "cream",
    name: "",
    consentAt: null,
  });

  const set = (patch) => setData((d) => ({ ...d, ...patch }));
  const skipTogether = data.situation === "choosing";

  const steps = [
    // 0
    <Cover key="cover" onNext={() => setStep(1)} />,

    // 1
    <Consent
      key="consent"
      onOpen={setLegal}
      onAgree={() => {
        set({ consentAt: Date.now() });
        setStep(2);
      }}
    />,

    // 2
    <Choice
      key="situation"
      title="С чего начнём?"
      options={SITUATIONS}
      value={data.situation}
      onPick={(id) => {
        set({ situation: id });
        setStep(id === "choosing" ? 4 : 3);
      }}
    />,

    // 3
    <Choice
      key="together"
      title="Как давно вы вместе?"
      options={TOGETHER}
      value={data.together}
      onPick={(id) => {
        set({ together: id });
        setStep(4);
      }}
    />,

    // 4
    <Multi
      key="topics"
      title="Что важнее обсудить?"
      subtitle="Выберите одно или несколько — с них начнём анкету."
      options={CATEGORIES.map((cat) => ({
        id: cat.id,
        label: cat.ru.replace(/^Блок \d+\.\s*/, ""),
      }))}
      value={data.topics}
      onChange={(topics) => set({ topics })}
      onNext={() => setStep(5)}
    />,

    // 5
    <Promise
      key="p1"
      title="Каждый отвечает сам, со своего телефона"
      body="Никто не подсматривает и не подстраивается. Вы видите, насколько заполнена анкета у другого — но не сами ответы."
      onNext={() => setStep(6)}
    />,

    // 6
    <Promise
      key="p2"
      shape="circle"
      title="Ответы открываются только по взаимности"
      body="Ответ другого человека вы увидите, когда ответите на тот же вопрос сами. Это правило работает на уровне базы данных, а не просто в интерфейсе."
      onNext={() => setStep(7)}
    />,

    // 7
    <Choice
      key="reminder"
      title="Как часто напоминать?"
      subtitle="Разговор вдвоём — не ежедневная привычка. Лучше редко, но по-настоящему."
      options={REMINDERS}
      value={data.reminder}
      onPick={(id) => {
        set({ reminder: id });
        setStep(8);
      }}
    />,

    // 8
    <Themes
      key="theme"
      value={data.theme}
      onPick={(id) => {
        set({ theme: id });
        applyPalette(id);
      }}
      onNext={() => setStep(9)}
    />,

    // 9
    <Demo key="demo" onNext={() => setStep(10)} />,

    // 10
    <Name
      key="name"
      value={data.name}
      onChange={(name) => set({ name })}
      onDone={() => actions.completeOnboarding(data)}
    />,
  ];

  const total = steps.length - 1;
  const shown = skipTogether && step > 3 ? step - 1 : step;

  return (
    <div style={wrap}>
      {step > 0 && (
        <div style={{ padding: "16px 16px 0", display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setStep((s) => (skipTogether && s === 4 ? 2 : Math.max(0, s - 1)))}
            style={back}
            aria-label="Назад"
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <Progress value={(shown / (skipTogether ? total - 1 : total)) * 100} height={8} />
          </div>
        </div>
      )}
      {steps[step]}
      {legal && <Legal initial={legal} onClose={() => setLegal(null)} />}
    </div>
  );
}

function Consent({ onAgree, onOpen }) {
  const [ok, setOk] = useState(false);
  return (
    <div style={page}>
      <h1 style={h1}>Прежде чем начать</h1>
      <p style={lede}>
        Вопросы касаются близости, денег и семейных конфликтов. Сервис для совершеннолетних.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
        <span style={ageBadge}>18+</span>
        <button onClick={() => setOk(!ok)} style={row(ok)}>
          <span style={{ flex: 1, textAlign: "left", font: `600 14px/1.4 ${font.sans}` }}>
            Мне есть 18 лет. Я принимаю соглашение и политику конфиденциальности.
          </span>
          <span style={box(ok)} />
        </button>

        <div style={{ display: "flex", gap: 14 }}>
          <button onClick={() => onOpen("terms")} style={linkBtn}>
            Соглашение
          </button>
          <button onClick={() => onOpen("privacy")} style={linkBtn}>
            Конфиденциальность
          </button>
        </div>
      </div>

      <div style={footer}>
        <Button full onClick={onAgree} disabled={!ok}>
          Согласен, дальше
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ шаги */

function Cover({ onNext }) {
  return (
    <div style={page}>
      <div style={centered}>
        <Iso size={112} />
        <h1 style={{ ...h1, marginTop: 26 }}>Узнать друг друга до того, как станет поздно</h1>
        <p style={lede}>
          119 вопросов, которые обычно задают уже в кабинете психолога. Каждый отвечает сам —
          а потом вы видите, где сходитесь и о чём стоит поговорить.
        </p>
      </div>
      <div style={footer}>
        <Button full onClick={onNext}>
          Начать
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

function Multi({ title, subtitle, options, value, onChange, onNext }) {
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
          Дальше
        </Button>
      </div>
    </div>
  );
}

function Promise({ title, body, onNext, shape }) {
  return (
    <div style={page}>
      <div style={centered}>
        <Iso size={100} shape={shape} />
        <h1 style={{ ...h1, marginTop: 26 }}>{title}</h1>
        <p style={lede}>{body}</p>
      </div>
      <div style={footer}>
        <Button full onClick={onNext}>
          Понятно
        </Button>
      </div>
    </div>
  );
}

function Themes({ value, onPick, onNext }) {
  return (
    <div style={page}>
      <h1 style={h1}>Выберите оформление</h1>
      <p style={lede}>Потом можно поменять в профиле.</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
        {Object.entries(palettes).map(([id, p]) => (
          <button
            key={id}
            onClick={() => onPick(id)}
            style={{
              width: 104,
              height: 128,
              background: p.bg,
              border: `2px solid ${c.ink}`,
              borderRadius: 16,
              boxShadow: `0 3px 0 ${c.ink}`,
              outline: value === id ? `3px solid ${c.coral}` : "none",
              outlineOffset: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              cursor: "pointer",
            }}
            aria-label={p.name}
            aria-pressed={value === id}
          >
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: p.accent,
                border: `2px solid ${p.ink}`,
              }}
            />
            <span style={{ font: `600 12px ${font.sans}`, color: p.ink }}>{p.name}</span>
          </button>
        ))}
      </div>
      <div style={footer}>
        <Button full onClick={onNext}>
          Дальше
        </Button>
      </div>
    </div>
  );
}

function Demo({ onNext }) {
  return (
    <div style={page}>
      <h1 style={h1}>Так это выглядит</h1>
      <p style={lede}>Когда вы оба ответили, ответы встают рядом.</p>

      <div style={{ ...demoCard, marginTop: 20 }}>
        <p style={{ margin: 0, font: `600 17px/1.25 ${font.serif}`, color: c.ink }}>
          Как ты понимаешь слово «верность»?
        </p>
        <DemoAnswer who="Вы" accent={c.sage} text="Что мы выбираем друг друга каждый день." />
        <DemoAnswer
          who="Владимир"
          accent={c.coral}
          text="Верность — это про выбор, а не про запрет."
        />
        <div style={{ display: "flex", gap: 6 }}>
          {["Совпадаем", "Обсудить", "Расходимся"].map((t, i) => (
            <span
              key={t}
              style={{
                background: i === 0 ? c.sage : c.bg,
                border: `2px solid ${c.ink}`,
                borderRadius: 999,
                boxShadow: `0 2px 0 ${c.ink}`,
                padding: "6px 11px",
                font: `600 12px ${font.sans}`,
                color: c.ink,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div style={footer}>
        <Button full onClick={onNext}>
          Дальше
        </Button>
      </div>
    </div>
  );
}

function DemoAnswer({ who, text, accent }) {
  return (
    <div style={{ display: "flex", gap: 9 }}>
      <span style={{ width: 4, borderRadius: 4, background: accent, flexShrink: 0 }} />
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

function Name({ value, onChange, onDone }) {
  return (
    <div style={page}>
      <h1 style={h1}>Как вас зовут?</h1>
      <p style={lede}>Имя увидят только те, кого вы сами добавите.</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Имя"
        style={{
          marginTop: 22,
          width: "100%",
          background: c.paper,
          border: `2px solid ${c.ink}`,
          borderRadius: 14,
          boxShadow: `0 3px 0 ${c.ink}`,
          padding: "14px 15px",
          font: `400 16px ${font.sans}`,
          color: c.ink,
        }}
      />
      <div style={footer}>
        <Button full onClick={onDone} disabled={!value.trim()}>
          Перейти к анкете
        </Button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- стили */

const wrap = {
  position: "fixed",
  inset: 0,
  background: c.bg,
  display: "flex",
  flexDirection: "column",
  zIndex: 40,
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
  border: `2px solid ${c.ink}`,
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
  border: `2px solid ${c.ink}`,
  borderRadius: 14,
  boxShadow: `0 3px 0 ${c.ink}`,
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
  border: `2px solid ${c.ink}`,
  background: active ? c.ink : "transparent",
});
const box = (active) => ({
  width: 20,
  height: 20,
  flexShrink: 0,
  borderRadius: 6,
  border: `2px solid ${c.ink}`,
  background: active ? c.ink : "transparent",
});
const ageBadge = {
  alignSelf: "flex-start",
  background: c.coral,
  border: `2px solid ${c.ink}`,
  borderRadius: 999,
  boxShadow: `0 2px 0 ${c.ink}`,
  padding: "5px 14px",
  font: `700 14px ${font.mono}`,
  color: c.ink,
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
  border: `2px solid ${c.ink}`,
  borderRadius: 16,
  boxShadow: `0 3px 0 ${c.ink}`,
  padding: 15,
  display: "flex",
  flexDirection: "column",
  gap: 11,
};
