// Палитры. Компоненты обращаются к цветам через CSS-переменные,
// поэтому смена темы не требует перерисовки дерева.
export const palettes = {
  cream: {
    name: "Кремовая",
    nameEn: "Cream",
    bg: "#EFEBE2",
    paper: "#FBFAF7",
    accent: "#9DBCD1",
    warm: "#74362D",
    onWarm: "#F6F2EA",
    ink: "#452928",
    mute: "#8A7C76",
  },
  night: {
    name: "Ночная",
    nameEn: "Night",
    bg: "#1A1C1F",
    paper: "#25292D",
    accent: "#9DBCD1",
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
  document.body.style.background = p.bg;
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
