import React, { useState } from "react";
import { c, font } from "../theme.js";
import { Card, Button, Label } from "../ui.jsx";
import { isRemote, makeInviteCode } from "../backend.js";
import { createInviteRemote, joinByCode } from "../sync.js";
import { useStore } from "../store.js";

const BOT = "relationship_game_by_roo_bot";

export default function InviteSheet({ onClose, onAccepted }) {
  const name = useStore((s) => s.profile.name);
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
      setNote("Ссылка скопирована");
    } catch {
      setNote("Скопируйте ссылку вручную");
    }
  };

  const accept = async () => {
    const v = entered.trim();
    if (!v) return;
    if (!isRemote) {
      setNote("Приглашения заработают, когда подключим сервер.");
      return;
    }
    setBusy(true);
    const res = await joinByCode(v, name);
    setBusy(false);
    if (res.ok) {
      onAccepted?.();
      onClose();
    } else {
      setNote(res.message || "Код не подошёл");
    }
  };

  return (
    <div style={wrap}>
      <div style={top}>
        <button onClick={onClose} style={back} aria-label="Назад">
          ←
        </button>
        <div style={{ font: `700 19px ${font.serif}`, color: c.ink }}>Пригласить</div>
      </div>

      <div style={body}>
        <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <Label>Кого добавляете</Label>
          <div style={{ display: "flex", gap: 8 }}>
            <Pick active={kind === "partner"} onClick={() => setKind("partner")}>
              Партнёра
            </Pick>
            <Pick active={kind === "candidate"} onClick={() => setKind("candidate")}>
              Кандидата
            </Pick>
          </div>
          <span style={{ font: `400 12.5px/1.45 ${font.sans}`, color: c.mute }}>
            {kind === "partner"
              ? "Человек, с которым вы уже вместе."
              : "Человек, которого вы рассматриваете. Таких можно добавлять сколько угодно."}
          </span>
        </Card>

        {!code ? (
          <Button full onClick={generate} disabled={busy}>
            {busy ? "Создаём…" : "Создать приглашение"}
          </Button>
        ) : (
          <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            <Label>Ссылка-приглашение</Label>
            <div style={codeBox}>{link}</div>
            <Button full onClick={copy}>
              Скопировать ссылку
            </Button>
            <span style={{ font: `400 12.5px/1.45 ${font.sans}`, color: c.mute }}>
              Отправьте её в личном сообщении. Человек откроет приложение, заполнит свою
              анкету — и вы увидите, где совпадаете.
            </span>
          </Card>
        )}

        <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <Label>У меня есть код</Label>
          <input
            value={entered}
            onChange={(e) => setEntered(e.target.value)}
            placeholder="Код из приглашения"
            style={input}
          />
          <Button full variant="secondary" onClick={accept} disabled={busy || !entered.trim()}>
            Принять приглашение
          </Button>
        </Card>

        {note && (
          <div style={{ font: `600 13px ${font.sans}`, color: c.ink, textAlign: "center" }}>
            {note}
          </div>
        )}

        {!isRemote && (
          <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Label>Сервер не подключён</Label>
            <span style={{ font: `400 13px/1.45 ${font.sans}`, color: c.ink }}>
              Ссылку можно создать и посмотреть, но принять приглашение пока нельзя — для
              этого нужен общий сервер.
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
  inset: 0,
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
