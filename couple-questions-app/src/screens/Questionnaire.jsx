import React from "react";
import { c, font } from "../theme.js";
import { Screen, Card, Progress, Label } from "../ui.jsx";
import {
  useStore,
  CATEGORIES,
  QUESTIONS,
  DECKS,
  blockProgress,
  totalProgress,
  setTitle,
} from "../store.js";
import { blockOrder, isBlockOpen, lockedQuestionCount } from "../limits.js";
import { hasAccess } from "../access.js";
import { FRIEND_DECK } from "../friends.js";

const T = {
  ru: {
    title: "Анкета",
    subtitle: "Отвечаете только вы. Ответы партнёра откроются, когда он ответит на тот же вопрос.",
    filled: "Заполнено",
    of: "из",
    openedWith: (name, n) => `Открыто с ${name}: ${n}`,
    toVerdict: (n) => `Ещё ${n} общих ответов — и можно собрать разбор`,
    verdictReady: "Разбор уже можно собрать",
    course: "Ваши темы",
    rest: "Остальные блоки",
    invite: "Пригласите партнёра",
    inviteBody:
      "Ответы открываются только когда вы оба ответили на один вопрос. Пока вы одни, сравнивать не с чем.",
    inviteCta: "Пригласить партнёра",
    decks: "Колоды",
    decksNote: "Наборы под конкретный момент. Черновик — тексты ещё правятся.",
    openRest: (n) => `Открыть остальные ${n}`,
    answered: (name, n) => `${name} ответил · ${n}`,
    friends: "Для друзей",
    friendsNote: "Короткий набор для дружеских связей — без вопросов про пару.",
  },
  en: {
    title: "Questionnaire",
    subtitle: "Only you answer. Your partner's answer opens once they answer the same question.",
    filled: "Completed",
    of: "of",
    openedWith: (name, n) => `Open with ${name}: ${n}`,
    toVerdict: (n) => `${n} more shared answers and the summary can be built`,
    verdictReady: "The summary can be built now",
    course: "Your topics",
    rest: "Other blocks",
    invite: "Invite your partner",
    inviteBody:
      "Answers open only once you have both answered the same question. Alone there is nothing to compare.",
    inviteCta: "Invite partner",
    decks: "Decks",
    decksNote: "Sets for a specific moment. Draft — wording still being edited.",
    openRest: (n) => `Unlock the remaining ${n}`,
    answered: (name, n) => `${name} answered · ${n}`,
    friends: "For friends",
    friendsNote: "A short set for friendships — none of the couple questions.",
  },
};

