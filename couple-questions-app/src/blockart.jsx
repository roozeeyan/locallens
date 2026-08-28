// Рисунки блоков анкеты.
//
// Тонкая линия одной толщины, цвет наследуется от карточки — поэтому
// картинки живут во всех трёх палитрах и остаются чёткими на любом экране.
// Файлов с изображениями нет намеренно: одиннадцать картинок утяжелили бы
// сборку ради того, что рисуется парой десятков команд.
//
// Линия тонкая (1.1 при поле 120) и формы неровные нарочно: ровный
// геометрический значок читается как элемент интерфейса, а здесь нужен
// рисунок, который хочется рассматривать.
import React from "react";

const LINE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.1,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  vectorEffect: "non-scaling-stroke",
};

/** Четырёхлучевая искорка. Мелкая и редкая — она приправа, а не предмет. */
function Spark({ x, y, r = 3 }) {
  const d = `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;
  return <path d={d} fill="currentColor" stroke="none" />;
}

function Art({ children }) {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden="true">
      <g {...LINE}>{children}</g>
    </svg>
  );
}

/** Блок 1. Корни и семья — дерево, у которого корни видно не меньше кроны. */
function Roots() {
  return (
    <Art>
      <path d="M60 16C46 16 36 25 36 36C27 39 22 47 25 55C27 62 34 67 42 65C46 71 53 75 60 75C67 75 74 71 78 65C86 67 93 62 95 55C98 47 93 39 84 36C84 25 74 16 60 16Z" />
      <path d="M44 41C48 35 54 32 61 33" />
      <path d="M75 46C77 52 75 58 71 62" />
      <path d="M57 75C56 83 56 89 57 95" />
      <path d="M63 75C64 83 64 89 63 95" />
      <path d="M57 95C50 99 44 101 36 102" />
      <path d="M63 95C70 99 76 101 84 102" />
      <path d="M60 95V107" />
      <path d="M60 100C55 104 51 106 46 109" />
      <path d="M60 100C65 104 69 106 74 109" />
      <Spark x={24} y={24} r={3} />
      <Spark x={100} y={28} r={2} />
      <Spark x={104} y={82} r={2} />
    </Art>
  );
}

/** Блок 2. Личность и ценности — компас: то, по чему человек сверяется. */
function Personality() {
  return (
    <Art>
      <path d="M54 32A7 7 0 0 1 66 32" />
      <circle cx="60" cy="66" r="31" />
      <circle cx="60" cy="66" r="25" />
      <path d="M60 40 67 66 60 92 53 66Z" />
      <path d="M53 66H67" />
      <path d="M60 35V29M60 103V97M25 66H31M89 66H95" />
      <path d="M36 42 40 46M84 42 80 46M36 90 40 86M84 90 80 86" />
      <Spark x={100} y={26} r={3} />
      <Spark x={22} y={98} r={2} />
    </Art>
  );
}

/** Блок 3. Отношения и любовь. */
function Love() {
  return (
    <Art>
      <path d="M60 102C33 81 20 66 20 50C20 36 30 27 41 27C49 27 56 31 60 38C64 31 71 27 79 27C90 27 100 36 100 50C100 66 87 81 60 102Z" />
      <path d="M60 90C41 74 31 62 31 51C31 41 38 36 45 36C51 36 56 39 59 44" />
      <Spark x={26} y={22} r={3} />
      <Spark x={102} y={76} r={2.5} />
      <Spark x={16} y={70} r={2} />
    </Art>
  );
}

/** Блок 4. Жизнь и будущее — дорога к восходу. */
function Future() {
  return (
    <Art>
      <circle cx="60" cy="42" r="13" />
      <path d="M60 20V25M60 59V64M38 42H43M77 42H82M45 27 48 30M75 27 72 30M45 57 48 54M75 57 72 54" />
      <path d="M10 80C26 68 42 71 55 80" />
      <path d="M55 80C69 69 88 67 110 78" />
      <path d="M42 112C49 96 53 88 57 80" />
      <path d="M80 112C72 96 66 88 62 80" />
      <path d="M60 86V90M59 96V101M58 106V111" />
      <Spark x={22} y={26} r={3} />
      <Spark x={98} y={24} r={2} />
      <Spark x={104} y={48} r={2} />
    </Art>
  );
}

/** Блок 5. Духовное и глубинное — месяц над водой. */
function Spiritual() {
  return (
    <Art>
      <path d="M74 22A29 29 0 1 0 74 80A24 24 0 1 1 74 22Z" />
      <path d="M20 92H52M62 92H100" />
      <path d="M28 100H66M76 100H98" />
      <path d="M36 108H88" />
      <Spark x={94} y={34} r={3} />
      <Spark x={102} y={58} r={2} />
      <Spark x={86} y={72} r={2} />
      <Spark x={22} y={40} r={2} />
    </Art>
  );
}

/** Блок 6. Про «нас» — два кольца, которые уже не разнять. */
function Us() {
  return (
    <Art>
      <ellipse cx="45" cy="62" rx="25" ry="27" />
      <ellipse cx="45" cy="62" rx="19" ry="21" />
      <ellipse cx="77" cy="62" rx="25" ry="27" />
      <ellipse cx="77" cy="62" rx="19" ry="21" />
      <Spark x={61} y={20} r={3} />
      <Spark x={16} y={102} r={2} />
      <Spark x={106} y={100} r={2} />
    </Art>
  );
}

/** Блок 7. Финансы — кошелёк-мешочек и монета. */
function Finance() {
  return (
    <Art>
      <path d="M52 48C50 38 54 30 60 30C66 30 70 38 68 48" />
      <path d="M36 58C36 51 46 47 60 47C74 47 84 51 84 58" />
      <path d="M36 58C34 70 29 82 29 91C29 101 39 108 51 108H69C81 108 91 101 91 91C91 82 86 70 84 58" />
      <path d="M45 54C51 51 69 51 75 54" />
      <circle cx="60" cy="82" r="12" />
      <circle cx="60" cy="82" r="7" />
      <Spark x={102} y={40} r={3} />
      <Spark x={20} y={44} r={2} />
    </Art>
  );
}

/** Блок 8. Дети и родительство — воздушный змей. */
function Kids() {
  return (
    <Art>
      <path d="M66 14 96 48 57 96 28 56Z" />
      <path d="M66 14 57 96" />
      <path d="M28 56 96 48" />
      <path d="M57 96C64 102 50 107 57 114" />
      <path d="M53 101 61 104M53 110 61 112" />
      <Spark x={20} y={26} r={3} />
      <Spark x={104} y={86} r={2} />
      <Spark x={16} y={80} r={2} />
    </Art>
  );
}

/** Блок 9. Конфликты и разногласия — две реплики внахлёст. */
function Conflict() {
  return (
    <Art>
      <ellipse cx="46" cy="42" rx="27" ry="19" />
      <path d="M32 58 25 72 43 60" />
      <ellipse cx="77" cy="74" rx="25" ry="18" />
      <path d="M88 89 95 102 78 91" />
      <path d="M36 38H54M36 46H48" />
      <path d="M68 70H88M68 78H82" />
      <Spark x={104} y={26} r={3} />
      <Spark x={16} y={98} r={2} />
    </Art>
  );
}

/** Блок 10. Стресс и кризисы — туча с дождём. */
function Stress() {
  return (
    <Art>
      <path d="M36 70C23 70 16 61 19 50C22 40 33 35 42 40C45 25 61 18 73 25C83 31 88 41 85 52C98 50 107 59 103 69C101 76 94 78 86 78H38" />
      <path d="M46 41C50 33 59 29 67 32" />
      <path d="M32 84 27 100M47 82 42 102M62 84 57 100M77 82 72 98M90 84 86 96" />
      <Spark x={106} y={30} r={3} />
      <Spark x={16} y={84} r={2} />
    </Art>
  );
}

/** Блок 11. Свобода и границы — клетка с открытой дверцей. */
function Freedom() {
  return (
    <Art>
      <path d="M58 44V34" />
      <path d="M53 34A6 6 0 0 1 63 34" />
      <path d="M32 66C32 52 43 44 58 44C73 44 84 52 84 66V100H32Z" />
      <path d="M43 62V100M53 55V100M64 55V100M75 62V100" />
      <path d="M26 100H90M30 107H86" />
      <path d="M84 70 100 64V94L84 88" />
      <path d="M86 24Q94 15 102 24" />
      <path d="M102 24Q108 17 114 23" />
      <Spark x={20} y={34} r={3} />
      <Spark x={108} y={44} r={2} />
    </Art>
  );
}

/** Запасной рисунок: наборы, у которых своей картинки нет. */
function Deck() {
  return (
    <Art>
      <path d="M34 40H78A7 7 0 0 1 85 47V93A7 7 0 0 1 78 100H34A7 7 0 0 1 27 93V47A7 7 0 0 1 34 40Z" />
      <path d="M40 31H80A7 7 0 0 1 87 38" />
      <path d="M46 31 50 22H86A7 7 0 0 1 93 29" />
      <path d="M40 58H68M40 70H60M40 82H72" />
      <Spark x={104} y={30} r={3} />
      <Spark x={16} y={92} r={2} />
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

export function BlockArt({ id, size = 104 }) {
  const Picture = ART[id] || Deck;
  return (
    <div style={{ width: size, height: size, color: "inherit" }}>
      <Picture />
    </div>
  );
}
