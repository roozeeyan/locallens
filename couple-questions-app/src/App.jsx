import React, { useEffect, useRef, useState } from "react";
import { c, font, applyPalette } from "./theme.js";
import { TabBar } from "./ui.jsx";
import { useStore, actions } from "./store.js";
import { isRemote } from "./backend.js";
import { ensureSession, pullAll, joinByCode, lastSyncError } from "./sync.js";
import { cloudGet, hasCloud } from "./cloud.js";
import Questionnaire from "./screens/Questionnaire.jsx";
import QuestionFlow from "./screens/QuestionFlow.jsx";
import Connections from "./screens/Connections.jsx";
import ConnectionDetail from "./screens/ConnectionDetail.jsx";
import Feed from "./screens/Feed.jsx";
import Profile from "./screens/Profile.jsx";
import InviteSheet from "./screens/InviteSheet.jsx";
import Onboarding from "./screens/Onboarding.jsx";
import Paywall from "./screens/Paywall.jsx";
import Legal from "./screens/Legal.jsx";

const TABS = [
  { id: "form", label: "Анкета" },
  { id: "links", label: "Связи" },
  { id: "feed", label: "Лента", round: true },
  { id: "me", label: "Профиль", round: true },
];

export default function App() {
  const theme = useStore((s) => s.profile.theme);
  const onboarded = useStore((s) => s.profile.onboarded);
  const name = useStore((s) => s.profile.name);
  const [tab, setTab] = useState("form");
  const [openBlock, setOpenBlock] = useState(null);
  const [openConn, setOpenConn] = useState(null);
  const [invite, setInvite] = useState(false);
  const [paywall, setPaywall] = useState(null);
  const [legal, setLegal] = useState(null);
  const lang = useStore((s) => s.profile.lang);
  const [restoring, setRestoring] = useState(() => hasCloud());
  const started = useRef(false);

  useEffect(() => {
    applyPalette(theme);
  }, [theme]);

  // Память браузера внутри Telegram обнуляется между запусками,
  // поэтому анкету и имя достаём из облака Telegram.
  useEffect(() => {
    if (!hasCloud()) return;
    let cancelled = false;
    (async () => {
      // Если Telegram не ответит, запускаемся без копии, а не висим на пустом экране.
      const raw = await Promise.race([
        cloudGet("rgstate"),
        new Promise((r) => setTimeout(() => r(null), 3000)),
      ]);
      if (cancelled) return;
      if (raw) {
        try {
          actions.applyBackup(JSON.parse(raw));
        } catch {
          // копия испорчена — остаёмся на том, что есть
        }
      }
      actions.backupNow(); // первая копия, даже если пользователь ничего не менял
      setRestoring(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Вход на сервер — после восстановления из облака, когда имя уже известно.
  useEffect(() => {
    if (restoring || started.current) return;
    started.current = true;

    if (!isRemote) {
      actions.setSync("local");
      return;
    }
    let cancelled = false;
    actions.setSync("connecting");
    (async () => {
      const uid = await ensureSession();
      if (cancelled) return;
      if (!uid) {
        actions.setSync("error", lastSyncError());
        return;
      }

      // Ссылка вида t.me/бот?startapp=КОД — принимаем приглашение сразу.
      const code = inviteCodeFromLink();
      if (code) await joinByCode(code, name);
      if (cancelled) return;

      const remote = await pullAll(name);
      if (cancelled) return;
      if (remote) actions.applyRemote(remote);
      actions.setSync(remote?.ok ? "online" : "error", remote?.ok ? "" : lastSyncError());
    })();
    return () => {
      cancelled = true;
    };
  }, [restoring]); // eslint-disable-line react-hooks/exhaustive-deps

  if (restoring) return <div style={shell} />;
  if (!onboarded) return <Onboarding />;

  return (
    <div style={shell}>
      <main style={main}>
        {tab === "form" && (
          <Questionnaire onOpenBlock={setOpenBlock} onPaywall={setPaywall} />
        )}
        {tab === "links" && (
          <Connections
            onOpen={setOpenConn}
            onInvite={() => setInvite(true)}
            onPaywall={setPaywall}
          />
        )}
        {tab === "feed" && (
          <Feed onOpenConn={setOpenConn} onGoForm={() => setTab("form")} />
        )}
        {tab === "me" && (
          <Profile onPaywall={() => setPaywall("blocks")} onLegal={setLegal} />
        )}
      </main>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {openBlock && <QuestionFlow catId={openBlock} onClose={() => setOpenBlock(null)} />}
      {openConn && <ConnectionDetail connId={openConn} onClose={() => setOpenConn(null)} />}
      {invite && (
        <InviteSheet
          onClose={() => setInvite(false)}
          onAccepted={async () => {
            const remote = await pullAll(name);
            if (remote) actions.applyRemote(remote);
          }}
        />
      )}
      {paywall && <Paywall reason={paywall} onClose={() => setPaywall(null)} />}
      {legal && <Legal initial={legal} lang={lang} onClose={() => setLegal(null)} />}
    </div>
  );
}

/** Код приглашения приходит либо от Telegram, либо из адреса страницы. */
function inviteCodeFromLink() {
  const fromTg = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
  if (fromTg) return fromTg;
  const params = new URLSearchParams(window.location.search);
  return params.get("startapp") || params.get("invite") || null;
}

const shell = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  background: c.bg,
  color: c.ink,
  fontFamily: font.sans,
};
const main = {
  flex: 1,
  maxWidth: 560,
  width: "100%",
  margin: "0 auto",
  // место под закреплённое меню, чтобы оно не накрывало последнюю карточку
  paddingBottom: "calc(84px + env(safe-area-inset-bottom))",
};
