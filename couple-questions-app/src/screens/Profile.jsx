import React, { useState } from "react";
import { c, font, palettes } from "../theme.js";
import { deleteAccount, resetLogin, pullAll, shareAccess, lastSyncError } from "../sync.js";
import { exportAnswers } from "../export.js";
import { hasAccess, paidBy, TEST_MODE } from "../access.js";
import { Screen, Card, Button, Label, Switch } from "../ui.jsx";
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
    premiumOff: "Все 11 блоков, сколько угодно связей и разбор от ИИ. Платит один — открывается обоим.",
    premiumCta: "Посмотреть, что входит",
    premiumTitle: "Доступ",
    premiumPair: (name) => `Доступ открыл ${name} — он действует на вас обоих.`,
    premiumShared: (name) => `Доступ открыт вам и ${name}.`,
    premiumChoose: "Покупка открывает доступ ещё одному человеку. Выберите, кому:",
    testerOn: "Оплата пропущена в режиме теста. У обычного человека здесь было бы закрыто.",
    testerBack: "Вернуть барьер оплаты",
    premiumOpenFor: (name) => `Открыть ${name}`,
    premiumShareConfirm: (name) =>
      `Открыть доступ для ${name}? Выбрать можно один раз — потом изменить нельзя.`,
    sync: "Синхронизация",
    version: "Версия",
    relogin: "Войти заново",
    relogging: "Входим…",
    reloginNote:
      "Заводит новый вход. Прежние ответы остаются на сервере — чтобы вернуть их, пришлите номер из строки ниже в поддержку.",
    reloginConfirm:
      "Войти заново? Прежние ответы и связи останутся на сервере, но их придётся возвращать через поддержку.",
    newId: "Новый номер входа",
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
    premiumOff: "All 11 blocks, as many connections as you like and the AI summary. One pays, both get it.",
    premiumCta: "See what is included",
    premiumTitle: "Access",
    premiumPair: (name) => `${name} unlocked access — it covers both of you.`,
    premiumShared: (name) => `Access is open for you and ${name}.`,
    premiumChoose: "Your purchase opens access for one more person. Choose who:",
    testerOn: "Payment skipped in test mode. A normal user would be blocked here.",
    testerBack: "Bring the paywall back",
    premiumOpenFor: (name) => `Open for ${name}`,
    premiumShareConfirm: (name) =>
      `Open access for ${name}? You can choose only once — it cannot be changed later.`,
    sync: "Sync",
    version: "Version",
    relogin: "Sign in again",
    relogging: "Signing in…",
    reloginNote:
      "Creates a new sign-in. Previous answers stay on the server — send the number below to support to get them back.",
    reloginConfirm:
      "Sign in again? Previous answers and connections stay on the server, but support has to restore them.",
    newId: "New sign-in number",
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
  const { profile, answers, connections, sync, syncMsg } = useStore();
  const open = hasAccess(profile, connections);
  const byPartner = paidBy(profile, connections);
  const sharedWith = connections.find((x) => x.userId === profile.premiumFor)?.name || "";
  const tester = TEST_MODE && profile.testerUnlocked;
  const mine = totalProgress(answers);
  const lang = profile.lang === "en" ? "en" : "ru";
  const t = T[lang];
  const syncInfo = SYNC[lang][sync] || SYNC[lang].local;
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Выбрать можно один раз: иначе доступ гулял бы по цепочке знакомых.
  async function onShare(conn) {
    if (!window.confirm(t.premiumShareConfirm(conn.name))) return;
    setSharing(true);
    const res = await shareAccess(conn.userId);
    if (res.ok) {
      const remote = await pullAll(profile.name);
      if (remote) actions.applyRemote(remote);
    }
    setSharing(false);
  }
  const [newId, setNewId] = useState("");

  // Вход заново — только по явному подтверждению: прежние ответы остаются
  // на сервере, но привязать их к новому входу может лишь поддержка.
  async function onReset() {
    if (!window.confirm(t.reloginConfirm)) return;
    setResetting(true);
    const res = await resetLogin();
    if (!res.ok) {
      setResetting(false);
      setNewId(res.message);
      return;
    }
    // Вход получен — забираем данные и снимаем красный статус,
    // иначе карточка так и висит с прошлой ошибкой.
    const remote = await pullAll(profile.name);
    if (remote) actions.applyRemote(remote);
    actions.setSync(remote?.ok ? "online" : "error", remote?.ok ? "" : lastSyncError());
    setResetting(false);
    setNewId(`${t.newId}: ${res.id}`);
  }

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
        <span style={{ font: `400 13px ${font.sans}`, color: c.mute }}>
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
                  profile.theme === id ? `2px solid ${c.coral}` : `1.5px solid ${c.ink}`,
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
              <div key={cat.id} style={{ ...blockRow, opacity: hidden ? 0.45 : 1 }}>
                <span style={{ flex: 1, minWidth: 0 }}>{setTitle(cat.id, lang)}</span>
                <Switch
                  on={!hidden}
                  onClick={() => actions.toggleHiddenBlock(cat.id)}
                  label={setTitle(cat.id, lang)}
                />
              </div>
            );
          })}
        </div>
      </Card>

      <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Label>{t.premiumTitle}</Label>
        <p style={{ margin: 0, font: `400 14px/1.45 ${font.sans}`, color: c.ink }}>
          {tester
            ? t.testerOn
            : byPartner
            ? t.premiumPair(byPartner)
            : sharedWith
              ? t.premiumShared(sharedWith)
              : open
                ? t.premiumOn
                : t.premiumOff}
        </p>

        {/* Барьер надо уметь вернуть: иначе посмотреть, где он встаёт,
            можно ровно один раз. */}
        {tester && (
          <Button
            full
            variant="secondary"
            onClick={() => actions.setProfile({ testerUnlocked: false })}
          >
            {t.testerBack}
          </Button>
        )}

        {/* Оплата открывает доступ ещё одному человеку — тому, с кем пара.
            Пока никто не выбран, предлагаем выбрать. */}
        {profile.premium && !profile.premiumFor && connections.length > 0 && (
          <>
            <span style={{ font: `400 13px/1.45 ${font.sans}`, color: c.mute }}>
              {t.premiumChoose}
            </span>
            {connections.map((conn) => (
              <Button
                key={conn.id}
                full
                variant="secondary"
                disabled={sharing}
                onClick={() => onShare(conn)}
              >
                {t.premiumOpenFor(conn.name)}
              </Button>
            ))}
          </>
        )}

        {!open && (
          <Button full onClick={() => onPaywall("blocks")}>
            {t.premiumCta}
          </Button>
        )}
      </Card>

      <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Label>{t.sync}</Label>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ ...dot, background: syncInfo.color }} />
          <span style={{ font: `700 15px ${font.sans}`, color: c.ink }}>{syncInfo.title}</span>
        </div>
        <span style={{ font: `400 13px/1.45 ${font.sans}`, color: c.mute }}>{syncInfo.hint}</span>
        {syncMsg && <div style={errBox}>{syncMsg}</div>}
        {sync === "error" && (
          <>
            <Button full variant="secondary" onClick={onReset} disabled={resetting}>
              {resetting ? t.relogging : t.relogin}
            </Button>
            <span style={{ font: `400 12px/1.45 ${font.sans}`, color: c.mute }}>{t.reloginNote}</span>
          </>
        )}
        {newId && <div style={errBox}>{newId}</div>}
        <span style={{ font: `500 11px ${font.mono}`, color: c.mute }}>
          {t.version} {BUILD} UTC
        </span>
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
        <span style={{ font: `400 13.5px/1.5 ${font.sans}`, color: c.mute }}>{t.dataNote}</span>
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

