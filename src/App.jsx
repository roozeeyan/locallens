import { useState } from "react";

// ── Icons ──────────────────────────────────────────────────────────────────
const Icon = ({ children }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const Icons = {
  coffee: <Icon><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></Icon>,
  wine:   <Icon><path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15A5 5 0 0 0 17 10V3H7v7a5 5 0 0 0 5 5Z"/></Icon>,
  column: <Icon><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></Icon>,
  leaf:   <Icon><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></Icon>,
  bag:    <Icon><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></Icon>,
  wave:   <Icon><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2"/></Icon>,
  spa:    <Icon><path d="M12 22V12"/><path d="M5 12C5 6.5 8.5 2 12 2s7 4.5 7 10"/><path d="M5 12c2.8 0 5-2.2 5-5"/><path d="M19 12c-2.8 0-5-2.2-5-5"/></Icon>,
  bed:    <Icon><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></Icon>,
  pin:    <Icon><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></Icon>,
  locate: <Icon><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></Icon>,
  bookmarkEmpty: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  bookmarkFilled: (
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill="currentColor" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  ),
};

const CATEGORY_ICONS = {
  "Кафе и рестораны":      Icons.coffee,
  "Бары":                  Icons.wine,
  "Достопримечательности": Icons.column,
  "Природа":               Icons.leaf,
  "Шопинг":                Icons.bag,
  "Пляжи":                 Icons.wave,
  "Велнес и spa":          Icons.spa,
  "Жильё":                 Icons.bed,
};

// ── Data ───────────────────────────────────────────────────────────────────
const CITIES = [
  { id: "yerevan",  name: "Ереван",  country: "Армения",   emoji: "🇦🇲" },
  { id: "bangkok",  name: "Бангкок", country: "Таиланд",   emoji: "🇹🇭" },
  { id: "samui",    name: "Самуи",   country: "Таиланд",   emoji: "🇹🇭" },
  { id: "phangan",  name: "Панган",  country: "Таиланд",   emoji: "🇹🇭" },
  { id: "hoian",    name: "Хой Ан",  country: "Вьетнам",   emoji: "🇻🇳" },
  { id: "bali",     name: "Бали",    country: "Индонезия", emoji: "🇮🇩" },
];

const INITIAL_PLACES = [
  // — Ереван —
  { id: 1, cityId: "yerevan", category: "Кафе и рестораны", name: "Jazzve Coffee",
    tags: "☕ кофе · джезва · уют",
    badge: "❤️ личный фаворит",
    district: "Кентрон", lat: 40.1772, lng: 44.5126,
    schedule: "09:00–22:00", openFrom: 9, openTo: 22,
    description: "Армянская кофейня с традиционным кофе в джезве. Деревянный интерьер, тихая атмосфера и лучшая турка в центре Еревана. Обязательно попробуй кофе с кардамоном — это местная классика.",
    photos: ["","",""] },

  { id: 2, cityId: "yerevan", category: "Кафе и рестораны", name: "Aperitivo",
    tags: "🍝 паста · терраса · вино",
    badge: "🌅 за атмосферу",
    district: "Кентрон", lat: 40.1805, lng: 44.5142,
    schedule: "12:00–23:00", openFrom: 12, openTo: 23,
    description: "Итальянско-армянская кухня с открытой террасой. Отличная паста, живая музыка по выходным и бокал вина с видом на город. Один из лучших ресторанов для вечера на свежем воздухе.",
    photos: ["","",""] },

  { id: 3, cityId: "yerevan", category: "Кафе и рестораны", name: "Dolmama",
    tags: "🍽 армянская · дворик · авторская",
    badge: "💎 скрытая жемчужина",
    district: "Кентрон", lat: 40.1820, lng: 44.5155,
    schedule: "13:00–23:00", openFrom: 13, openTo: 23,
    description: "Один из лучших ресторанов армянской кухни в городе. Классические блюда в современной подаче, уютный дворик. Шеф переосмыслил традиционные рецепты — результат впечатляет.",
    photos: ["","",""] },

  { id: 4, cityId: "yerevan", category: "Кафе и рестораны", name: "Lavash",
    tags: "🫓 хачапури · кюфта · домашнее",
    badge: "👁️ место для своих",
    district: "Кентрон", lat: 40.1795, lng: 44.5167,
    schedule: "11:00–23:00", openFrom: 11, openTo: 23,
    description: "Ресторан традиционной армянской кухни. Фирменные хачапури, кюфта и домашние вина. Место где едят местные — без туристических наценок и с настоящей атмосферой.",
    photos: ["","",""] },

  { id: 5, cityId: "yerevan", category: "Бары", name: "Wine Republic",
    tags: "🍷 армянское · грузинское · сыр",
    badge: "❤️ личный фаворит",
    district: "Кентрон", lat: 40.1788, lng: 44.5133,
    schedule: "с 16:00", openFrom: 16, openTo: 1,
    description: "Винный бар с огромной картой армянских и грузинских вин. Тёплая атмосфера, живая музыка и отличные сырные тарелки. Идеально для вечера с друзьями или романтического ужина.",
    photos: ["","",""] },

  { id: 6, cityId: "yerevan", category: "Бары", name: "Churchill Bar",
    tags: "🥃 виски · паб · дартс",
    badge: "🔥 всегда народ",
    district: "Кентрон", lat: 40.1798, lng: 44.5148,
    schedule: "с 17:00", openFrom: 17, openTo: 2,
    description: "Классический английский паб с армянским характером. Хороший выбор виски, дартс и футбол на большом экране. Лучшее место в Ереване чтобы посмотреть матч в хорошей компании.",
    photos: ["","",""] },

  { id: 7, cityId: "yerevan", category: "Достопримечательности", name: "Каскад",
    tags: "🎨 искусство · закат · Арарат",
    badge: "🌅 лучший вид в городе",
    district: "Кентрон", lat: 40.1857, lng: 44.5100,
    schedule: "08:00–22:00", openFrom: 8, openTo: 22,
    description: "Монументальная лестница с видом на Арарат. Внутри — галерея современного искусства, снаружи — лучший закат в Ереване. Подъём занимает 20 минут, но вид того стоит.",
    photos: ["","",""] },

  { id: 8, cityId: "yerevan", category: "Достопримечательности", name: "Матенадаран",
    tags: "📜 рукописи · история · архитектура",
    badge: "💎 обязательно",
    district: "Арабкир", lat: 40.1886, lng: 44.5047,
    schedule: "10:00–17:00", openFrom: 10, openTo: 17,
    description: "Хранилище древнеармянских рукописей — одно из крупнейших в мире. Здание само по себе архитектурный шедевр. Экскурсия с гидом открывает совершенно другой взгляд на армянскую историю.",
    photos: ["","",""] },

  { id: 9, cityId: "yerevan", category: "Природа", name: "Озеро Севан",
    tags: "🏔 горное озеро · форель · монастырь",
    badge: "🌿 лучший выезд",
    district: "Загородный маршрут", lat: 40.3566, lng: 45.0295,
    schedule: "весь день",
    description: "Высокогорное озеро в часе езды от Еревана. Монастырь Севанаванк на полуострове, форель прямо с лодок, потрясающий воздух. Лучший однодневный выезд из города.",
    photos: ["","",""] },

  { id: 10, cityId: "yerevan", category: "Шопинг", name: "Вернисаж",
    tags: "🛍 антиквариат · серебро · ковры",
    badge: "👁️ без туристических наценок",
    district: "Кентрон", lat: 40.1778, lng: 44.5152,
    schedule: "Сб–Вс 10:00–19:00", openFrom: 10, openTo: 19,
    description: "Главный блошиный рынок Еревана. Ковры, серебро, советские значки, картины и настоящие армянские сувениры без туристических наценок. По выходным — особенно богатый выбор.",
    photos: ["","",""] },

  // — Бангкок —
  { id: 11, cityId: "bangkok", category: "Кафе и рестораны", name: "Gaggan Anand",
    tags: "🌶 индийская · 25 курсов · 50 Best",
    badge: "🔥 бронь за месяц",
    district: "Lumphini", lat: 13.7367, lng: 100.5535,
    schedule: "18:00–23:00", openFrom: 18, openTo: 23,
    description: "Прогрессивная индийская кухня — один из лучших ресторанов Азии по версии 50 Best. Меню в виде эмодзи, 25 курсов. Бронировать нужно за несколько месяцев — того стоит.",
    photos: ["","",""] },

  { id: 12, cityId: "bangkok", category: "Кафе и рестораны", name: "Nahm",
    tags: "🫚 тайская · аутентично · шеф",
    badge: "💎 исчезающая кухня",
    district: "Silom", lat: 13.7220, lng: 100.5269,
    schedule: "18:00–22:30", openFrom: 18, openTo: 22,
    description: "Аутентичная тайская кухня в исполнении шеф-повара мирового уровня. Рецепты из старинных книг, почти исчезнувшие блюда. Одно из лучших мест чтобы понять настоящую тайскую кухню.",
    photos: ["","",""] },

  { id: 13, cityId: "bangkok", category: "Достопримечательности", name: "Wat Pho",
    tags: "🛕 храм · Будда 46м · массаж",
    badge: "❤️ must see",
    district: "Ратанакосин", lat: 13.7465, lng: 100.4930,
    schedule: "08:00–18:30", openFrom: 8, openTo: 18,
    description: "Храм лежащего Будды — самый большой в Бангкоке. Фигура Будды длиной 46 метров, перламутровая инкрустация на подошвах. Здесь же — одна из лучших школ тайского массажа.",
    photos: ["","",""] },

  { id: 14, cityId: "bangkok", category: "Шопинг", name: "Chatuchak Market",
    tags: "🛍 15 000 лотков · антиквариат · выходные",
    badge: "👁️ крупнейший рынок",
    district: "Chatuchak", lat: 13.7998, lng: 100.5519,
    schedule: "Сб–Вс 09:00–18:00", openFrom: 9, openTo: 18,
    description: "Один из крупнейших рынков мира — 15 000 лотков. Антиквариат, одежда, растения, еда, всё что угодно. Только по выходным. Приходи утром — днём очень жарко.",
    photos: ["","",""] },

  // — Самуи —
  { id: 15, cityId: "samui", category: "Пляжи", name: "Chaweng Beach",
    tags: "🏖 белый песок · инфра · бары",
    badge: "❤️ главный пляж",
    district: "Чавенг", lat: 9.5255, lng: 100.0607,
    schedule: "весь день",
    description: "Главный пляж острова — белый песок, бирюзовая вода, развитая инфраструктура. Лучший для первого знакомства с Самуи. Вечером здесь оживает стрит-фуд и бары.",
    photos: ["","",""] },

  { id: 16, cityId: "samui", category: "Кафе и рестораны", name: "The Larder",
    tags: "🍳 бранч · яйца бенедикт · кофе",
    badge: "❤️ лучшее утро",
    district: "Чавенг", lat: 9.5262, lng: 100.0613,
    schedule: "07:30–15:00", openFrom: 7, openTo: 15,
    description: "Европейский завтрак и бранч в тропиках. Яйца бенедикт, свежий хлеб, хороший кофе — лучшее место острова для утра. Небольшой уютный интерьер, приходи пораньше.",
    photos: ["","",""] },

  // — Панган —
  { id: 17, cityId: "phangan", category: "Пляжи", name: "Haad Yao",
    tags: "🏖 тихий залив · кристальная вода · закат",
    badge: "💎 без вечеринок",
    district: "Запад", lat: 9.7565, lng: 100.0006,
    schedule: "весь день",
    description: "Тихий залив с чистейшей водой вдали от полнолунных вечеринок. Длинный белый пляж, скалы, закат окрашивает всё в розовый. Одно из самых красивых мест острова.",
    photos: ["","",""] },

  { id: 18, cityId: "phangan", category: "Природа", name: "Than Sadet Waterfall",
    tags: "🌊 водопад · джунгли · купание",
    badge: "🌿 для природы",
    district: "Центр", lat: 9.7750, lng: 100.0600,
    schedule: "08:00–17:00", openFrom: 8, openTo: 17,
    description: "Каскадный водопад в джунглях — место, которое посещали тайские короли. Прохладные бассейны для купания, тишина и папоротники. Дорога занимает около 30 минут от центра.",
    photos: ["","",""] },

  // — Хой Ан —
  { id: 19, cityId: "hoian", category: "Достопримечательности", name: "Ancient Town",
    tags: "🏮 ЮНЕСКО · фонари · каналы",
    badge: "❤️ must see вечером",
    district: "Старый город", lat: 15.8799, lng: 108.3350,
    schedule: "весь день (вечером лучше)",
    description: "Старый город под охраной ЮНЕСКО — фонари, каналы, жёлтые стены. Вечером зажигают тысячи фонариков — это нужно видеть. Лучше гулять без карты — просто потеряться в переулках.",
    photos: ["","",""] },

  { id: 20, cityId: "hoian", category: "Кафе и рестораны", name: "Morning Glory",
    tags: "🍜 cao lau · белая роза · легенда",
    badge: "🔥 всегда очередь",
    district: "Старый город", lat: 15.8803, lng: 108.3360,
    schedule: "11:00–21:30", openFrom: 11, openTo: 21,
    description: "Самый известный ресторан вьетнамской уличной еды в Хой Ане. Белая роза, cao lầu, жареные вонтоны — всё здесь лучшее. Основательница ресторана лично встречает гостей.",
    photos: ["","",""] },

  // — Бали —
  { id: 21, cityId: "bali", category: "Природа", name: "Tegallalang Rice Terraces",
    tags: "🌿 террасы · рассвет · фото",
    badge: "🌅 на рассвете",
    district: "Убуд (север)", lat: -8.4337, lng: 115.2789,
    schedule: "весь день",
    description: "Знаменитые рисовые террасы к северу от Убуда. Изумрудные ступени уходят вниз в долину — один из символов острова. Лучший свет для фото — раннее утро или за час до заката.",
    photos: ["","",""] },

  { id: 22, cityId: "bali", category: "Кафе и рестораны", name: "Locavore",
    tags: "🍃 farm-to-table · Убуд · 50 Best",
    badge: "💎 лучший в Азии",
    district: "Убуд", lat: -8.5069, lng: 115.2625,
    schedule: "12:00–22:00", openFrom: 12, openTo: 22,
    description: "Один из лучших ресторанов Азии в Убуде. Вся еда — с местных ферм и рынков. Дегустационное меню с историей каждого ингредиента. Столик нужно бронировать заранее.",
    photos: ["","",""] },
].map(p => ({ ...p, saved: false }));

// ── Helpers ────────────────────────────────────────────────────────────────
const gMapsUrl = (name, city) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + city)}`;
const yMapsUrl = (name, city) =>
  `https://yandex.ru/maps/?text=${encodeURIComponent(name + " " + city)}`;

