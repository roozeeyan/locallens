// Палитры. Компоненты обращаются к цветам через CSS-переменные,
// поэтому смена темы не требует перерисовки дерева.
export const palettes = {
  cream: {
    name: "Кремовая",
    nameEn: "Cream",
    bg: "#EFEBE2",
    paper: "#FBFAF7",
    accent: "#B6CDDD",
    warm: "#74362D",
    onWarm: "#F6F2EA",
    ink: "#452928",
    mute: "#8A7C76",
    // Подложка страницы: размытое бордовое пятно на холодном светлом поле.
    // Держим её приглушённой — поверх лежит текст, и он должен читаться.
    backdrop: [
      "radial-gradient(54% 36% at 50% 40%, rgba(116,54,45,0.38) 0%, rgba(116,54,45,0.19) 48%, rgba(116,54,45,0) 76%)",
      "radial-gradient(64% 42% at 16% 12%, rgba(141,178,205,0.46) 0%, rgba(150,183,206,0) 62%)",
      "radial-gradient(58% 40% at 88% 82%, rgba(141,178,205,0.40) 0%, rgba(150,183,206,0) 64%)",
      "radial-gradient(70% 48% at 78% 22%, rgba(247,244,238,0.55) 0%, rgba(247,244,238,0) 60%)",
      "linear-gradient(180deg, #F2EEE7 0%, #EFEBE2 55%, #F1EDE6 100%)",
    ].join(", "),
  },
  night: {
    name: "Ночная",
    nameEn: "Night",
    bg: "#1A1C1F",
    paper: "#25292D",
    accent: "#4A7690",
    warm: "#8E453A",
    onWarm: "#F6F2EA",
    ink: "#F0EDE7",
    mute: "#8E9490",
  },
  rose: {
    name: "Розовая",
    nameEn: "Rose",
    bg: "#F4E7E4",
    paper: "#FDF8F7",
    accent: "#E0A69C",
    warm: "#74362D",
    onWarm: "#F9F2EF",
    ink: "#2B1E1C",
    mute: "#9A8582",
  },
};

export const DEFAULT_PALETTE = "cream";

export function applyPalette(id) {
  const p = palettes[id] || palettes[DEFAULT_PALETTE];
  const root = document.documentElement;
  root.style.setProperty("--rg-bg", p.bg);
  root.style.setProperty("--rg-paper", p.paper);
  root.style.setProperty("--rg-accent", p.accent);
  root.style.setProperty("--rg-warm", p.warm);
  root.style.setProperty("--rg-on-warm", p.onWarm || p.ink);
  root.style.setProperty("--rg-ink", p.ink);
  root.style.setProperty("--rg-mute", p.mute);
  document.body.style.background = p.backdrop || p.bg;
  document.body.style.backgroundAttachment = p.backdrop ? "fixed" : "";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", p.bg);
}

export const c = {
  bg: "var(--rg-bg)",
  paper: "var(--rg-paper)",
  sage: "var(--rg-accent)",
  coral: "var(--rg-warm)",
  // Текст поверх тёмной метки: на burgundy тёмное не читается.
  onCoral: "var(--rg-on-warm)",
  ink: "var(--rg-ink)",
  mute: "var(--rg-mute)",
};

export const font = {
  serif: '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif',
  sans: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  mono: "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace",
};

export const r = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };

export const hard = (n = 3) => `0 ${n}px 0 ${c.ink}`;

export const border = `2px solid ${c.ink}`;
