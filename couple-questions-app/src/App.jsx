import React, { useEffect, useState } from "react";
import { c, font, applyPalette } from "./theme.js";
import { TabBar } from "./ui.jsx";
import { useStore, actions } from "./store.js";
import { isRemote } from "./backend.js";
import { ensureSession, pullAll, joinByCode, lastSyncError } from "./sync.js";
import Questionnaire from "./screens/Questionnaire.jsx";
import QuestionFlow from "./screens/QuestionFlow.jsx";
import Connections from "./screens/Connections.jsx";
import ConnectionDetail from "./screens/ConnectionDetail.jsx";
import Feed from "./screens/Feed.jsx";
import Profile from "./screens/Profile.jsx";
import InviteSheet from "./screens/InviteSheet.jsx";
import Onboarding from "./screens/Onboarding.jsx";
import Paywall from "./screens/Paywall.jsx";

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

  useEffect(() => {
    applyPalette(theme);
  }, [theme]);

  // Первый заход: входим и подтягиваем всё, что есть на сервере.
  useEffect(() => {
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        {tab === "me" && <Profile onPaywall={() => setPaywall("blocks")} />}
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
const main = { flex: 1, maxWidth: 560, width: "100%", margin: "0 auto" };
