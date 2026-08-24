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

// Возвращает null, если прочитать не удалось: пустое хранилище и сбой
// связи — разные вещи, и путать их нельзя (на этом терялись аккаунты).
function getItems(keys) {
  return new Promise((resolve) => {
    if (!keys.length) return resolve({});
    try {
      api().getItems(keys, (err, res) => resolve(err ? null : res || {}));
    } catch {
      resolve(null);
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

/**
 * Читает значение. Три разных исхода:
 *   строка    — значение есть;
 *   null      — хранилище пустое;
 *   undefined — прочитать не удалось.
 */
export async function cloudGet(prefix) {
  if (!hasCloud()) return null;

  const head = await getItems([`${prefix}_n`]);
  if (head === null) return undefined;

  const n = Number(head[`${prefix}_n`] || 0);
  if (!n) return null;

  const keys = Array.from({ length: n }, (_, i) => `${prefix}_${i}`);
  const items = await getItems(keys);
  if (items === null) return undefined;

  let out = "";
  for (const k of keys) {
    if (items[k] == null) return undefined; // кусок потерялся — данным верить нельзя
    out += items[k];
  }
  return out;
}

/** Читает с повторами: одиночный сбой связи не должен решать судьбу входа. */
export async function cloudGetSure(prefix, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const value = await cloudGet(prefix);
    if (value !== undefined) return value;
    await new Promise((r) => setTimeout(r, 250 * (i + 1)));
  }
  return undefined;
}
