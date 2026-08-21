import React, { useState } from "react";
import { c, font, palettes } from "../theme.js";
import { deleteAccount } from "../sync.js";
import { exportAnswers } from "../export.js";
import { Screen, Card, Button, Label } from "../ui.jsx";
import { useStore, actions, CATEGORIES, totalProgress, setTitle } from "../store.js";

const REMINDERS = {
  ru: [
    { id: "twice", label: "2 раза в неделю" },
    { id: "week", label: "Раз в неделю" },
    { id: "off", label: "Выкл" },
  ],
  en: [
    { id: "twice", label: "Twice a week" },
    { id: "week", label: "Once a week" },
    { id: "off", label: "Off" },
  ],
};

const T = {
  ru: {
    title: "Профиль",
    subtitle: "Настройки, приватность и доступ.",
    name: "Имя",
    namePlaceholder: "Как вас видят партнёры",
    filled: (done, total) => `Заполнено ${done} из ${total} вопросов`,
    language: "Язык приложения",
    status: "Статус",
    taken: "В отношениях",
    free: "Свободен",
    statusNote:
      "Статус виден только тем, кого вы сами добавили. Подбор незнакомых людей появится позже — отдельно и с подтверждением.",
    theme: "Оформление",
    reminders: "Напоминания",
    remindersNote:
      "Бот напомнит о разговоре в выбранном ритме. Ежедневных напоминаний нет — разговор вдвоём не бывает ежедневной привычкой.",
    privacy: "Приватность",
    privacyNote: "Скрытые блоки не увидит никто из ваших связей, даже если вы оба ответили.",
    hidden: "скрыт",
    visible: "виден",
    premiumOn: "Доступ открыт. Все блоки, связи без ограничений и разбор от ИИ.",
    premiumOff: "Все 11 блоков, неограниченное число связей, разбор от ИИ и новые колоды.",
    premiumCta: "Посмотреть, что входит",
    sync: "Синхронизация",
    docs: "Документы",
    privacyDoc: "Политика конфиденциальности",
    termsDoc: "Пользовательское соглашение",
    data: "Данные",
    dataNote:
      "Выгрузка соберёт ваши ответы в текст и скопирует его — можно вставить в заметки или отправить себе. Удаление аккаунта стирает ответы и на сервере: партнёры перестанут их видеть. Отменить нельзя.",
    export: "Выгрузить мои ответы",
    exported: "Ответы скопированы. Вставьте их в заметки или в чат.",
    exportedFile: "Файл с ответами сохранён.",
    exportFailed: "Не удалось выгрузить. Попробуйте открыть приложение в браузере.",
    resetLocal: "Сбросить на этом устройстве",
    resetLocalConfirm: "Стереть данные на этом устройстве? На сервере они останутся.",
    deleteAccount: "Удалить аккаунт и все данные",
    deleting: "Удаляем…",
    deleteConfirm1: "Удалить аккаунт и все ответы навсегда? Отменить будет нельзя.",
    deleteConfirm2: "Точно? Партнёры больше не увидят ваши ответы.",
  },
  en: {
    title: "Profile",
    subtitle: "Settings, privacy and access.",
    name: "Name",
    namePlaceholder: "How your partners see you",
    filled: (done, total) => `${done} of ${total} questions answered`,
    language: "App language",
    status: "Status",
    taken: "In a relationship",
    free: "Single",
    statusNote:
      "Your status is visible only to people you added yourself. Matching with strangers will come later — separately and with confirmation.",
    theme: "Appearance",
    reminders: "Reminders",
    remindersNote:
      "The bot will remind you at the pace you choose. There are no daily reminders — a conversation between two people is not a daily habit.",
    privacy: "Privacy",
    privacyNote: "Hidden blocks stay invisible to your connections, even when you both answered.",
    hidden: "hidden",
    visible: "visible",
    premiumOn: "Access is open. All blocks, unlimited connections and the AI summary.",
    premiumOff: "All 11 blocks, unlimited connections, the AI summary and new decks.",
    premiumCta: "See what is included",
    sync: "Sync",
    docs: "Documents",
    privacyDoc: "Privacy policy",
    termsDoc: "Terms of use",
    data: "Data",
    dataNote:
      "Export collects your answers into text and copies it — paste it into notes or send it to yourself. Deleting your account erases answers from the server too: partners will stop seeing them. This cannot be undone.",
    export: "Export my answers",
    exported: "Answers copied. Paste them into notes or a chat.",
    exportedFile: "The file with your answers has been saved.",
    exportFailed: "Export failed. Try opening the app in a browser.",
    resetLocal: "Reset on this device",
    resetLocalConfirm: "Erase data on this device? It will remain on the server.",
    deleteAccount: "Delete account and all data",
    deleting: "Deleting…",
    deleteConfirm1: "Delete your account and all answers for good? This cannot be undone.",
    deleteConfirm2: "Are you sure? Partners will no longer see your answers.",
  },
};

