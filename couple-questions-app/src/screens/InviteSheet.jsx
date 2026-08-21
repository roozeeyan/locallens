import React, { useState } from "react";
import { c, font } from "../theme.js";
import { screenHeight } from "../viewport.js";
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
  const name = useStore((s) => s.profile.name);
  const lang = useStore((s) => s.profile.lang);
  const t = T[lang === "en" ? "en" : "ru"];
  const [kind, setKind] = useState("partner");
  const [code, setCode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [entered, setEntered] = useState("");
  const [note, setNote] = useState("");

  const link = code ? `https://t.me/${BOT}?startapp=${code}` : "";

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
            <Button full onClick={copy}>
              {t.copy}
            </Button>
            <span style={{ font: `400 12.5px/1.45 ${font.sans}`, color: c.mute }}>
              {t.linkNote}
            </span>
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
        border: `2px solid ${c.ink}`,
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
  top: 0,
  left: 0,
  right: 0,
  height: screenHeight,
  background: c.bg,
  display: "flex",
  flexDirection: "column",
  zIndex: 25,
};
const top = { display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 8px" };
const back = {
  width: 36,
  height: 36,
  flexShrink: 0,
  background: c.paper,
  border: `2px solid ${c.ink}`,
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
const codeBox = {
  background: c.bg,
  border: `2px solid ${c.ink}`,
  borderRadius: 12,
  padding: "11px 13px",
  font: `500 12.5px/1.4 ${font.mono}`,
  color: c.ink,
  wordBreak: "break-all",
};
const input = {
  width: "100%",
  background: c.bg,
  border: `2px solid ${c.ink}`,
  borderRadius: 12,
  padding: "11px 13px",
  font: `400 15px ${font.sans}`,
  color: c.ink,
};