const PHOTO_BG = [
  "linear-gradient(145deg, #E8E3DC, #CFC9C0)",
  "linear-gradient(145deg, #E0DBD3, #C8C2B8)",
  "linear-gradient(145deg, #D8D3CB, #C0BAB0)",
];

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km) {
  if (km < 0.1) return Math.round(km * 1000) + " м";
  if (km < 10)  return km.toFixed(1) + " км";
  return Math.round(km) + " км";
}

function getOpenStatus(openFrom, openTo) {
  if (!openFrom && !openTo) return null;
  const h = new Date().getHours();
  const open = openTo > openFrom
    ? h >= openFrom && h < openTo
    : h >= openFrom || h < openTo;
  if (open) return { open: true, label: `Открыто · до ${String(openTo).padStart(2, "0")}:00` };
  return { open: false, label: `Закрыто · с ${String(openFrom).padStart(2, "0")}:00` };
}

// ── Filter chips ───────────────────────────────────────────────────────────
function Chips({ options, active, onSelect }) {
  return (
    <div style={s.chipsRow}>
      {options.map(({ value, label }) => (
        <button key={String(value)} style={active === value ? s.chipActive : s.chip}
          onClick={() => onSelect(value)}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Place Card ─────────────────────────────────────────────────────────────
function PlaceCard({ place, index, city, isOpen, onToggle, onSave, isSaved, distanceKm }) {
  const status = getOpenStatus(place.openFrom, place.openTo);

  const areaText = [
    place.district,
    distanceKm !== null ? formatDist(distanceKm) : null,
  ].filter(Boolean).join(" · ");

  return (
    <div style={s.placeCard}>
      {/* ── Info block ── */}
      <div style={s.placeInfo} onClick={onToggle}>

        <div style={s.placeTop}>
          <span style={s.placeIdx}>{String(index + 1).padStart(2, "0")}</span>
          <span style={s.placeName}>{place.name}</span>
          <button style={{ ...s.saveBtn, color: isSaved ? "#2C2520" : "#C5BEB7" }}
            onClick={e => { e.stopPropagation(); onSave(); }}>
            {isSaved ? Icons.bookmarkFilled : Icons.bookmarkEmpty}
          </button>
        </div>

        <div style={s.placeMeta}>
          {place.badge && <span style={s.badge}>{place.badge}</span>}
          {areaText && <span style={s.area}>{areaText}</span>}
        </div>

        {place.tags && <div style={s.tags}>{place.tags}</div>}

        <div style={s.statusRow}>
          {status ? (
            <>
              <span style={{ ...s.dot, background: status.open ? "#7BAE7F" : "#C5BEB7" }} />
              <span style={{ fontSize: 11, color: status.open ? "#4A7A4E" : "#8A7F78", letterSpacing: "0.03em" }}>
                {status.label}
              </span>
              {place.schedule && <span style={s.scheduleText}> · {place.schedule}</span>}
            </>
          ) : place.schedule ? (
            <span style={s.scheduleText}>{place.schedule}</span>
          ) : null}
        </div>
      </div>

      {/* ── Full-width photo strip ── */}
      <div style={s.photoStrip} onClick={onToggle}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ ...s.photoCell, background: PHOTO_BG[i] }}>
            {place.photos?.[i]
              ? <img src={place.photos[i]} alt={place.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={s.photoInitial}>{place.name[0]}</span>
            }
          </div>
        ))}
      </div>

      {/* ── Accordion (description + links) ── */}
      <div style={{ ...s.accordion, maxHeight: isOpen ? 300 : 0 }}>
        <div style={s.accordionInner}>
          <p style={s.expandedDesc}>{place.description}</p>
          <div style={s.mapLinks}>
            <a href={gMapsUrl(place.name, city?.name)} target="_blank" rel="noreferrer" style={s.mapBtn}>
              Google Maps ↗
            </a>
            <a href={yMapsUrl(place.name, city?.name)} target="_blank" rel="noreferrer" style={s.mapBtn}>
              Яндекс Карты ↗
            </a>
          </div>
          <button style={s.collapseBtn} onClick={onToggle}>свернуть ↑</button>
        </div>
      </div>

      <div style={{ height: 14 }} />
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]             = useState("home");
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedCat, setSelectedCat]   = useState(null);
  const [places, setPlaces]             = useState(INITIAL_PLACES);
  const [expandedId, setExpandedId]     = useState(null);
  const [toast, setToast]               = useState(null);

  // Location & filters
  const [userLoc, setUserLoc]           = useState(null);
  const [locLoading, setLocLoading]     = useState(false);
  const [locError, setLocError]         = useState(false);
  const [radiusKm, setRadiusKm]         = useState(null);
  const [districtFilter, setDistrictFilter] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  const toggleSave = (id) => {
    const p = places.find(p => p.id === id);
    setPlaces(prev => prev.map(pl => pl.id === id ? { ...pl, saved: !pl.saved } : pl));
    showToast(p?.saved ? "Удалено из сохранённых" : "Сохранено");
  };

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  const categoriesFor = (cityId) => [...new Set(places.filter(p => p.cityId === cityId).map(p => p.category))];
  const placesFor     = (cityId, cat) => places.filter(p => p.cityId === cityId && p.category === cat);
  const savedPlaces   = places.filter(p => p.saved);
  const cityFor       = (cityId) => CITIES.find(c => c.id === cityId);

  const goCity = (city) => {
    setSelectedCity(city);
    setExpandedId(null);
    setDistrictFilter(null);
    setScreen("city");
  };
  const goCat = (cat) => {
    setSelectedCat(cat);
    setExpandedId(null);
    setDistrictFilter(null);
    setScreen("places");
  };
  const goBack = () => {
    setExpandedId(null);
    if (screen === "places") return setScreen("city");
    if (screen === "city")   return setScreen("home");
    setScreen("home");
  };

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocError(true); return; }
    setLocLoading(true);
    setLocError(false);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocLoading(false);
      },
      () => { setLocLoading(false); setLocError(true); },
      { timeout: 8000 }
    );
  };

  // Compute displayed places (with distance, filtered, sorted)
  const rawPlaces = placesFor(selectedCity?.id, selectedCat);
  const districts = [...new Set(rawPlaces.map(p => p.district).filter(Boolean))];

  const displayPlaces = rawPlaces
    .map(p => ({
      ...p,
      distanceKm: userLoc && p.lat && p.lng
        ? haversine(userLoc.lat, userLoc.lng, p.lat, p.lng)
        : null,
    }))
    .filter(p => !districtFilter || p.district === districtFilter)
    .filter(p => !radiusKm || !userLoc || (p.distanceKm !== null && p.distanceKm <= radiusKm))
    .sort((a, b) => userLoc ? (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999) : 0);

  const RADIUS_OPTIONS = [
    { value: null, label: "Все" },
    { value: 1,    label: "1 км" },
    { value: 3,    label: "3 км" },
    { value: 5,    label: "5 км" },
    { value: 10,   label: "10 км" },
  ];

  const districtOptions = [
    { value: null, label: "Все районы" },
    ...districts.map(d => ({ value: d, label: d })),
  ];

  return (
    <div style={s.root}>
      {toast && <div style={s.toast}>{toast}</div>}

      <header style={s.header}>
        <span style={s.logo} onClick={() => { setScreen("home"); setExpandedId(null); }}>LOCALLENS</span>
        {["city","places"].includes(screen) && (
          <button style={s.backBtn} onClick={goBack}>← назад</button>
        )}
      </header>

      <main style={s.main}>

        {/* ── HOME ── */}
        {screen === "home" && (
          <>
            <div style={s.hero}>
              <p style={s.label}>ROO SELECTION · TRAVEL</p>
              <h1 style={s.heroTitle}>Города,<br />которые я люблю</h1>
              <p style={s.heroSub}>Личная подборка мест — кафе, рестораны, природа, атмосфера</p>
            </div>
            <div style={s.list}>
              {CITIES.map(city => (
                <button key={city.id} style={s.cityRow} onClick={() => goCity(city)}>
                  <span style={s.cityEmoji}>{city.emoji}</span>
                  <div style={s.cityInfo}>
                    <span style={s.cityName}>{city.name}</span>
                    <span style={s.cityCountry}>{city.country}</span>
                  </div>
                  <span style={s.arrow}>→</span>
                </button>
              ))}
            </div>
            {savedPlaces.length > 0 && (
              <button style={s.savedBanner} onClick={() => setScreen("saved")}>
                Сохранено · {savedPlaces.length}
              </button>
            )}
          </>
        )}

        {/* ── CITY ── */}
        {screen === "city" && selectedCity && (
          <>
            <div style={s.pageHero}>
              <p style={s.label}>{selectedCity.country}</p>
              <h1 style={s.pageTitle}>{selectedCity.name}</h1>
            </div>
            <div style={s.list}>
              {categoriesFor(selectedCity.id).map(cat => (
                <button key={cat} style={s.catRow} onClick={() => goCat(cat)}>
                  <span style={s.catIcon}>{CATEGORY_ICONS[cat] || Icons.pin}</span>
                  <span style={s.catName}>{cat}</span>
                  <span style={s.catMeta}>{placesFor(selectedCity.id, cat).length}&nbsp;мест&nbsp;→</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── PLACES ── */}
        {screen === "places" && selectedCity && selectedCat && (
          <>
            <div style={s.pageHero}>
              <p style={s.label}>{selectedCity.name} · {selectedCat}</p>
            </div>

            {/* ── Filters ── */}
            <div style={s.filtersBlock}>

              {/* Location button */}
              <button style={s.locBtn} onClick={requestLocation} disabled={locLoading}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {Icons.locate}
                  {locLoading
                    ? "Определяем..."
                    : userLoc
                      ? "Геолокация активна"
                      : "Найти ближайшие"}
                </span>
                {userLoc && <span style={s.locDot} />}
              </button>
              {locError && (
                <p style={s.locErrorMsg}>Не удалось получить геолокацию</p>
              )}

              {/* Radius chips — only if location known */}
              {userLoc && (
                <Chips options={RADIUS_OPTIONS} active={radiusKm} onSelect={setRadiusKm} />
              )}

              {/* District chips — if more than one district in this category */}
              {districts.length > 1 && (
                <Chips options={districtOptions} active={districtFilter} onSelect={setDistrictFilter} />
              )}
            </div>

            {/* ── Place list ── */}
            <div style={s.list}>
              {displayPlaces.length === 0 ? (
                <p style={s.empty}>Нет мест в выбранном фильтре</p>
              ) : (
                displayPlaces.map((place, i) => {
                  const live = places.find(p => p.id === place.id);
                  return (
                    <PlaceCard key={place.id} place={live} index={i} city={selectedCity}
                      isOpen={expandedId === place.id}
                      onToggle={() => toggleExpand(place.id)}
                      onSave={() => toggleSave(place.id)}
                      isSaved={live.saved}
                      distanceKm={place.distanceKm} />
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ── SAVED ── */}
        {screen === "saved" && (
          <>
            <div style={s.pageHero}>
              <p style={s.label}>МОИ ЗАКЛАДКИ</p>
              <h1 style={s.pageTitle}>Сохранённое</h1>
            </div>
            {savedPlaces.length === 0 ? (
              <p style={s.empty}>Пока пусто — сохраняй места которые понравились</p>
            ) : (
              <div style={s.list}>
                {savedPlaces.map((place, i) => {
                  const live = places.find(p => p.id === place.id);
                  const distanceKm = userLoc && live.lat && live.lng
                    ? haversine(userLoc.lat, userLoc.lng, live.lat, live.lng)
                    : null;
                  return (
                    <PlaceCard key={place.id} place={live} index={i} city={cityFor(place.cityId)}
                      isOpen={expandedId === place.id}
                      onToggle={() => toggleExpand(place.id)}
                      onSave={() => toggleSave(place.id)}
                      isSaved={live.saved}
                      distanceKm={distanceKm} />
                  );
                })}
              </div>
            )}
          </>
        )}

      </main>

      <nav style={s.bottomNav}>
        {[["home","Города"],["saved","Сохранено"]].map(([sc, label]) => {
          const active = sc === "home" ? ["home","city","places"].includes(screen) : screen === sc;
          return (
            <button key={sc} onClick={() => { setScreen(sc); setExpandedId(null); }}
              style={{ ...s.navBtn, ...(active ? s.navActive : {}) }}>
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = {
  root: { fontFamily: "'DM Sans', -apple-system, sans-serif", background: "#F0EDE8", minHeight: "100vh", color: "#2C2520", paddingBottom: 72 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", background: "#F0EDE8", borderBottom: "1px solid #DED9D3", position: "sticky", top: 0, zIndex: 100 },
  logo: { fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", color: "#2C2520", cursor: "pointer" },
  backBtn: { background: "none", border: "none", color: "#8A7F78", cursor: "pointer", fontSize: 13, letterSpacing: "0.05em", fontFamily: "inherit" },
  main: { maxWidth: 640, margin: "0 auto", padding: "0 24px" },

  hero: { padding: "52px 0 40px", borderBottom: "1px solid #DED9D3", marginBottom: 8 },
  heroTitle: { fontSize: 52, fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.025em", margin: "20px 0 18px" },
  heroSub: { fontSize: 14, color: "#8A7F78", lineHeight: 1.65, maxWidth: 300 },
  pageHero: { padding: "36px 0 24px", borderBottom: "1px solid #DED9D3", marginBottom: 0 },
  pageTitle: { fontSize: 44, fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.025em", margin: "14px 0 0" },
  label: { fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#8A7F78", margin: 0 },
  list: { display: "flex", flexDirection: "column" },

  cityRow: { display: "flex", alignItems: "center", gap: 16, padding: "20px 0", background: "none", border: "none", borderBottom: "1px solid #DED9D3", cursor: "pointer", textAlign: "left", width: "100%", color: "#2C2520", fontFamily: "inherit" },
  cityEmoji: { fontSize: 26, flexShrink: 0 },
  cityInfo: { display: "flex", flexDirection: "column", gap: 3, flex: 1 },
  cityName: { fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" },
  cityCountry: { fontSize: 11, color: "#8A7F78", letterSpacing: "0.1em", textTransform: "uppercase" },
  arrow: { color: "#C5BEB7", fontSize: 18, flexShrink: 0 },
  savedBanner: { marginTop: 32, width: "100%", padding: "16px 20px", background: "#2C2520", color: "#F0EDE8", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" },

  catRow: { display: "flex", alignItems: "center", gap: 14, padding: "18px 0", background: "none", border: "none", borderBottom: "1px solid #DED9D3", cursor: "pointer", width: "100%", fontFamily: "inherit", color: "#2C2520" },
  catIcon: { flexShrink: 0, display: "flex", alignItems: "center" },
  catName: { fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", flex: 1, textAlign: "left" },
  catMeta: { fontSize: 12, color: "#8A7F78", letterSpacing: "0.05em", flexShrink: 0 },

  // Filters
  filtersBlock: { padding: "14px 0 4px", borderBottom: "1px solid #DED9D3" },
  locBtn: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    width: "100%", background: "none", border: "1px solid #DED9D3", borderRadius: 3,
    padding: "10px 14px", color: "#2C2520", cursor: "pointer",
    fontFamily: "inherit", fontSize: 13, fontWeight: 500, letterSpacing: "0.02em",
    marginBottom: 10,
  },
  locDot: { width: 7, height: 7, borderRadius: "50%", background: "#7BAE7F", flexShrink: 0 },
  locErrorMsg: { fontSize: 11, color: "#B07070", marginBottom: 8, letterSpacing: "0.02em" },
  chipsRow: {
    display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10,
    scrollbarWidth: "none", WebkitOverflowScrolling: "touch",
  },
  chip: {
    flexShrink: 0, padding: "6px 12px", border: "1px solid #DED9D3", borderRadius: 20,
    background: "none", color: "#8A7F78", cursor: "pointer",
    fontSize: 12, fontWeight: 500, letterSpacing: "0.03em", fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  chipActive: {
    flexShrink: 0, padding: "6px 12px", border: "1px solid #2C2520", borderRadius: 20,
    background: "#2C2520", color: "#F0EDE8", cursor: "pointer",
    fontSize: 12, fontWeight: 500, letterSpacing: "0.03em", fontFamily: "inherit",
    whiteSpace: "nowrap",
  },

  // Place card
  placeCard: { borderBottom: "1px solid #DED9D3" },
  placeInfo: { padding: "16px 0 12px", cursor: "pointer" },
  placeTop: { display: "flex", alignItems: "center", gap: 10, marginBottom: 7 },
  placeIdx: { fontSize: 11, color: "#C5BEB7", minWidth: 22, flexShrink: 0, fontWeight: 500, letterSpacing: "0.05em" },
  placeName: { fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", flex: 1, lineHeight: 1.2 },
  saveBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 15, flexShrink: 0, padding: "2px", fontFamily: "inherit", lineHeight: 1 },

  placeMeta: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6, paddingLeft: 32, flexWrap: "wrap" },
  badge: { fontSize: 11, fontWeight: 600, color: "#2C2520", letterSpacing: "0.02em" },
  area: { fontSize: 11, color: "#8A7F78", letterSpacing: "0.03em" },
  tags: { fontSize: 12, color: "#6A6058", letterSpacing: "0.02em", marginBottom: 6, paddingLeft: 32, lineHeight: 1.4 },

  statusRow: { display: "flex", alignItems: "center", gap: 5, paddingLeft: 32, marginBottom: 10 },
  dot: { width: 6, height: 6, borderRadius: "50%", flexShrink: 0 },
  scheduleText: { fontSize: 11, color: "#8A7F78", letterSpacing: "0.03em" },

  // Photo strip — full width
  photoStrip: { display: "flex", gap: 2, marginLeft: -24, width: "calc(100% + 48px)", height: 100, cursor: "pointer" },
  photoCell: { flex: 1, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" },
  photoInitial: { fontSize: 28, fontWeight: 800, color: "#B8B2A8" },

  // Accordion
  accordion: { overflow: "hidden", transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)" },
  accordionInner: { paddingTop: 14, paddingBottom: 4 },
  expandedDesc: { fontSize: 14, color: "#5A5048", lineHeight: 1.75, margin: "0 0 18px" },
  mapLinks: { display: "flex", gap: 10, marginBottom: 12 },
  mapBtn: { flex: 1, padding: "12px 0", background: "none", border: "1px solid #DED9D3", borderRadius: 3, textAlign: "center", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "#2C2520", textDecoration: "none", display: "block" },
  collapseBtn: { background: "none", border: "none", color: "#8A7F78", fontSize: 11, letterSpacing: "0.1em", cursor: "pointer", fontFamily: "inherit", padding: "4px 0" },

  bottomNav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "#F0EDE8", borderTop: "1px solid #DED9D3", display: "flex", zIndex: 100 },
  navBtn: { flex: 1, padding: "16px 0", background: "none", border: "none", color: "#8A7F78", cursor: "pointer", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "inherit" },
  navActive: { color: "#2C2520" },
  toast: { position: "fixed", bottom: 88, left: "50%", transform: "translateX(-50%)", background: "#2C2520", color: "#F0EDE8", padding: "10px 22px", borderRadius: 3, fontSize: 12, fontWeight: 500, letterSpacing: "0.08em", zIndex: 200, whiteSpace: "nowrap" },
  empty: { textAlign: "center", color: "#8A7F78", padding: "64px 0", fontSize: 14, lineHeight: 1.7 },
};
