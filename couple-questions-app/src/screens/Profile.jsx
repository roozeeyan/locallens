import React from "react";
import { c, font, palettes } from "../theme.js";
import { Screen, Card, Button, Label } from "../ui.jsx";
import { useStore, actions, CATEGORIES, totalProgress } from "../store.js";

export default function Profile({ onPaywall }) {
  const { profile, answers } = useStore();
  const mine = totalProgress(answers);

  return (
    <Screen title="Профиль" subtitle="Настройки, приватность и доступ.">
      <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <Label>Имя</Label>
        <input
          value={profile.name}
          onChange={(e) => actions.setProfile({ name: e.target.value })}
          placeholder="Как вас видят партнёры"
          style={input}
        />
        <span style={{ font: `400 12px ${font.sans}`, color: c.mute }}>
          Заполнено {mine.done} из {mine.total} вопросов
        </span>
      </Card>

      <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <Label>Статус</Label>
        <div style={{ display: "flex", gap: 8 }}>
          <Toggle
            active={profile.status === "taken"}
            onClick={() => actions.setProfile({ status: "taken" })}
          >
            В отношениях
          </Toggle>
          <Toggle
            active={profile.status === "free"}
            onClick={() => actions.setProfile({ status: "free" })}
          >
            Свободен
          </Toggle>
        </div>
        <span style={{ font: `400 12px/1.4 ${font.sans}`, color: c.mute }}>
          Статус виден только тем, кого вы сами добавили. Подбор незнакомых людей появится
          позже — отдельно и с подтверждением.
        </span>
      </Card>

      <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <Label>Оформление</Label>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          {Object.entries(palettes).map(([id, p]) => (
            <button
              key={id}
              onClick={() => actions.setProfile({ theme: id })}
              style={{
                ...swatch,
                background: p.bg,
                outline: profile.theme === id ? `3px solid ${c.coral}` : "none",
                outlineOffset: 2,
              }}
              aria-label={p.name}
              aria-pressed={profile.theme === id}
            >
              <span style={{ ...swDot, background: p.accent, borderColor: p.ink }} />
              <span style={{ font: `600 11px ${font.sans}`, color: p.ink }}>{p.name}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <Label>Приватность</Label>
        <span style={{ font: `400 13px/1.45 ${font.sans}`, color: c.ink }}>
          Скрытые блоки не увидит никто из ваших связей, даже если вы оба ответили.
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {CATEGORIES.map((cat) => {
            const hidden = profile.hiddenBlocks.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => actions.toggleHiddenBlock(cat.id)}
                style={{ ...rowBtn, background: hidden ? c.coral : c.bg }}
                aria-pressed={hidden}
              >
                <span style={{ flex: 1, textAlign: "left" }}>
                  {cat.ru.replace(/^Блок \d+\.\s*/, "")}
                </span>
                <span style={{ font: `600 11px ${font.mono}`, opacity: 0.75 }}>
                  {hidden ? "скрыт" : "виден"}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card pad={16} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Label>Premium</Label>
        {profile.premium ? (
          <p style={{ margin: 0, font: `400 14px/1.5 ${font.sans}`, color: c.ink }}>
            Доступ открыт. Все блоки, связи без ограничений и разбор от ИИ.
          </p>
        ) : (
          <>
            <p style={{ margin: 0, font: `400 14px/1.5 ${font.sans}`, color: c.ink }}>
              Все 11 блоков, неограниченное число связей, разбор от ИИ и новые колоды.
            </p>
            <Button full onClick={onPaywall}>
              Посмотреть, что входит
            </Button>
          </>
        )}
      </Card>

      <Button
        full
        variant="secondary"
        onClick={() => {
          if (confirm("Стереть все ответы, связи и настройки? Отменить будет нельзя.")) {
            actions.reset();
          }
        }}
      >
        Сбросить все данные
      </Button>
    </Screen>
  );
}

function Toggle({ children, active, onClick }) {
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

const input = {
  width: "100%",
  background: c.bg,
  border: `2px solid ${c.ink}`,
  borderRadius: 12,
  padding: "11px 13px",
  font: `400 15px ${font.sans}`,
  color: c.ink,
};
const swatch = {
  width: 96,
  height: 62,
  border: `2px solid ${c.ink}`,
  borderRadius: 12,
  boxShadow: `0 2px 0 ${c.ink}`,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  cursor: "pointer",
};
const swDot = {
  width: 20,
  height: 20,
  borderRadius: 6,
  borderWidth: 2,
  borderStyle: "solid",
};
const rowBtn = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  border: `2px solid ${c.ink}`,
  borderRadius: 10,
  padding: "9px 12px",
  font: `600 13px ${font.sans}`,
  color: c.ink,
  cursor: "pointer",
};
