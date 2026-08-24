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
    backdrop: "url('/backdrop.jpg')",
    // Полупрозрачная вуаль для полноэкранных слоёв: картинка просвечивает,
    // но текст поверх неё остаётся читаемым.
    veil: "rgba(240, 236, 228, 0.74)",
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
    veil: "rgba(26, 28, 31, 0.86)",
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
    veil: "rgba(244, 231, 228, 0.8)",
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
  root.style.setProperty("--rg-veil", p.veil || p.bg);
  root.style.setProperty("--rg-backdrop", p.backdrop || "none");
  root.style.setProperty("--rg-grain", p.grain ? String(p.grain) : "0");
  // Цвет держим на корне страницы: непрозрачный фон body закрыл бы собой
  // слой с подложкой, который лежит под содержимым.
  root.style.background = p.bg;
  document.body.style.background = "transparent";
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
  veil: "var(--rg-veil)",
};

export const font = {
  serif: '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif',
  sans: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  mono: "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace",
};

export const r = { sm: 20, md: 28, lg: 36, xl: 48, pill: 999 };

// Плотная тень под тонкой рамкой выглядит тяжело — она тоже уменьшена.
export const hard = (n = 2) => `0 ${n}px 0 ${c.ink}`;

// Тонкая обводка: толстая рамка съедала форму на скруглённых блоках.
export const border = `1.5px solid ${c.ink}`;