const input = {
  width: "100%",
  background: c.bg,
  border: `1.5px solid ${c.ink}`,
  borderRadius: 24,
  padding: "11px 13px",
  font: `400 16px ${font.sans}`,
  color: c.ink,
};
const swatch = {
  width: 96,
  height: 62,
  border: `1.5px solid ${c.ink}`,
  borderRadius: 24,
  boxShadow: `0 2px 0 ${c.ink}`,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  cursor: "pointer",
};
// Метка версии: по ней сразу видно, доехала ли до телефона свежая сборка.
// Обновляется вручную при выкатке — так надёжнее, чем подстановка при сборке.
const BUILD = __BUILD_TIME__;

const errBox = {
  background: c.bg,
  border: `1.5px solid ${c.ink}`,
  borderRadius: 20,
  padding: "8px 10px",
  font: `500 11.5px/1.4 ${font.mono}`,
  color: c.ink,
  wordBreak: "break-word",
};
const dot = {
  width: 12,
  height: 12,
  borderRadius: 999,
  border: `1.5px solid ${c.ink}`,
  flexShrink: 0,
};
const swDot = {
  width: 20,
  height: 20,
  borderRadius: 12,
  borderWidth: 2,
  borderStyle: "solid",
};
const blockRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: c.bg,
  border: `1.5px solid ${c.ink}`,
  borderRadius: 999,
  padding: "7px 8px 7px 16px",
  font: `600 14.5px ${font.sans}`,
  color: c.ink,
  transition: "opacity 220ms ease",
};

const rowBtn = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  border: `1.5px solid ${c.ink}`,
  borderRadius: 20,
  padding: "9px 12px",
  font: `600 13px ${font.sans}`,
  color: c.ink,
  cursor: "pointer",
};
