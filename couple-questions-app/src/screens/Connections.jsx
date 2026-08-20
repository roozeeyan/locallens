import React from "react";
import { c, font } from "../theme.js";
import { Screen, Card, Button, Progress, Label } from "../ui.jsx";
import { useStore, actions, totalProgress, pending, matchStats } from "../store.js";
import { demoConnection } from "../demo.js";
import { canAddConnection } from "../limits.js";
import { isRemote } from "../backend.js";

export const KIND_LABEL = {
  ru: { partner: "партнёр", candidate: "кандидат", friend: "друг", other: "связь" },
  en: { partner: "partner", candidate: "candidate", friend: "friend", other: "connection" },
};

const T = {
  ru: {
    title: "Связи",
    subtitle:
      "Люди, с которыми вы проходите анкету. Ответы открываются, только когда вы оба ответили.",
    empty: "Пока пусто",
    emptyBody:
      "Пригласите партнёра или кандидата — он заполнит свою анкету, и вы увидите, где совпадаете, а где стоит поговорить.",
    invite: "Пригласить",
    demo: "Добавить демо-связь",
    demoNote:
      "Сервер не подключён, поэтому приглашение по ссылке пока не сработает. Демо-связь показывает, как всё будет выглядеть.",
    more: "Пригласить ещё",
    morePremium: "Пригласить ещё · Premium",
    match: (n) => ` · совпадений ${n}%`,
    you: "Вы",
    waitingMe: (n) => `ждут вашего ответа: ${n}`,
    waitingThem: (name, n) => `ждём ${name}: ${n}`,
    invites: "Мои приглашения",
    sent: "отправлено",
    joined: "присоединились",
    noName: "Без имени",
    pending: "Ждёт ответа",
    locale: "ru-RU",
  },
  en: {
    title: "People",
    subtitle:
      "People taking the questionnaire with you. Answers open only once you have both answered.",
    empty: "Nothing here yet",
    emptyBody:
      "Invite a partner or a candidate — they fill in their own answers, and you see where you agree and what is worth talking about.",
    invite: "Invite",
    demo: "Add a demo connection",
    demoNote:
      "The server is not connected, so an invitation link will not work yet. The demo connection shows how it will look.",
    more: "Invite someone else",
    morePremium: "Invite someone else · Premium",
    match: (n) => ` · ${n}% match`,
    you: "You",
    waitingMe: (n) => `waiting for your answer: ${n}`,
    waitingThem: (name, n) => `waiting for ${name}: ${n}`,
    invites: "My invitations",
    sent: "sent",
    joined: "joined",
    noName: "No name",
    pending: "Waiting",
    locale: "en-GB",
  },
};

export default function Connections({ onOpen, onInvite, onPaywall }) {
  const { answers, connections, profile, invites } = useStore();
  const lang = profile.lang === "en" ? "en" : "ru";
  const t = T[lang];
  const kinds = KIND_LABEL[lang];
  const canAdd = canAddConnection(profile, connections);
  const mine = totalProgress(answers);
  const sent = invites.length;
  const joined = invites.filter((i) => i.accepted).length;

  return (
    <Screen title={t.title} subtitle={t.subtitle}>
      {connections.length === 0 ? (
        <Card pad={18} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Label>{t.empty}</Label>
          <p style={{ margin: 0, font: `400 14.5px/1.5 ${font.sans}`, color: c.ink }}>
            {t.emptyBody}
          </p>
          <Button full onClick={onInvite}>
            {t.invite}
          </Button>
          {!isRemote && (
            <>
              <Button
                full
                variant="secondary"
                onClick={() => actions.addConnection(demoConnection())}
              >
                {t.demo}
              </Button>
              <span style={{ font: `400 12px/1.4 ${font.sans}`, color: c.mute }}>{t.demoNote}</span>
            </>
          )}
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Button full onClick={() => (canAdd ? onInvite() : onPaywall("connections"))}>
            {canAdd ? t.more : t.morePremium}
          </Button>
          {connections.map((conn) => {
            const p = pending(answers, conn);
            const m = matchStats(conn);
            const theirs = totalProgress(conn.answers);
            return (
              <Card key={conn.id} onClick={() => onOpen(conn.id)} pad={14}>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <span style={avatar}>{conn.name.slice(0, 1).toUpperCase()}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: `700 15px ${font.sans}`, color: c.ink }}>{conn.name}</div>
                      <div style={{ font: `400 12px ${font.sans}`, color: c.mute }}>
                        {kinds[conn.kind] || kinds.other}
                        {m.pct !== null && t.match(Math.round(m.pct))}
                      </div>
                    </div>
                    <span style={{ font: `600 18px ${font.sans}`, color: c.mute }}>›</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <Row label={t.you} value={mine.done} total={mine.total} pct={mine.pct} />
                    <Row label={conn.name} value={theirs.done} total={theirs.total} pct={theirs.pct} />
                  </div>

                  {(p.waitingMe > 0 || p.waitingThem > 0) && (
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                      {p.waitingMe > 0 && <Tag warm>{t.waitingMe(p.waitingMe)}</Tag>}
                      {p.waitingThem > 0 && <Tag>{t.waitingThem(conn.name, p.waitingThem)}</Tag>}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {isRemote && sent > 0 && (
        <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <Label>{t.invites}</Label>
          <div style={{ display: "flex", gap: 9 }}>
            <Stat value={sent} caption={t.sent} />
            <Stat value={joined} caption={t.joined} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {invites.map((inv) => (
              <div key={inv.id} style={inviteRow}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  {inv.accepted ? inv.name || t.noName : t.pending}
                  <span style={{ color: c.mute }}> · {kinds[inv.kind] || kinds.other}</span>
                </span>
                <span style={{ font: `600 11px ${font.mono}`, color: c.mute }}>
                  {inv.at ? new Date(inv.at).toLocaleDateString(t.locale) : ""}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </Screen>
  );
}

function Stat({ value, caption }) {
  return (
    <div style={statBox}>
      <div style={{ font: `700 22px ${font.serif}`, color: c.ink }}>{value}</div>
      <div style={{ font: `400 11.5px ${font.sans}`, color: c.mute }}>{caption}</div>
    </div>
  );
}

function Row({ label, value, total, pct }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <span
        style={{
          font: `600 11.5px ${font.sans}`,
          color: c.mute,
          width: 62,
          flexShrink: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1 }}>
        <Progress value={pct} height={7} />
      </div>
      <span style={{ font: `600 11.5px ${font.mono}`, color: c.mute, whiteSpace: "nowrap" }}>
        {value}/{total}
      </span>
    </div>
  );
}

function Tag({ children, warm }) {
  return (
    <span
      style={{
        font: `600 11px ${font.sans}`,
        color: c.ink,
        background: warm ? c.coral : c.bg,
        border: `2px solid ${c.ink}`,
        borderRadius: 999,
        padding: "3px 9px",
      }}
    >
      {children}
    </span>
  );
}

const statBox = {
  flex: 1,
  background: c.bg,
  border: `2px solid ${c.ink}`,
  borderRadius: 12,
  padding: "9px 12px",
};
const inviteRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  font: `600 12.5px ${font.sans}`,
  color: c.ink,
  borderTop: `1px solid ${c.mute}33`,
  paddingTop: 6,
};
const avatar = {
  width: 38,
  height: 38,
  flexShrink: 0,
  borderRadius: "50%",
  background: c.sage,
  border: `2px solid ${c.ink}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  font: `700 15px ${font.serif}`,
  color: c.ink,
};
