import React, { useEffect, useState } from "react";
import { c, font, applyPalette } from "./theme.js";
import { TabBar } from "./ui.jsx";
import { useStore } from "./store.js";
import Questionnaire from "./screens/Questionnaire.jsx";
import QuestionFlow from "./screens/QuestionFlow.jsx";
import Connections from "./screens/Connections.jsx";
import ConnectionDetail from "./screens/ConnectionDetail.jsx";
import Feed from "./screens/Feed.jsx";
import Profile from "./screens/Profile.jsx";
import InviteSheet from "./screens/InviteSheet.jsx";

const TABS = [
  { id: "form", label: "Анкета" },
  { id: "links", label: "Связи" },
  { id: "feed", label: "Лента", round: true },
  { id: "me", label: "Профиль", round: true },
];

export default function App() {
  const theme = useStore((s) => s.profile.theme);
  const [tab, setTab] = useState("form");
  const [openBlock, setOpenBlock] = useState(null);
  const [openConn, setOpenConn] = useState(null);
  const [invite, setInvite] = useState(false);

  useEffect(() => {
    applyPalette(theme);
  }, [theme]);

  return (
    <div style={shell}>
      <main style={main}>
        {tab === "form" && <Questionnaire onOpenBlock={setOpenBlock} />}
        {tab === "links" && (
          <Connections onOpen={setOpenConn} onInvite={() => setInvite(true)} />
        )}
        {tab === "feed" && (
          <Feed onOpenConn={setOpenConn} onGoForm={() => setTab("form")} />
        )}
        {tab === "me" && <Profile />}
      </main>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {openBlock && <QuestionFlow catId={openBlock} onClose={() => setOpenBlock(null)} />}
      {openConn && <ConnectionDetail connId={openConn} onClose={() => setOpenConn(null)} />}
      {invite && <InviteSheet onClose={() => setInvite(false)} />}
    </div>
  );
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
