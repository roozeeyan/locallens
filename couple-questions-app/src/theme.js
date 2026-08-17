export const c = {
  bg: "#EFEBE2",
  paper: "#FBFAF7",
  sage: "#A6C7C4",
  sageDark: "#8FB3B0",
  coral: "#EE8E79",
  ink: "#15181A",
  mute: "#8A8F8B",
  line: "#15181A",
  ok: "#8FB58A",
};

export const font = {
  serif: '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif',
  sans: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  mono: 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',
};

export const r = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };

export const sp = (n) => n * 4;

// Жёсткая тень — базовый приём всей системы
export const hard = (n = 3, color = c.ink) => `0 ${n}px 0 ${color}`;

export const border = `2px solid ${c.ink}`;
