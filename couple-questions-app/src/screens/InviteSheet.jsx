import React, { useEffect, useState } from "react";
import { c, font } from "../theme.js";
import { screenHeight, screenTop, lockScroll } from "../viewport.js";
import { Card, Button, Label } from "../ui.jsx";
import { isRemote, makeInviteCode } from "../backend.js";
import { createInviteRemote, joinByCode } from "../sync.js";
import { useStore } from "../store.js";

const BOT = "relationship_game_by_roo_bot";

const T = {
  ru: {
    back: "Назад",
    title: "Пригласить",
    who: "Кого добавляете",
    partner: "Партнёра",
    candidate: "Кандидата",
    friend: "Друга",
    hints: {
      partner: "Человек, с которым вы уже вместе.",
      candidate: "Человек, которого вы рассматриваете. Таких можно добавлять сколько угодно.",
      friend: "Подруга, друг, кто угодно вне романтики. Для друзей — свой короткий набор вопросов.",
    },
    create: "Создать приглашение",
    creating: "Создаём…",
    linkLabel: "Ссылка-приглашение",
    copy: "Скопировать ссылку",
    copied: "Ссылка скопирована",
    message: "Что написать",
    messageNote:
      "Самое трудное — объяснить, что это не проверка. Готовый текст можно поправить под себя.",
    copyMessage: "Скопировать текст со ссылкой",
    copiedMessage: "Текст скопирован — вставьте его в чат",
    draft: (who) =>
      `Слушай, хочу кое-что пройти вместе. Это не тест и не претензия — просто список вопросов про деньги, детей, границы и всё то, о чём мы вечно не доходим поговорить.\n\nОтвечает каждый сам, со своего телефона. Твой ответ я увижу, только когда отвечу на тот же вопрос сама, — и наоборот. Можно понемногу, по паре вопросов вечером.\n\nВот ссылка: ${who}`,
    copyManually: "Скопируйте ссылку вручную",
    linkNote:
      "Отправьте её в личном сообщении. Человек откроет приложение, заполнит свою анкету — и вы увидите, где совпадаете.",
    haveCode: "У меня есть код",
    codePlaceholder: "Код из приглашения",
    accept: "Принять приглашение",
    noServer: "Приглашения заработают, когда подключим сервер.",
    badCode: "Код не подошёл",
    offline: "Сервер не подключён",
    offlineNote:
      "Ссылку можно создать и посмотреть, но принять приглашение пока нельзя — для этого нужен общий сервер.",
  },
  en: {
    back: "Back",
    title: "Invite",
    who: "Who are you adding",
    partner: "Partner",
    candidate: "Candidate",
    friend: "Friend",
    hints: {
      partner: "Someone you are already with.",
      candidate: "Someone you are considering. You can add as many as you like.",
      friend: "A friend, anyone outside romance. Friends get their own short set of questions.",
    },
    create: "Create invitation",
    creating: "Creating…",
    linkLabel: "Invitation link",
    copy: "Copy link",
    copied: "Link copied",
    message: "What to write",
    messageNote:
      "The hard part is explaining that this is not a test. Here is a draft you can edit.",
    copyMessage: "Copy the message with the link",
    copiedMessage: "Message copied — paste it into the chat",
    draft: (who) =>
      `Hey, I want us to go through something together. It is not a test and not a complaint — just a list of questions about money, children, boundaries and all the things we never get around to.\n\nEach of us answers alone, on our own phone. I only see your answer once I answer the same question myself — and the other way round. A couple of questions an evening is fine.\n\nHere is the link: ${who}`,
    copyManually: "Copy the link manually",
    linkNote:
      "Send it in a private message. They open the app, fill in their own answers — and you see where you agree.",
    haveCode: "I have a code",
    codePlaceholder: "Code from the invitation",
    accept: "Accept invitation",
    noServer: "Invitations will work once the server is connected.",
    badCode: "That code did not work",
    offline: "Server not connected",
    offlineNote:
      "You can create and view a link, but accepting an invitation needs a shared server.",
  },
};

