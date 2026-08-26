// Кто и что видит за деньги.
//
// Платит один — открывается обоим. Пара и есть единица покупки: смысл
// приложения в сравнении, поэтому доступ, открытый одному, бессмысленен.
// Отсюда одно правило на всё приложение: доступ есть, если купила я сама
// или если купил кто-то, с кем я связана.

/** Открыт ли доступ мне — своей покупкой или покупкой партнёра. */
export function hasAccess(profile, connections = []) {
  return Boolean(profile?.premium) || connections.some((x) => x.premium);
}

/** Имя того, кто оплатил за двоих. Пусто, если платила я сама. */
export function paidBy(profile, connections = []) {
  if (profile?.premium) return "";
  return connections.find((x) => x.premium)?.name || "";
}