const SYNC = {
  ru: {
    local: {
      color: "#9AA0A6",
      title: "Только на этом устройстве",
      hint: "Ответы хранятся в браузере. Приглашения и сравнение с партнёром не работают.",
    },
    connecting: {
      color: "#E8B23A",
      title: "Подключаемся…",
      hint: "Секунду, забираем ваши данные с сервера.",
    },
    online: {
      color: "#3FA860",
      title: "Подключено",
      hint: "Ответы сохраняются на сервере и доступны с любого устройства.",
    },
    error: {
      color: "#D4553F",
      title: "Сервер не отвечает",
      hint: "Проверьте интернет и откройте приложение заново. Ответы пока сохраняются локально.",
    },
  },
  en: {
    local: {
      color: "#9AA0A6",
      title: "This device only",
      hint: "Answers stay in the browser. Invitations and comparison do not work.",
    },
    connecting: {
      color: "#E8B23A",
      title: "Connecting…",
      hint: "One moment, fetching your data from the server.",
    },
    online: {
      color: "#3FA860",
      title: "Connected",
      hint: "Answers are saved on the server and available from any device.",
    },
    error: {
      color: "#D4553F",
      title: "Server not responding",
      hint: "Check your connection and reopen the app. Answers are kept locally for now.",
    },
  },
};