export default function InviteSheet({ onClose, onAccepted }) {
  useEffect(lockScroll, []);

  const name = useStore((s) => s.profile.name);
  const lang = useStore((s) => s.profile.lang);
  const t = T[lang === "en" ? "en" : "ru"];
  const [kind, setKind] = useState("partner");
  const [code, setCode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [entered, setEntered] = useState("");
  const [note, setNote] = useState("");

  const link = code ? `https://t.me/${BOT}?startapp=${code}` : "";
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (link) setDraft(t.draft(link));
  }, [link]); // eslint-disable-line react-hooks/exhaustive-deps

  const generate = async () => {
    setBusy(true);
    setNote("");
    if (isRemote) {
      const res = await createInviteRemote(kind, name);
      if (res.ok) setCode(res.code);
      else setNote(res.message);
    } else {
      setCode(makeInviteCode());
    }
    setBusy(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setNote(t.copied);
    } catch {
      setNote(t.copyManually);
    }
  };

  // Ссылка без слов не работает: половина приглашений умирает на том, что
  // позвавший не знает, как объяснить, что это не проверка.
  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setNote(t.copiedMessage);
    } catch {
      setNote(t.copyManually);
    }
  };

  const accept = async () => {
    const v = entered.trim();
    if (!v) return;
    if (!isRemote) {
      setNote(t.noServer);
      return;
    }
    setBusy(true);
    const res = await joinByCode(v, name);
    setBusy(false);
    if (res.ok) {
      onAccepted?.();
      onClose();
    } else {
      setNote(res.message || t.badCode);
    }
  };

  return (
    <div style={wrap}>
      <div style={top}>
        <button onClick={onClose} style={back} aria-label={t.back}>
          ←
        </button>
        <div style={{ font: `700 19px ${font.serif}`, color: c.ink }}>{t.title}</div>
      </div>

      <div style={body}>
        <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <Label>{t.who}</Label>
          <div style={{ display: "flex", gap: 8 }}>
            <Pick active={kind === "partner"} onClick={() => setKind("partner")}>
              {t.partner}
            </Pick>
            <Pick active={kind === "candidate"} onClick={() => setKind("candidate")}>
              {t.candidate}
            </Pick>
            <Pick active={kind === "friend"} onClick={() => setKind("friend")}>
              {t.friend}
            </Pick>
          </div>
          <span style={{ font: `400 12.5px/1.45 ${font.sans}`, color: c.mute }}>
            {t.hints[kind]}
          </span>
        </Card>

        {!code ? (
          <Button full onClick={generate} disabled={busy}>
            {busy ? t.creating : t.create}
          </Button>
        ) : (
          <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            <Label>{t.linkLabel}</Label>
            <div style={codeBox}>{link}</div>
            <Button full variant="secondary" onClick={copy}>
              {t.copy}
            </Button>
            <span style={{ font: `400 12.5px/1.45 ${font.sans}`, color: c.mute }}>
              {t.linkNote}
            </span>
          </Card>
        )}

        {code && (
          <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            <Label>{t.message}</Label>
            <span style={{ font: `400 12.5px/1.45 ${font.sans}`, color: c.mute }}>
              {t.messageNote}
            </span>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={9}
              style={draftBox}
            />
            <Button full onClick={copyMessage}>
              {t.copyMessage}
            </Button>
          </Card>
        )}

        <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <Label>{t.haveCode}</Label>
          <input
            value={entered}
            onChange={(e) => setEntered(e.target.value)}
            placeholder={t.codePlaceholder}
            style={input}
          />
          <Button full variant="secondary" onClick={accept} disabled={busy || !entered.trim()}>
            {t.accept}
          </Button>
        </Card>

        {note && (
          <div style={{ font: `600 13px ${font.sans}`, color: c.ink, textAlign: "center" }}>
            {note}
          </div>
        )}

        {!isRemote && (
          <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Label>{t.offline}</Label>
            <span style={{ font: `400 13px/1.45 ${font.sans}`, color: c.ink }}>
              {t.offlineNote}
            </span>
          </Card>
        )}
      </div>
    </div>
  );
}

function Pick({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? c.sage : c.bg,
        border: `1.5px solid ${c.ink}`,
        borderRadius: 999,
        boxShadow: `0 2px 0 ${c.ink}`,
        padding: "10px 8px",
        font: `700 13px ${font.sans}`,
        color: c.ink,
        cursor: "pointer",
      }}
      aria-pressed={active}
    >
      {children}
    </button>
  );
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
  display: "flex",
  flexDirection: "column",
  zIndex: 30,
};
const top = { display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 8px" };
const back = {
  width: 36,
  height: 36,
  flexShrink: 0,
  background: c.paper,
  border: `1.5px solid ${c.ink}`,
  borderRadius: "50%",
  boxShadow: `0 2px 0 ${c.ink}`,
  font: "18px/1 sans-serif",
  color: c.ink,
  cursor: "pointer",
};
const body = {
  flex: 1,
  padding: "8px 16px calc(24px + env(safe-area-inset-bottom))",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  overflowY: "auto",
  maxWidth: 560,
  width: "100%",
  margin: "0 auto",
};
const draftBox = {
  width: "100%",
  resize: "vertical",
  background: c.bg,
  border: `1.5px solid ${c.ink}`,
  borderRadius: 24,
  padding: "13px 14px",
  font: `400 14px/1.5 ${font.sans}`,
  color: c.ink,
};
const codeBox = {
  background: c.bg,
  border: `1.5px solid ${c.ink}`,
  borderRadius: 24,
  padding: "11px 13px",
  font: `500 12.5px/1.4 ${font.mono}`,
  color: c.ink,
  wordBreak: "break-all",
};
const input = {
  width: "100%",
  background: c.bg,
  border: `1.5px solid ${c.ink}`,
  borderRadius: 24,
  padding: "11px 13px",
  font: `400 15px ${font.sans}`,
  color: c.ink,
};
