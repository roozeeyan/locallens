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
  { id: 1,  cityId: "yerevan", category: "Кафе и рестораны", name: "Jazzve Coffee",
    shortDesc: "Армянская кофейня с традиционным кофе в джезве. Деревянный интерьер, тихая атмосфера.",
    description: "Армянская кофейня с традиционным кофе в джезве. Деревянный интерьер, тихая атмосфера и лучшая турка в центре Еревана. Обязательно попробуй кофе с кардамоном — это местная классика.", photos: ["","",""] },
  { id: 2,  cityId: "yerevan", category: "Кафе и рестораны", name: "Aperitivo",
    shortDesc: "Итальянско-армянская кухня с открытой террасой. Отличная паста, живая музыка по выходным.",
    description: "Итальянско-армянская кухня с открытой террасой. Отличная паста, живая музыка по выходным и бокал вина с видом на город. Один из лучших ресторанов для вечера на свежем воздухе.", photos: ["","",""] },
  { id: 3,  cityId: "yerevan", category: "Кафе и рестораны", name: "Dolmama",
    shortDesc: "Один из лучших ресторанов армянской кухни в городе. Классические блюда в современной подаче.",
    description: "Один из лучших ресторанов армянской кухни в городе. Классические блюда в современной подаче, уютный дворик. Шеф-повар переосмыслил традиционные рецепты — результат впечатляет.", photos: ["","",""] },
  { id: 4,  cityId: "yerevan", category: "Кафе и рестораны", name: "Lavash",
    shortDesc: "Ресторан традиционной армянской кухни. Фирменные хачапури, кюфта и домашние вина.",
    description: "Ресторан традиционной армянской кухни. Фирменные хачапури, кюфта и домашние вина. Место где едят местные — без туристических наценок и с настоящей атмосферой.", photos: ["","",""] },
  { id: 5,  cityId: "yerevan", category: "Бары",             name: "Wine Republic",
    shortDesc: "Винный бар с огромной картой армянских и грузинских вин. Тёплая атмосфера, живая музыка.",
    description: "Винный бар с огромной картой армянских и грузинских вин. Тёплая атмосфера, живая музыка и отличные сырные тарелки. Идеально для вечера с друзьями или романтического ужина.", photos: ["","",""] },
  { id: 6,  cityId: "yerevan", category: "Бары",             name: "Churchill Bar",
    shortDesc: "Классический английский паб с армянским характером. Хороший выбор виски и дартс.",
    description: "Классический английский паб с армянским характером. Хороший выбор виски, дартс и футбол на большом экране. Лучшее место в Ереване чтобы посмотреть матч в хорошей компании.", photos: ["","",""] },
  { id: 7,  cityId: "yerevan", category: "Достопримечательности", name: "Каскад",
    shortDesc: "Монументальная лестница с видом на Арарат. Внутри — галерея современного искусства.",
    description: "Монументальная лестница с видом на Арарат. Внутри — галерея современного искусства, снаружи — лучший закат в Ереване. Подъём занимает 20 минут, но вид того стоит.", photos: ["","",""] },
  { id: 8,  cityId: "yerevan", category: "Достопримечательности", name: "Матенадаран",
    shortDesc: "Хранилище древнеармянских рукописей — одно из крупнейших в мире.",
    description: "Хранилище древнеармянских рукописей — одно из крупнейших в мире. Здание само по себе архитектурный шедевр. Экскурсия с гидом открывает совершенно другой взгляд на армянскую историю.", photos: ["","",""] },
  { id: 9,  cityId: "yerevan", category: "Природа",          name: "Озеро Севан",
    shortDesc: "Высокогорное озеро в часе езды от Еревана. Монастырь Севанаванк на полуострове.",
    description: "Высокогорное озеро в часе езды от Еревана. Монастырь Севанаванк на полуострове, форель прямо с лодок, потрясающий воздух. Лучший однодневный выезд из города.", photos: ["","",""] },
  { id: 10, cityId: "yerevan", category: "Шопинг",           name: "Вернисаж",
    shortDesc: "Главный блошиный рынок Еревана. Ковры, серебро, советские значки и настоящие сувениры.",
    description: "Главный блошиный рынок Еревана. Ковры, серебро, советские значки, картины и настоящие армянские сувениры без туристических наценок. По выходным — особенно богатый выбор.", photos: ["","",""] },
  // — Бангкок —
  { id: 11, cityId: "bangkok", category: "Кафе и рестораны", name: "Gaggan Anand",
    shortDesc: "Прогрессивная индийская кухня — один из лучших ресторанов Азии по версии 50 Best.",
    description: "Прогрессивная индийская кухня — один из лучших ресторанов Азии по версии 50 Best. Меню в виде эмодзи, 25 курсов. Бронировать нужно за несколько месяцев.", photos: ["","",""] },
  { id: 12, cityId: "bangkok", category: "Кафе и рестораны", name: "Nahm",
    shortDesc: "Аутентичная тайская кухня в исполнении шеф-повара мирового уровня.",
    description: "Аутентичная тайская кухня в исполнении шеф-повара мирового уровня. Рецепты из старинных книг, почти исчезнувшие блюда. Одно из лучших мест чтобы понять настоящую тайскую кухню.", photos: ["","",""] },
  { id: 13, cityId: "bangkok", category: "Достопримечательности", name: "Wat Pho",
    shortDesc: "Храм лежащего Будды — самый большой в Бангкоке. Фигура 46 метров длиной.",
    description: "Храм лежащего Будды — самый большой в Бангкоке. Фигура Будды длиной 46 метров, перламутровая инкрустация на подошвах. Здесь также находится одна из лучших школ тайского массажа.", photos: ["","",""] },
  { id: 14, cityId: "bangkok", category: "Шопинг",           name: "Chatuchak Market",
    shortDesc: "Один из крупнейших рынков мира — 15 000 лотков. Антиквариат, одежда, растения, еда.",
    description: "Один из крупнейших рынков мира — 15 000 лотков. Антиквариат, одежда, растения, еда, всё что угодно. Только по выходным. Приходи утром — днём очень жарко.", photos: ["","",""] },
  // — Самуи —
  { id: 15, cityId: "samui",   category: "Пляжи",            name: "Chaweng Beach",
    shortDesc: "Главный пляж острова — белый песок, бирюзовая вода, развитая инфраструктура.",
    description: "Главный пляж острова — белый песок, бирюзовая вода, развитая инфраструктура. Лучший для первого знакомства с Самуи. Вечером здесь оживает стрит-фуд и бары.", photos: ["","",""] },
  { id: 16, cityId: "samui",   category: "Кафе и рестораны", name: "The Larder",
    shortDesc: "Европейский завтрак и бранч в тропиках. Яйца бенедикт, свежий хлеб, хороший кофе.",
    description: "Европейский завтрак и бранч в тропиках. Яйца бенедикт, свежий хлеб, хороший кофе — лучшее место острова для утра. Небольшой уютный интерьер, приходи пораньше.", photos: ["","",""] },
  // — Панган —
  { id: 17, cityId: "phangan", category: "Пляжи",            name: "Haad Yao",
    shortDesc: "Тихий залив с чистейшей водой вдали от полнолунных вечеринок.",
    description: "Тихий залив с чистейшей водой вдали от полнолунных вечеринок. Длинный белый пляж, скалы, закат окрашивает всё в розовый. Одно из самых красивых мест острова.", photos: ["","",""] },
  { id: 18, cityId: "phangan", category: "Природа",          name: "Than Sadet Waterfall",
    shortDesc: "Каскадный водопад в джунглях — место, которое посещали тайские короли.",
    description: "Каскадный водопад в джунглях — место, которое посещали тайские короли. Прохладные бассейны для купания, тишина и папоротники. Дорога занимает около 30 минут от центра.", photos: ["","",""] },
  // — Хой Ан —
  { id: 19, cityId: "hoian",   category: "Достопримечательности", name: "Ancient Town",
    shortDesc: "Старый город под охраной ЮНЕСКО — фонари, каналы, жёлтые стены.",
    description: "Старый город под охраной ЮНЕСКО — фонари, каналы, жёлтые стены. Вечером зажигают тысячи фонариков — это нужно видеть. Лучше гулять без карты — просто потеряться в переулках.", photos: ["","",""] },
  { id: 20, cityId: "hoian",   category: "Кафе и рестораны", name: "Morning Glory",
    shortDesc: "Самый известный ресторан вьетнамской уличной еды в Хой Ане.",
    description: "Самый известный ресторан вьетнамской уличной еды в Хой Ане. Белая роза, cao lầu, жареные вонтоны — всё здесь лучшее. Основательница ресторана лично встречает гостей.", photos: ["","",""] },
  // — Бали —
  { id: 21, cityId: "bali",    category: "Природа",          name: "Tegallalang Rice Terraces",
    shortDesc: "Знаменитые рисовые террасы к северу от Убуда. Изумрудные ступени уходят вниз в долину.",
    description: "Знаменитые рисовые террасы к северу от Убуда. Изумрудные ступени уходят вниз в долину — один из символов острова. Лучший свет для фото — раннее утро или за час до заката.", photos: ["","",""] },
  { id: 22, cityId: "bali",    category: "Кафе и рестораны", name: "Locavore",
    shortDesc: "Один из лучших ресторанов Азии в Убуде. Вся еда — с местных ферм и рынков.",
    description: "Один из лучших ресторанов Азии в Убуде. Вся еда — с местных ферм и рынков. Дегустационное меню с историей каждого ингредиента. Столик нужно бронировать заранее.", photos: ["","",""] },
].map(p => ({ ...p, saved: false }));

