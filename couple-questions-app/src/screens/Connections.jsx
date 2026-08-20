import React from "react";
import { c, font } from "../theme.js";
import { Screen, Card, Button, Progress, Label } from "../ui.jsx";
import { useStore, actions, totalProgress, pending, matchStats } from "../store.js";
import { demoConnection } from "../demo.js";
import { canAddConnection } from "../limits.js";
import { isRemote } from "../backend.js";

export const KIND_LABEL = { partner: "партнёр", candidate: "кандидат", friend: "друг" };

export default function Connections({ onOpen, onInvite, onPaywall }) {
  const { answers, connections, profile, invites } = useStore();
  const canAdd = canAddConnection(profile, connections);
  const mine = totalProgress(answers);
  const sent = invites.length;
  const joined = invites.filter((i) => i.accepted).length;

  return (
    <Screen
      title="Связи"
      subtitle="Люди, с которыми вы проходите анкету. Ответы открываются, только когда вы оба ответили."
    >
      {connections.length === 0 ? (
        <Card pad={18} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Label>Пока пусто</Label>
          <p style={{ margin: 0, font: `400 14.5px/1.5 ${font.sans}`, color: c.ink }}>
            Пригласите партнёра или кандидата — он заполнит свою анкету, и вы увидите, где
            совпадаете, а где стоит поговорить.
          </p>
          <Button full onClick={onInvite}>
            Пригласить
          </Button>
          {!isRemote && (
            <>
              <Button
                full
                variant="secondary"
                onClick={() => actions.addConnection(demoConnection())}
              >
                Добавить демо-связь
              </Button>
              <span style={{ font: `400 12px/1.4 ${font.sans}`, color: c.mute }}>
                Сервер не подключён, поэтому приглашение по ссылке пока не сработает. Демо-связь
                показывает, как всё будет выглядеть.
              </span>
            </>
          )}
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Button full onClick={() => (canAdd ? onInvite() : onPaywall("connections"))}>
            {canAdd ? "Пригласить ещё" : "Пригласить ещё · Premium"}
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
                        {KIND_LABEL[conn.kind] || "связь"}
                        {m.pct !== null && ` · совпадений ${Math.round(m.pct)}%`}
                      </div>
                    </div>
                    <span style={{ font: `600 18px ${font.sans}`, color: c.mute }}>›</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <Row label="Вы" value={mine.done} total={mine.total} pct={mine.pct} />
                    <Row label={conn.name} value={theirs.done} total={theirs.total} pct={theirs.pct} />
                  </div>

                  {(p.waitingMe > 0 || p.waitingThem > 0) && (
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                      {p.waitingMe > 0 && <Tag warm>ждут вашего ответа: {p.waitingMe}</Tag>}
                      {p.waitingThem > 0 && <Tag>ждём {conn.name}: {p.waitingThem}</Tag>}
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
          <Label>Мои приглашения</Label>
          <div style={{ display: "flex", gap: 9 }}>
            <Stat value={sent} caption="отправлено" />
            <Stat value={joined} caption="присоединились" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {invites.map((inv) => (
              <div key={inv.id} style={inviteRow}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  {inv.accepted ? inv.name || "Без имени" : "Ждёт ответа"}
                  <span style={{ color: c.mute }}> · {KIND_LABEL[inv.kind] || "связь"}</span>
                </span>
                <span style={{ font: `600 11px ${font.mono}`, color: c.mute }}>
                  {inv.at ? new Date(inv.at).toLocaleDateString("ru-RU") : ""}
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
