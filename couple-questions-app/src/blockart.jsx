// Рисунки блоков анкеты.
//
// Тонкая линия одной толщины, цвет наследуется от карточки — поэтому
// картинки живут во всех трёх палитрах и остаются чёткими на любом экране.
// Файлов с изображениями нет намеренно: одиннадцать картинок утяжелили бы
// сборку ради того, что рисуется двумя десятками команд.
import React from "react";

const LINE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

/** Четырёхлучевая искорка — она держит весь стиль вместе. */
function Spark({ x, y, r = 4 }) {
  const d = `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;
  return <path d={d} fill="currentColor" stroke="none" />;
}

function Art({ children }) {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
      <g {...LINE}>{children}</g>
    </svg>
  );
}

/** Блок 1. Корни и семья — дерево, у которого видно корни. */
function Roots() {
  return (
    <Art>
      <path d="M50 24C38 24 31 32 33 41C25 45 27 56 36 56H64C73 56 75 45 67 41C69 32 62 24 50 24Z" />
      <path d="M50 56V74" />
      <path d="M50 74C45 79 40 81 34 83" />
      <path d="M50 74C55 79 60 81 66 83" />
      <path d="M50 74V86" />
      <Spark x={22} y={30} r={4} />
      <Spark x={78} y={64} r={3} />
    </Art>
  );
}

/** Блок 2. Личность и ценности — компас. */
function Personality() {
  return (
    <Art>
      <circle cx="50" cy="52" r="24" />
      <path d="M40 62 58 44 60 42 42 60Z" />
      <path d="M50 22V28M50 76V82M20 52H26M74 52H80" />
      <Spark x={78} y={24} r={4} />
    </Art>
  );
}

/** Блок 3. Отношения и любовь — сердце. */
function Love() {
  return (
    <Art>
      <path d="M50 80C29 65 21 53 21 42C21 31 29 25 37 25C43 25 48 28 50 33C52 28 57 25 63 25C71 25 79 31 79 42C79 53 71 65 50 80Z" />
      <Spark x={24} y={22} r={4} />
      <Spark x={80} y={70} r={3} />
    </Art>
  );
}

/** Блок 4. Жизнь и будущее — телескоп. */
function Future() {
  return (
    <Art>
      <path d="M24 60 62 32 70 43 32 71Z" />
      <path d="M62 32 70 43" />
      <circle cx="66" cy="37" r="3" />
      <path d="M42 60 36 84M50 54 60 84" />
      <path d="M32 84H70" />
      <Spark x={80} y={20} r={5} />
      <Spark x={22} y={26} r={3} />
    </Art>
  );
}

/** Блок 5. Духовное и глубинное — месяц среди звёзд. */
function Spiritual() {
  return (
    <Art>
      <path d="M63 24A27 27 0 1 0 63 78A22 22 0 1 1 63 24Z" />
      <Spark x={76} y={36} r={5} />
      <Spark x={84} y={58} r={3} />
      <Spark x={70} y={70} r={3} />
    </Art>
  );
}

/** Блок 6. Про «нас» — два круга и общее между ними. */
function Us() {
  return (
    <Art>
      <circle cx="39" cy="52" r="23" />
      <circle cx="61" cy="52" r="23" />
      <Spark x={50} y={20} r={4} />
      <Spark x={20} y={80} r={3} />
      <Spark x={80} y={80} r={3} />
    </Art>
  );
}

/** Блок 7. Финансы — кошелёк с монетой. */
function Finance() {
  return (
    <Art>
      <path d="M31 47C31 36 39 30 50 30C61 30 69 36 69 47" />
      <path d="M28 47H72L75 75A7 7 0 0 1 68 83H32A7 7 0 0 1 25 75Z" />
      <circle cx="50" cy="64" r="7" />
      <Spark x={80} y={32} r={4} />
    </Art>
  );
}

/** Блок 8. Дети и родительство — воздушный змей. */
function Kids() {
  return (
    <Art>
      <path d="M50 18 73 46 50 80 27 46Z" />
      <path d="M50 18V80M27 46H73" />
      <path d="M50 80C56 84 44 88 50 93" />
      <Spark x={80} y={22} r={4} />
      <Spark x={20} y={72} r={3} />
    </Art>
  );
}

/** Блок 9. Конфликты — две реплики, наехавшие друг на друга. */
function Conflict() {
  return (
    <Art>
      <path d="M22 26H56A8 8 0 0 1 64 34V50A8 8 0 0 1 56 58H34L24 68V58H22A8 8 0 0 1 14 50V34A8 8 0 0 1 22 26Z" />
      <path d="M52 44H78A8 8 0 0 1 86 52V66A8 8 0 0 1 78 74H76V84L66 74H52A8 8 0 0 1 44 66V52A8 8 0 0 1 52 44Z" />
      <Spark x={72} y={26} r={4} />
    </Art>
  );
}

/** Блок 10. Стресс и кризисы — туча с дождём. */
function Stress() {
  return (
    <Art>
      <path d="M34 62C24 62 18 55 20 47C22 39 30 36 36 39C39 27 51 22 60 27C67 30 71 37 70 45C79 44 84 51 82 58C81 61 77 62 73 62Z" />
      <path d="M34 72 30 82M48 72 44 84M62 72 58 82" />
      <Spark x={86} y={28} r={4} />
    </Art>
  );
}

/** Блок 11. Свобода и границы — птица в небе. */
function Freedom() {
  return (
    <Art>
      <path d="M18 58Q33 40 49 58Q65 40 82 56" />
      <path d="M32 72Q41 64 50 72" />
      <Spark x={72} y={26} r={5} />
      <Spark x={24} y={30} r={3} />
      <Spark x={86} y={74} r={3} />
    </Art>
  );
}

/** Запасной рисунок: колоды и наборы, у которых своей картинки нет. */
function Deck() {
  return (
    <Art>
      <path d="M30 34H70A6 6 0 0 1 76 40V76A6 6 0 0 1 70 82H30A6 6 0 0 1 24 76V40A6 6 0 0 1 30 34Z" />
      <path d="M34 26H72A6 6 0 0 1 78 32" />
      <path d="M38 50H62M38 62H54" />
      <Spark x={84} y={24} r={4} />
    </Art>
  );
}

const ART = {
  roots: Roots,
  personality: Personality,
  love: Love,
  future: Future,
  spiritual: Spiritual,
  us: Us,
  finance: Finance,
  kids: Kids,
  conflict: Conflict,
  stress: Stress,
  freedom: Freedom,
};

export function BlockArt({ id, size = 76 }) {
  const Picture = ART[id] || Deck;
  return (
    <div style={{ width: size, height: size, color: "inherit" }}>
      <Picture />
    </div>
  );
}