export default function Profile({ onPaywall, onLegal }) {
  const { profile, answers, sync, syncMsg } = useStore();
  const mine = totalProgress(answers);
  const lang = profile.lang === "en" ? "en" : "ru";
  const t = T[lang];
  const syncInfo = SYNC[lang][sync] || SYNC[lang].local;
  const [busy, setBusy] = useState(false);

  return (
    <Screen title={t.title} subtitle={t.subtitle}>
      <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <Label>{t.name}</Label>
        <input
          value={profile.name}
          onChange={(e) => actions.setProfile({ name: e.target.value })}
          placeholder={t.namePlaceholder}
          style={input}
        />
        <span style={{ font: `400 12px ${font.sans}`, color: c.mute }}>
          {t.filled(mine.done, mine.total)}
        </span>
      </Card>

      <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <Label>{t.language}</Label>
        <div style={{ display: "flex", gap: 8 }}>
          <Toggle
            active={(profile.lang || "ru") === "ru"}
            onClick={() => actions.setProfile({ lang: "ru" })}
          >
            Русский
          </Toggle>
          <Toggle
            active={profile.lang === "en"}
            onClick={() => actions.setProfile({ lang: "en" })}
          >
            English
          </Toggle>
        </div>
      </Card>

      <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <Label>{t.status}</Label>
        <div style={{ display: "flex", gap: 8 }}>
          <Toggle
            active={profile.status === "taken"}
            onClick={() => actions.setProfile({ status: "taken" })}
          >
            {t.taken}
          </Toggle>
          <Toggle
            active={profile.status === "free"}
            onClick={() => actions.setProfile({ status: "free" })}
          >
            {t.free}
          </Toggle>
        </div>
        <span style={{ font: `400 12px/1.4 ${font.sans}`, color: c.mute }}>
          {t.statusNote}
        </span>
      </Card>

      <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <Label>{t.theme}</Label>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          {Object.entries(palettes).map(([id, p]) => (
            <button
              key={id}
              onClick={() => actions.setProfile({ theme: id })}
              style={{
                ...swatch,
                background: p.bg,
                border:
                  profile.theme === id ? `3px solid ${c.coral}` : `2px solid ${c.ink}`,
              }}
              aria-label={lang === "en" ? p.nameEn : p.name}
              aria-pressed={profile.theme === id}
            >
              <span style={{ ...swDot, background: p.accent, borderColor: p.ink }} />
              <span style={{ font: `600 11px ${font.sans}`, color: p.ink }}>{lang === "en" ? p.nameEn : p.name}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <Label>{t.reminders}</Label>
        <div style={{ display: "flex", gap: 8 }}>
          {REMINDERS[lang].map((r) => (
            <Toggle
              key={r.id}
              active={profile.reminder === r.id}
              onClick={() => actions.setProfile({ reminder: r.id })}
            >
              {r.label}
            </Toggle>
          ))}
        </div>
        <span style={{ font: `400 12px/1.4 ${font.sans}`, color: c.mute }}>
          {t.remindersNote}
        </span>
      </Card>

      <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <Label>{t.privacy}</Label>
        <span style={{ font: `400 13px/1.45 ${font.sans}`, color: c.ink }}>
          {t.privacyNote}
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {CATEGORIES.map((cat) => {
            const hidden = profile.hiddenBlocks.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => actions.toggleHiddenBlock(cat.id)}
                style={{ ...rowBtn, background: hidden ? c.coral : c.bg, color: hidden ? c.onCoral : c.ink }}
                aria-pressed={hidden}
              >
                <span style={{ flex: 1, textAlign: "left" }}>
                  {setTitle(cat.id, lang)}
                </span>
                <span style={{ font: `600 11px ${font.mono}`, opacity: 0.75 }}>
                  {hidden ? t.hidden : t.visible}
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
            {t.premiumOn}
          </p>
        ) : (
          <>
            <p style={{ margin: 0, font: `400 14px/1.5 ${font.sans}`, color: c.ink }}>
              {t.premiumOff}
            </p>
            <Button full onClick={onPaywall}>
              {t.premiumCta}
            </Button>
          </>
        )}
      </Card>

      <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Label>{t.sync}</Label>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ ...dot, background: syncInfo.color }} />
          <span style={{ font: `700 14px ${font.sans}`, color: c.ink }}>{syncInfo.title}</span>
        </div>
        <span style={{ font: `400 12px/1.45 ${font.sans}`, color: c.mute }}>{syncInfo.hint}</span>
        {syncMsg && <div style={errBox}>{syncMsg}</div>}
      </Card>

      <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Label>{t.docs}</Label>
        <Button full variant="secondary" onClick={() => onLegal("privacy")}>
          {t.privacyDoc}
        </Button>
        <Button full variant="secondary" onClick={() => onLegal("terms")}>
          {t.termsDoc}
        </Button>
      </Card>

      <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Label>{t.data}</Label>
        <span style={{ font: `400 12.5px/1.45 ${font.sans}`, color: c.mute }}>{t.dataNote}</span>
        <Button
          full
          variant="secondary"
          onClick={async () => {
            const res = await exportAnswers(answers, profile);
            if (res.copied) alert(t.exported);
            else if (res.saved) alert(t.exportedFile);
            else alert(t.exportFailed);
          }}
        >
          {t.export}
        </Button>
        <Button
          full
          variant="secondary"
          onClick={() => {
            if (confirm(t.resetLocalConfirm)) {
              actions.reset();
            }
          }}
        >
          {t.resetLocal}
        </Button>
        <Button
          full
          variant="secondary"
          disabled={busy}
          style={{ background: c.coral, color: c.onCoral }}
          onClick={async () => {
            if (!confirm(t.deleteConfirm1)) return;
            if (!confirm(t.deleteConfirm2)) return;
            setBusy(true);
            const res = await deleteAccount();
            setBusy(false);
            if (res.ok) actions.reset();
            else alert(`Не получилось удалить: ${res.message}`);
          }}
        >
          {busy ? t.deleting : t.deleteAccount}
        </Button>
      </Card>
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
const errBox = {
  background: c.bg,
  border: `2px solid ${c.ink}`,
  borderRadius: 10,
  padding: "8px 10px",
  font: `500 11.5px/1.4 ${font.mono}`,
  color: c.ink,
  wordBreak: "break-word",
};
const dot = {
  width: 12,
  height: 12,
  borderRadius: 999,
  border: `2px solid ${c.ink}`,
  flexShrink: 0,
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
