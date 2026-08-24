import React from "react";
import { c, font } from "../theme.js";
import { Screen, Card, Progress, Label } from "../ui.jsx";
import {
  useStore,
  CATEGORIES,
  DECKS,
  blockProgress,
  totalProgress,
  setTitle,
} from "../store.js";
import { blockOrder, isBlockOpen, lockedQuestionCount } from "../limits.js";
import { FRIEND_DECK } from "../friends.js";

const T = {
  ru: {
    title: "Анкета",
    subtitle: "Отвечаете только вы. Ответы партнёра откроются, когда он ответит на тот же вопрос.",
    filled: "Заполнено",
    of: "из",
    course: "Основной курс",
    decks: "Колоды",
    decksNote: "Наборы под конкретный момент. Черновик — тексты ещё правятся.",
    openRest: (n) => `Открыть остальные ${n}`,
    friends: "Для друзей",
    friendsNote: "Короткий набор для дружеских связей — без вопросов про пару.",
  },
  en: {
    title: "Questionnaire",
    subtitle: "Only you answer. Your partner's answer opens once they answer the same question.",
    filled: "Completed",
    of: "of",
    course: "Main course",
    decks: "Decks",
    decksNote: "Sets for a specific moment. Draft — wording still being edited.",
    openRest: (n) => `Unlock the remaining ${n}`,
    friends: "For friends",
    friendsNote: "A short set for friendships — none of the couple questions.",
  },
};

export default function Questionnaire({ onOpenBlock, onPaywall }) {
  const { answers, profile, connections } = useStore();
  const hasFriends = connections.some((x) => x.kind === "friend");
  const friendProgress = blockProgress(answers, FRIEND_DECK.id);
  const lang = profile.lang || "ru";
  const t = T[lang];
  const total = totalProgress(answers);
  const order = blockOrder(profile.topics);
  const locked = lockedQuestionCount(profile);

  const lockedNames = order
    .filter((cat) => !isBlockOpen(cat.id, profile))
    .slice(0, 4)
    .map((cat) => setTitle(cat.id, lang).split(/\s+и\s+|\s+&\s+|,/)[0]);

  return (
    <Screen title={t.title} subtitle={t.subtitle}>
      <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Label>{t.filled}</Label>
          <span style={{ font: `700 15px ${font.serif}` }}>
            {total.done} {t.of} {total.total}
          </span>
        </div>
        <Progress value={total.pct} />
      </Card>

      <Label>{t.course}</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {order.map((cat) => {
          const p = blockProgress(answers, cat.id);
          const done = p.done === p.total;
          const open = isBlockOpen(cat.id, profile);
          const num = CATEGORIES.findIndex((x) => x.id === cat.id) + 1;

          return (
            <Row
              key={cat.id}
              badge={num}
              title={setTitle(cat.id, lang)}
              open={open}
              done={done}
              progress={p}
              onClick={() => (open ? onOpenBlock(cat.id) : onPaywall("blocks"))}
            />
          );
        })}
      </div>

      {locked > 0 && lockedNames.length > 0 && (
        <Card
          pad={15}
          onClick={() => onPaywall("blocks")}
          style={{ display: "flex", alignItems: "center", gap: 12, background: c.sage }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ font: `700 14.5px ${font.sans}`, color: c.ink }}>
              {t.openRest(locked)}
            </div>
            <div style={{ font: `400 12.5px ${font.sans}`, color: c.ink, opacity: 0.75 }}>
              {lockedNames.join(", ")}
            </div>
          </div>
          <span style={{ font: `600 18px ${font.sans}`, color: c.ink }}>›</span>
        </Card>
      )}

      {hasFriends && (
        <>
          <div style={{ marginTop: 8 }}>
            <Label>{t.friends}</Label>
          </div>
          <p style={{ margin: "-6px 0 2px", font: `400 12.5px/1.4 ${font.sans}`, color: c.mute }}>
            {t.friendsNote}
          </p>
          <Row
            badge="◇"
            title={setTitle(FRIEND_DECK.id, lang)}
            open
            done={friendProgress.done === friendProgress.total}
            progress={friendProgress}
            onClick={() => onOpenBlock(FRIEND_DECK.id)}
          />
        </>
      )}

      <div style={{ marginTop: 8 }}>
        <Label>{t.decks}</Label>
      </div>
      <p style={{ margin: "-6px 0 2px", font: `400 12.5px/1.4 ${font.sans}`, color: c.mute }}>
        {t.decksNote}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {DECKS.map((deck) => {
          const p = blockProgress(answers, deck.id);
          const open = Boolean(profile.premium);
          return (
            <Row
              key={deck.id}
              badge="+"
              title={setTitle(deck.id, lang)}
              note={lang === "en" ? deck.noteEn || deck.note : deck.note}
              open={open}
              done={p.done === p.total}
              progress={p}
              onClick={() => (open ? onOpenBlock(deck.id) : onPaywall("blocks"))}
            />
          );
        })}
      </div>
    </Screen>
  );
}

function Row({ badge, title, note, open, done, progress, onClick }) {
  return (
    <Card onClick={onClick} pad={13} style={open ? undefined : lockedCard}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            ...icon,
            background: !open ? c.coral : done ? c.sage : c.paper,
            color: !open ? c.onCoral : c.ink,
          }}
        >
          {badge}
        </span>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7 }}>
          <span style={{ font: `700 14.5px ${font.sans}`, color: c.ink }}>{title}</span>
          {open ? (
            <Progress value={progress.pct} height={7} />
          ) : (
            <span style={{ font: `600 11.5px ${font.mono}`, color: c.mute }}>
              {note ? `Premium · ${note}` : "Premium"}
            </span>
          )}
        </div>
        <span style={{ font: `600 12px ${font.mono}`, color: c.mute, whiteSpace: "nowrap" }}>
          {open ? `${progress.done}/${progress.total}` : `${progress.total}`}
        </span>
      </div>
    </Card>
  );
}

// Закрытый блок раньше просто гасился прозрачностью — на подложке сквозь
// него просвечивала картинка. Гасим цветом, карточка остаётся непрозрачной.
const lockedCard = { background: "color-mix(in srgb, var(--rg-paper) 82%, var(--rg-mute))" };

const icon = {
  width: 34,
  height: 34,
  flexShrink: 0,
  border: `2px solid ${c.ink}`,
  borderRadius: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  font: `700 14px ${font.serif}`,
  color: c.ink,
};
