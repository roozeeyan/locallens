import React, { useMemo, useState } from "react";
import { CATEGORIES, QUESTIONS } from "./data.js";

const TEXT = {
  ru: {
    title: "Вопросы для пары",
    subtitle: "Что стоит обсудить перед началом отношений",
    randomBtn: "🎲 Случайный вопрос",
    closeBtn: "Закрыть",
    nextBtn: "Следующий вопрос",
    countSuffix: (n) => `${n} вопрос${n % 10 === 1 && n % 100 !== 11 ? "" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "а" : "ов"}`,
  },
  en: {
    title: "Couple Questions",
    subtitle: "What to discuss before starting a relationship",
    randomBtn: "🎲 Random question",
    closeBtn: "Close",
    nextBtn: "Next question",
    countSuffix: (n) => `${n} question${n === 1 ? "" : "s"}`,
  },
};

function pickRandom(exclude) {
  let next = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  if (QUESTIONS.length > 1) {
    while (next.id === exclude) {
      next = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    }
  }
  return next;
}

export default function App() {
  const [lang, setLang] = useState("ru");
  const [openCat, setOpenCat] = useState(CATEGORIES[0].id);
  const [randomOpen, setRandomOpen] = useState(false);
  const [randomQuestion, setRandomQuestion] = useState(null);

  const t = TEXT[lang];

  const byCategory = useMemo(() => {
    const map = {};
    for (const c of CATEGORIES) map[c.id] = [];
    for (const q of QUESTIONS) map[q.cat].push(q);
    return map;
  }, []);

  const openRandom = () => {
    setRandomQuestion(pickRandom(null));
    setRandomOpen(true);
  };

  const nextRandom = () => {
    setRandomQuestion((prev) => pickRandom(prev ? prev.id : null));
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.headerTop}>
          <div>
            <h1 style={s.title}>{t.title}</h1>
            <p style={s.subtitle}>{t.subtitle}</p>
          </div>
          <div style={s.langSwitch}>
            <button
              style={{ ...s.langBtn, ...(lang === "ru" ? s.langBtnActive : {}) }}
              onClick={() => setLang("ru")}
            >
              RU
            </button>
            <button
              style={{ ...s.langBtn, ...(lang === "en" ? s.langBtnActive : {}) }}
              onClick={() => setLang("en")}
            >
              EN
            </button>
          </div>
        </div>
        <button style={s.randomButton} onClick={openRandom}>
          {t.randomBtn}
        </button>
      </header>

      <main style={s.main}>
        {CATEGORIES.map((c) => {
          const items = byCategory[c.id];
          const isOpen = openCat === c.id;
          return (
            <section key={c.id} style={s.catSection}>
              <button
                style={s.catHeader}
                onClick={() => setOpenCat(isOpen ? null : c.id)}
              >
                <span style={s.catTitle}>
                  <span style={s.catEmoji}>{c.emoji}</span>
                  {lang === "ru" ? c.ru : c.en}
                </span>
                <span style={s.catMeta}>
                  {t.countSuffix(items.length)}
                  <span style={{ ...s.chevron, ...(isOpen ? s.chevronOpen : {}) }}>›</span>
                </span>
              </button>
              {isOpen && (
                <ul style={s.list}>
                  {items.map((q) => (
                    <li key={q.id} style={s.listItem}>
                      {lang === "ru" ? q.ru : q.en}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </main>

      {randomOpen && randomQuestion && (
        <div style={s.overlay} onClick={() => setRandomOpen(false)}>
          <div style={s.card} onClick={(e) => e.stopPropagation()}>
            <span style={s.cardEmoji}>
              {CATEGORIES.find((c) => c.id === randomQuestion.cat)?.emoji}
            </span>
            <p style={s.cardText}>
              {lang === "ru" ? randomQuestion.ru : randomQuestion.en}
            </p>
            <div style={s.cardActions}>
              <button style={s.cardBtnSecondary} onClick={() => setRandomOpen(false)}>
                {t.closeBtn}
              </button>
              <button style={s.cardBtnPrimary} onClick={nextRandom}>
                {t.nextBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#fff5f6",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    color: "#3a2530",
    paddingBottom: 48,
  },
  header: {
    background: "linear-gradient(135deg, #e8506e 0%, #c23a63 100%)",
    color: "#fff",
    padding: "28px 20px 24px",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    boxShadow: "0 8px 24px rgba(200, 50, 90, 0.25)",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: 14,
    opacity: 0.9,
  },
  langSwitch: {
    display: "flex",
    background: "rgba(255,255,255,0.18)",
    borderRadius: 10,
    padding: 3,
    flexShrink: 0,
  },
  langBtn: {
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    padding: "6px 10px",
    borderRadius: 8,
    cursor: "pointer",
    opacity: 0.75,
  },
  langBtnActive: {
    background: "#fff",
    color: "#c23a63",
    opacity: 1,
  },
  randomButton: {
    marginTop: 20,
    width: "100%",
    border: "none",
    background: "rgba(255,255,255,0.16)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    padding: "12px 16px",
    borderRadius: 14,
    cursor: "pointer",
    backdropFilter: "blur(4px)",
  },
  main: {
    maxWidth: 640,
    margin: "20px auto 0",
    padding: "0 16px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  catSection: {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 2px 10px rgba(60, 20, 40, 0.06)",
    overflow: "hidden",
  },
  catHeader: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    border: "none",
    background: "transparent",
    padding: "16px 18px",
    cursor: "pointer",
    textAlign: "left",
    gap: 10,
  },
  catTitle: {
    flex: "1 1 auto",
    minWidth: 0,
    fontSize: 16,
    fontWeight: 600,
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },
  catEmoji: {
    fontSize: 20,
    lineHeight: 1.3,
  },
  catMeta: {
    flexShrink: 0,
    fontSize: 13,
    color: "#a86a7a",
    display: "flex",
    alignItems: "center",
    gap: 6,
    whiteSpace: "nowrap",
    paddingTop: 3,
  },
  chevron: {
    display: "inline-block",
    transform: "rotate(90deg)",
    transition: "transform 0.15s ease",
    fontSize: 18,
  },
  chevronOpen: {
    transform: "rotate(-90deg)",
  },
  list: {
    margin: 0,
    padding: "0 18px 16px",
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  listItem: {
    fontSize: 15,
    lineHeight: 1.45,
    padding: "10px 12px",
    background: "#fdeef1",
    borderRadius: 10,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(40, 15, 25, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 10,
  },
  card: {
    background: "#fff",
    borderRadius: 20,
    padding: "32px 24px",
    maxWidth: 420,
    width: "100%",
    textAlign: "center",
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
  },
  cardEmoji: {
    fontSize: 32,
    display: "block",
    marginBottom: 14,
  },
  cardText: {
    fontSize: 19,
    lineHeight: 1.5,
    fontWeight: 600,
    color: "#3a2530",
    margin: "0 0 24px",
  },
  cardActions: {
    display: "flex",
    gap: 10,
  },
  cardBtnSecondary: {
    flex: 1,
    border: "1px solid #e8c3cd",
    background: "#fff",
    color: "#c23a63",
    fontSize: 14,
    fontWeight: 600,
    padding: "12px 10px",
    borderRadius: 12,
    cursor: "pointer",
  },
  cardBtnPrimary: {
    flex: 1,
    border: "none",
    background: "#e8506e",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    padding: "12px 10px",
    borderRadius: 12,
    cursor: "pointer",
  },
};
