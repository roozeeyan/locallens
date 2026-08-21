// Высота видимой части экрана.
//
// Telegram на iOS не ужимает окно под клавиатуру — он кладёт её поверх.
// Поэтому «во всю высоту окна» означает «частично под клавиатурой»: нижние
// кнопки и низ поля ответа просто оказываются под ней.
//
// Здесь мы держим переменную --rg-vh равной тому, сколько места реально
// видно, и полноэкранные слои опираются на неё вместо 100vh.

const VAR = "--rg-vh";

function usableHeight() {
  const vv = window.visualViewport;
  const stable = window.Telegram?.WebApp?.viewportStableHeight;
  const candidates = [vv?.height, stable, window.innerHeight].filter(
    (x) => typeof x === "number" && x > 0
  );
  return candidates.length ? Math.min(...candidates) : window.innerHeight;
}

export function watchViewport() {
  const apply = () => {
    document.documentElement.style.setProperty(VAR, `${Math.round(usableHeight())}px`);
  };

  apply();

  const vv = window.visualViewport;
  vv?.addEventListener("resize", apply);
  vv?.addEventListener("scroll", apply);
  window.addEventListener("resize", apply);
  window.addEventListener("orientationchange", apply);
  window.Telegram?.WebApp?.onEvent?.("viewportChanged", apply);

  return () => {
    vv?.removeEventListener("resize", apply);
    vv?.removeEventListener("scroll", apply);
    window.removeEventListener("resize", apply);
    window.removeEventListener("orientationchange", apply);
    window.Telegram?.WebApp?.offEvent?.("viewportChanged", apply);
  };
}

/** Высота полноэкранного слоя: ровно то, что видно поверх клавиатуры. */
export const screenHeight = `var(${VAR}, 100vh)`;