// ── Helpers ────────────────────────────────────────────────────────────────
const gMapsUrl = (name, city) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + city)}`;
const yMapsUrl = (name, city) =>
  `https://yandex.ru/maps/?text=${encodeURIComponent(name + " " + city)}`;

// Subtle gradient variations for 3 photo placeholders
const THUMB_BG = [
  "linear-gradient(145deg, #E8E3DC, #D4CEC6)",
  "linear-gradient(145deg, #E2DDD6, #CECAC0)",
  "linear-gradient(145deg, #DDD8D0, #C8C3BA)",
];

// ── Place card with accordion ──────────────────────────────────────────────
function PlaceCard({ place, index, city, isOpen, onToggle, onSave, isSaved }) {
  return (
    <div style={s.placeCard}>
      {/* ── Collapsed card ── */}
      <div style={s.placeCardBody} onClick={onToggle}>

        {/* Top: number + name + bookmark */}
        <div style={s.placeCardTop}>
          <span style={s.placeIdx}>{String(index + 1).padStart(2, "0")}</span>
          <span style={s.placeName}>{place.name}</span>
          <button style={{ ...s.saveBtn, color: isSaved ? "#2C2520" : "#C5BEB7" }}
            onClick={(e) => { e.stopPropagation(); onSave(); }}>
            {isSaved ? Icons.bookmarkFilled : Icons.bookmarkEmpty}
          </button>
        </div>

        {/* Short description — полностью */}
        <p style={s.placeShortDesc}>{place.shortDesc}</p>

        {/* 3 photo previews */}
        <div style={s.thumbRow}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ ...s.thumbLarge, background: THUMB_BG[i] }}>
              {place.photos?.[i]
                ? <img src={place.photos[i]} alt={place.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={s.thumbLargeInitial}>{place.name[0]}</span>
              }
            </div>
          ))}
        </div>
      </div>

      {/* ── Accordion ── */}
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

  const goCity = (city) => { setSelectedCity(city); setExpandedId(null); setScreen("city"); };
  const goCat  = (cat)  => { setSelectedCat(cat);   setExpandedId(null); setScreen("places"); };

  const goBack = () => {
    setExpandedId(null);
    if (screen === "places") return setScreen("city");
    if (screen === "city")   return setScreen("home");
    setScreen("home");
  };

  return (
    <div style={s.root}>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* ── HEADER ── */}
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

        {/* ── PLACES LIST ── */}
        {screen === "places" && selectedCity && selectedCat && (
          <>
            <div style={s.pageHero}>
              <p style={s.label}>{selectedCity.name} · {selectedCat}</p>
            </div>
            <div style={s.list}>
              {placesFor(selectedCity.id, selectedCat).map((place, i) => {
                const live = places.find(p => p.id === place.id);
                return (
                  <PlaceCard
                    key={place.id}
                    place={live}
                    index={i}
                    city={selectedCity}
                    isOpen={expandedId === place.id}
                    onToggle={() => toggleExpand(place.id)}
                    onSave={() => toggleSave(place.id)}
                    isSaved={live.saved}
                  />
                );
              })}
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
                  const city = cityFor(place.cityId);
                  const live = places.find(p => p.id === place.id);
                  return (
                    <PlaceCard
                      key={place.id}
                      place={live}
                      index={i}
                      city={city}
                      isOpen={expandedId === place.id}
                      onToggle={() => toggleExpand(place.id)}
                      onSave={() => toggleSave(place.id)}
                      isSaved={live.saved}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

      </main>

      {/* ── BOTTOM NAV ── */}
      <nav style={s.bottomNav}>
        {[["home", "Города"], ["saved", "Сохранено"]].map(([sc, label]) => {
          const active = sc === "home"
            ? ["home","city","places"].includes(screen)
            : screen === sc;
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
  heroTitle: { fontSize: 52, fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.025em", margin: "20px 0 18px", color: "#2C2520" },
  heroSub: { fontSize: 14, color: "#8A7F78", lineHeight: 1.65, maxWidth: 300 },

  pageHero: { padding: "40px 0 28px", borderBottom: "1px solid #DED9D3", marginBottom: 8 },
  pageTitle: { fontSize: 44, fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.025em", color: "#2C2520", margin: "14px 0 0" },
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
  catIcon: { flexShrink: 0, display: "flex", alignItems: "center", color: "#2C2520" },
  catName: { fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", flex: 1, textAlign: "left" },
  catMeta: { fontSize: 12, color: "#8A7F78", letterSpacing: "0.05em", flexShrink: 0 },

  // Place card
  placeCard: { borderBottom: "1px solid #DED9D3" },
  placeCardBody: { padding: "18px 0 16px", cursor: "pointer" },
  placeCardTop: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  placeIdx: { fontSize: 11, color: "#C5BEB7", letterSpacing: "0.05em", minWidth: 22, flexShrink: 0, fontWeight: 500 },
  placeName: { fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", flex: 1 },
  saveBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#8A7F78", flexShrink: 0, padding: "2px 2px", fontFamily: "inherit", lineHeight: 1 },
  placeShortDesc: { fontSize: 13, color: "#6A6058", lineHeight: 1.55, margin: "0 0 12px", paddingLeft: 32 },

  // 3 thumbnails row
  thumbRow: { display: "flex", gap: 6 },
  thumbLarge: { flex: 1, height: 88, borderRadius: 8, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" },
  thumbLargeInitial: { fontSize: 26, fontWeight: 800, color: "#B8B2A8" },

  // Accordion
  accordion: { overflow: "hidden", transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)" },
  accordionInner: { paddingBottom: 20 },

  expandedDesc: { fontSize: 14, color: "#5A5048", lineHeight: 1.75, margin: "0 0 20px" },
  mapLinks: { display: "flex", gap: 10, marginBottom: 14 },
  mapBtn: { flex: 1, padding: "12px 0", background: "none", border: "1px solid #DED9D3", borderRadius: 3, textAlign: "center", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "#2C2520", textDecoration: "none", display: "block" },
  collapseBtn: { background: "none", border: "none", color: "#8A7F78", fontSize: 11, letterSpacing: "0.1em", cursor: "pointer", fontFamily: "inherit", padding: "4px 0" },

  bottomNav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "#F0EDE8", borderTop: "1px solid #DED9D3", display: "flex", zIndex: 100 },
  navBtn: { flex: 1, padding: "16px 0", background: "none", border: "none", color: "#8A7F78", cursor: "pointer", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "inherit" },
  navActive: { color: "#2C2520" },

  toast: { position: "fixed", bottom: 88, left: "50%", transform: "translateX(-50%)", background: "#2C2520", color: "#F0EDE8", padding: "10px 22px", borderRadius: 3, fontSize: 12, fontWeight: 500, letterSpacing: "0.08em", zIndex: 200, whiteSpace: "nowrap" },
  empty: { textAlign: "center", color: "#8A7F78", padding: "64px 0", fontSize: 14, lineHeight: 1.7 },
};