export default function Questionnaire({ onOpenBlock, onPaywall, onInvite }) {
  const { answers, profile, connections } = useStore();
  const hasFriends = connections.some((x) => x.kind === "friend");
  const friendProgress = blockProgress(answers, FRIEND_DECK.id);
  const lang = profile.lang || "ru";
  const t = T[lang];
  const total = totalProgress(answers);
  const order = blockOrder(profile.topics);
  const locked = lockedQuestionCount(profile, connections);

  // Выбранное при знакомстве идёт первым и выглядит как основное.
  // Остальное — тише: иначе человек не понимает, почему ему показывают
  // блоки, которых он не просил.
  const picked = profile.topics?.length ? profile.topics : order.slice(0, 3).map((x) => x.id);
  const mineBlocks = order.filter((cat) => picked.includes(cat.id));
  const restBlocks = order.filter((cat) => !picked.includes(cat.id));

  // Дима спрашивал: сколько мне нужно ответить, чтобы приложение что-то
  // дало? Нигде не было сказано. Теперь видно и то, что уже открыто,
  // и сколько осталось до разбора.
  const partner = connections[0];
  const openedNow = partner
    ? QUESTIONS.filter((q) => answers[q.id] && partner.answers[q.id]).length
    : 0;
  const toVerdict = Math.max(0, 5 - openedNow);

  const lockedNames = order
    .filter((cat) => !isBlockOpen(cat.id, profile, connections))
    .slice(0, 4)
    .map((cat) => setTitle(cat.id, lang).split(/\s+и\s+|\s+&\s+|,/)[0]);

  return (
    <Screen title={t.title} subtitle={t.subtitle}>
      <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Label>{t.filled}</Label>
          <span style={{ font: `700 17px ${font.serif}` }}>
            {total.done} {t.of} {total.total}
          </span>
        </div>
        <Progress value={total.pct} />
        {partner && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ font: `600 13px ${font.sans}`, color: c.ink }}>
              {t.openedWith(partner.name, openedNow)}
            </span>
            <span style={{ font: `400 12.5px ${font.sans}`, color: c.mute }}>
              {toVerdict > 0 ? t.toVerdict(toVerdict) : t.verdictReady}
            </span>
          </div>
        )}
      </Card>

      {connections.length === 0 && (
        <Card
          pad={16}
          onClick={onInvite}
          style={{ display: "flex", flexDirection: "column", gap: 10, background: c.sage }}
        >
          <span style={{ font: `700 18px ${font.serif}`, color: c.ink }}>{t.invite}</span>
          <span style={{ font: `400 14px/1.45 ${font.sans}`, color: c.ink, opacity: 0.8 }}>
            {t.inviteBody}
          </span>
          <span style={{ font: `700 15px ${font.sans}`, color: c.ink }}>{t.inviteCta} →</span>
        </Card>
      )}

      <Label light>{t.course}</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {mineBlocks.map((cat) => (
          <BlockRow
            key={cat.id}
            cat={cat}
            t={t}
            lang={lang}
            answers={answers}
            profile={profile}
            connections={connections}
            onOpenBlock={onOpenBlock}
            onPaywall={onPaywall}
          />
        ))}
      </div>

      {restBlocks.length > 0 && (
        <>
          <div style={{ marginTop: 8 }}>
            <Label light>{t.rest}</Label>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {restBlocks.map((cat) => (
              <BlockRow
                key={cat.id}
                cat={cat}
                t={t}
                lang={lang}
                answers={answers}
                profile={profile}
                connections={connections}
                onOpenBlock={onOpenBlock}
                onPaywall={onPaywall}
                quiet
              />
            ))}
          </div>
        </>
      )}

      {locked > 0 && lockedNames.length > 0 && (
        <Card
          pad={15}
          onClick={() => onPaywall("blocks")}
          style={{ display: "flex", alignItems: "center", gap: 12, background: c.sage }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ font: `700 16px ${font.sans}`, color: c.ink }}>
              {t.openRest(locked)}
            </div>
            <div style={{ font: `400 13.5px ${font.sans}`, color: c.ink, opacity: 0.75 }}>
              {lockedNames.join(", ")}
            </div>
          </div>
          <span style={{ font: `600 18px ${font.sans}`, color: c.ink }}>›</span>
        </Card>
      )}

      {hasFriends && (
        <>
          <div style={{ marginTop: 8 }}>
            <Label light>{t.friends}</Label>
          </div>
          <p style={{ margin: "-6px 0 2px", font: `400 13.5px/1.45 ${font.sans}`, color: c.ink, opacity: 0.7 }}>
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
        <Label light>{t.decks}</Label>
      </div>
      <p style={{ margin: "-6px 0 2px", font: `400 13.5px/1.45 ${font.sans}`, color: c.ink, opacity: 0.7 }}>
        {t.decksNote}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {DECKS.map((deck) => {
          const p = blockProgress(answers, deck.id);
          const open = hasAccess(profile, connections);
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

/**
 * Кто из связей уже ответил в закрытом блоке и сколько раз. Сами ответы
 * сервер не отдаёт — только число, поэтому берём самого продвинувшегося.
 */
function partnerAhead(connections, catId) {
  let best = null;
  for (const conn of connections) {
    const n = conn.blockCounts?.[catId] || 0;
    if (n > 0 && (!best || n > best.n)) best = { name: conn.name, n };
  }
  return best;
}

function BlockRow({ cat, t, lang, answers, profile, connections, onOpenBlock, onPaywall, quiet }) {
  const p = blockProgress(answers, cat.id);
  const open = isBlockOpen(cat.id, profile, connections);
  const ahead = open ? null : partnerAhead(connections, cat.id);
  return (
    <Row
      badge={CATEGORIES.findIndex((x) => x.id === cat.id) + 1}
      title={setTitle(cat.id, lang)}
      open={open}
      done={p.done === p.total}
      progress={p}
      quiet={quiet}
      waiting={ahead ? t.answered(ahead.name, ahead.n) : ""}
      onClick={() => (open ? onOpenBlock(cat.id) : onPaywall("blocks"))}
    />
  );
}

function Row({ badge, title, note, open, done, progress, waiting, quiet, onClick }) {
  return (
    <Card onClick={onClick} pad={quiet ? 10 : 13} style={open ? undefined : lockedCard}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            ...icon,
            ...(quiet ? { width: 26, height: 26, font: `600 12px ${font.serif}` } : null),
            background: !open ? c.dim : done ? c.sage : c.paper,
            color: c.ink,
          }}
        >
          {badge}
        </span>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7 }}>
          <span style={{ font: `${quiet ? 600 : 700} ${quiet ? 14.5 : 16}px ${font.sans}`, color: c.ink }}>
            {title}
          </span>
          {open ? (
            <Progress value={progress.pct} height={7} />
          ) : waiting ? (
            // Ответ партнёра уже лежит на сервере. Показываем не замок,
            // а то, что за ним: это и есть повод открыть.
            <span style={{ font: `600 13px ${font.sans}`, color: c.warm }}>{waiting}</span>
          ) : (
            <span style={{ font: `500 13px ${font.sans}`, color: c.mute }}>
              {note || ""}
            </span>
          )}
        </div>
        <span style={{ font: `600 13.5px ${font.mono}`, color: c.mute, whiteSpace: "nowrap" }}>
          {open ? `${progress.done}/${progress.total}` : `${progress.total}`}
        </span>
      </div>
    </Card>
  );
}

// Закрытый блок раньше просто гасился прозрачностью — на подложке сквозь
// него просвечивала картинка. Гасим цветом, карточка остаётся непрозрачной.
const lockedCard = { background: c.dim };

const icon = {
  width: 34,
  height: 34,
  flexShrink: 0,
  border: `1.5px solid ${c.ink}`,
  borderRadius: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  font: `700 14px ${font.serif}`,
  color: c.ink,
};
