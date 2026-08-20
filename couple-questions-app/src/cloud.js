// Хранилище Telegram, привязанное к аккаунту пользователя.
//
// Память браузера внутри Telegram живёт недолго: приложение открывается
// заново и оказывается пустым. CloudStorage переживает перезапуск и
// переезд на другое устройство.
//
// Ограничение Telegram: одно значение не длиннее 4096 символов, поэтому
// длинный текст режется на куски, а их число хранится в отдельном ключе.

const api = () => window.Telegram?.WebApp?.CloudStorage;

export const hasCloud = () => typeof api()?.setItem === "function";

const CHUNK = 3800;
const MAX_PARTS = 80;

function setItem(key, value) {
  return new Promise((resolve) => {
    try {
      api().setItem(key, value, (err, ok) => resolve(!err && ok !== false));
    } catch {
      resolve(false);
    }
  });
}

function getItems(keys) {
  return new Promise((resolve) => {
    if (!keys.length) return resolve({});
    try {
      api().getItems(keys, (err, res) => resolve(err ? {} : res || {}));
    } catch {
      resolve({});
    }
  });
}

function removeItems(keys) {
  return new Promise((resolve) => {
    if (!keys.length) return resolve(true);
    try {
      api().removeItems(keys, () => resolve(true));
    } catch {
      resolve(false);
    }
  });
}

export async function cloudSet(prefix, text) {
  if (!hasCloud()) return false;

  const parts = [];
  for (let i = 0; i < text.length; i += CHUNK) parts.push(text.slice(i, i + CHUNK));
  if (parts.length > MAX_PARTS) return false;

  const head = await getItems([`${prefix}_n`]);
  const before = Number(head[`${prefix}_n`] || 0);

  const written = await Promise.all(parts.map((p, i) => setItem(`${prefix}_${i}`, p)));
  if (written.some((ok) => !ok)) return false;
  await setItem(`${prefix}_n`, String(parts.length));

  const stale = [];
  for (let i = parts.length; i < before; i++) stale.push(`${prefix}_${i}`);
  await removeItems(stale);
  return true;
}

export async function cloudGet(prefix) {
  if (!hasCloud()) return null;

  const head = await getItems([`${prefix}_n`]);
  const n = Number(head[`${prefix}_n`] || 0);
  if (!n) return null;

  const keys = Array.from({ length: n }, (_, i) => `${prefix}_${i}`);
  const items = await getItems(keys);

  let out = "";
  for (const k of keys) {
    if (items[k] == null) return null; // кусок потерялся — данным верить нельзя
    out += items[k];
  }
  return out;
}
