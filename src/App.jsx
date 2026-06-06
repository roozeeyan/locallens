import { useState, useRef } from "react";
import { CITIES, INITIAL_PLACES } from "./data.js";

// ── Icons ──────────────────────────────────────────────────────────────────
const Icon = ({ children }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const Icons = {
  coffee:   <Icon><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></Icon>,
  tea:      <Icon><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/></Icon>,
  wine:     <Icon><path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15A5 5 0 0 0 17 10V3H7v7a5 5 0 0 0 5 5Z"/></Icon>,
  column:   <Icon><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></Icon>,
  leaf:     <Icon><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></Icon>,
  bag:      <Icon><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></Icon>,
  wave:     <Icon><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2"/></Icon>,
  spa:      <Icon><path d="M12 22V12"/><path d="M5 12C5 6.5 8.5 2 12 2s7 4.5 7 10"/><path d="M5 12c2.8 0 5-2.2 5-5"/><path d="M19 12c-2.8 0-5-2.2-5-5"/></Icon>,
  bed:      <Icon><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></Icon>,
  landmark: <Icon><line x1="3" y1="22" x2="21" y2="22"/><path d="M6 18V7l6-5 6 5v11"/><path d="M10 18v-4h4v4"/></Icon>,
  temple:   <Icon><path d="M3 22h18"/><path d="M6 18V7"/><path d="M18 18V7"/><path d="M4 7h16"/><path d="M12 2v5"/><path d="M9 7v11"/><path d="M15 7v11"/></Icon>,
  palette:  <Icon><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></Icon>,
  eye:      <Icon><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></Icon>,
  cross:    <Icon><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/></Icon>,
  laptop:   <Icon><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></Icon>,
  market:   <Icon><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></Icon>,
  pin:      <Icon><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></Icon>,
  locate:   <Icon><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></Icon>,
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
  "Кофе и чай":            Icons.tea,
  "Бары":                  Icons.wine,
  "Фудмаркеты":            Icons.market,
  "Достопримечательности": Icons.column,
  "Исторические места":    Icons.landmark,
  "Храмы":                 Icons.temple,
  "Архитектура":           Icons.column,
  "Музеи и галереи":       Icons.palette,
  "Смотровые точки":       Icons.eye,
  "Природа":               Icons.leaf,
  "Пляжи":                 Icons.wave,
  "Велнес и spa":          Icons.spa,
  "Жильё":                 Icons.bed,
  "Шопинг":                Icons.bag,
  "Медицина":              Icons.cross,
  "Коворкинг":             Icons.laptop,
};

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

// ── Card photo carousel (top of card, swipeable, tap to zoom) ─────────────
function CardPhotos({ photos, name, onZoom, onToggle }) {
  const [idx, setIdx] = useState(0);
  const ref = useRef(null);
  const valid = (photos || []).filter(u => u);

  const onScroll = () => {
    if (!ref.current) return;
    const w = ref.current.offsetWidth;
    if (w) setIdx(Math.round(ref.current.scrollLeft / w));
  };

  // No photos — show 3 gradient placeholder cells, tap opens accordion
  if (valid.length === 0) {
    return (
      <div style={s.photoStrip} onClick={onToggle}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ ...s.photoCell, background: PHOTO_BG[i] }}>
            <span style={s.photoInitial}>{name[0]}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <div ref={ref} style={s.cardCarousel} onScroll={onScroll}>
        {valid.map((url, i) => (
          <div key={i} style={s.cardSlide} onClick={() => onZoom && onZoom(url)}>
            <img
              src={url}
              alt={`${name} ${i + 1}`}
              style={s.cardSlideImg}
              onError={e => {
                e.currentTarget.style.display = "none";
                const fb = e.currentTarget.nextSibling;
                if (fb) fb.style.display = "flex";
              }}
            />
            <div style={{ ...s.cardSlidePlaceholder, background: PHOTO_BG[i % 3] }}>
              <span style={s.photoInitial}>{name[0]}</span>
            </div>
          </div>
        ))}
      </div>
      {valid.length > 1 && (
        <div style={s.cardDots}>
          {valid.map((_, i) => (
            <span key={i} style={{
              ...s.cardDot,
              background: i === idx ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
              width: i === idx ? 14 : 5,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Place Card ─────────────────────────────────────────────────────────────
function PlaceCard({ place, index, city, isOpen, onToggle, onSave, isSaved, distanceKm, onPhotoZoom }) {
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

      {/* ── Photo carousel (swipe + tap to zoom, no accordion toggle) ── */}
      <CardPhotos photos={place.photos} name={place.name} onZoom={onPhotoZoom} onToggle={onToggle} />

      {/* ── Accordion: carousel + description + map links ── */}
      <div style={{ ...s.accordion, maxHeight: isOpen ? 320 : 0 }}>
        <div style={s.accordionInner}>
          <p style={s.expandedDesc}>{place.description}</p>
          <div style={s.mapLinks}>
            <a href={place.mapsUrl || gMapsUrl(place.name, city?.name)} target="_blank" rel="noreferrer" style={s.mapBtn}>
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

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Search & filters
  const [searchQuery, setSearchQuery]       = useState("");
  const [openNowOnly, setOpenNowOnly]       = useState(false);

  // Location & filters
  const [userLoc, setUserLoc]               = useState(null);
  const [locLoading, setLocLoading]         = useState(false);
  const [locError, setLocError]             = useState(false);
  const [radiusKm, setRadiusKm]             = useState(null);
  const [districtFilter, setDistrictFilter] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  const toggleSave = (id) => {
    const p = places.find(p => p.id === id);
    setPlaces(prev => prev.map(pl => pl.id === id ? { ...pl, saved: !pl.saved } : pl));
    showToast(p?.saved ? "Удалено из сохранённых" : "Сохранено");
  };

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  const TRAVEL_CAT = "__travel__";
  const categoriesFor = (cityId) => {
    const cats = [...new Set(places.filter(p => p.cityId === cityId).map(p => p.category))];
    if (places.some(p => p.cityId === cityId && p.travelAround)) cats.push(TRAVEL_CAT);
    return cats;
  };
  const placesFor = (cityId, cat) =>
    cat === TRAVEL_CAT
      ? places.filter(p => p.cityId === cityId && p.travelAround)
      : places.filter(p => p.cityId === cityId && p.category === cat);
  const savedPlaces   = places.filter(p => p.saved);
  const cityFor       = (cityId) => CITIES.find(c => c.id === cityId);

  const goCity = (city) => {
    setSelectedCity(city); setExpandedId(null); setDistrictFilter(null);
    setSearchQuery(""); setOpenNowOnly(false); setScreen("city");
  };
  const goCat = (cat) => {
    setSelectedCat(cat); setExpandedId(null); setDistrictFilter(null);
    setSearchQuery(""); setOpenNowOnly(false); setScreen("places");
  };
  const goBack = () => {
    setExpandedId(null); setSearchQuery(""); setOpenNowOnly(false);
    if (screen === "places") return setScreen("city");
    if (screen === "city")   return setScreen("home");
    setScreen("home");
  };

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocError(true); return; }
    setLocLoading(true); setLocError(false);
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocLoading(false); },
      () => { setLocLoading(false); setLocError(true); },
      { timeout: 8000 }
    );
  };

  // Compute displayed places with distance, filters, sort
  const rawPlaces = placesFor(selectedCity?.id, selectedCat);
  const districts = [...new Set(rawPlaces.map(p => p.district).filter(Boolean))];

  const displayPlaces = rawPlaces
    .map(p => ({
      ...p,
      distanceKm: userLoc && p.lat && p.lng
        ? haversine(userLoc.lat, userLoc.lng, p.lat, p.lng)
        : null,
    }))
    .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(p => !openNowOnly || getOpenStatus(p.openFrom, p.openTo)?.open === true)
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

      {/* ── Lightbox ── */}
      {lightboxUrl && (
        <div style={s.lightbox} onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="" style={s.lightboxImg} />
          <button style={s.lightboxClose} onClick={() => setLightboxUrl(null)}>✕</button>
        </div>
      )}

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
                  <span style={s.catIcon}>{cat === TRAVEL_CAT ? Icons.pin : (CATEGORY_ICONS[cat] || Icons.pin)}</span>
                  <span style={s.catName}>{cat === TRAVEL_CAT ? "За городом" : cat}</span>
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
              <p style={s.label}>{selectedCity.name} · {selectedCat === TRAVEL_CAT ? "За городом" : selectedCat}</p>
            </div>

            {/* Filters */}
            <div style={s.filtersBlock}>
              {/* Search */}
              <div style={s.searchWrap}>
                <input
                  type="text"
                  placeholder="Поиск по названию..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={s.searchInput}
                />
                {searchQuery && (
                  <button style={s.searchClear} onClick={() => setSearchQuery("")}>✕</button>
                )}
              </div>

              {/* Open now toggle */}
              <button
                style={openNowOnly ? s.chipActive : s.chip}
                onClick={() => setOpenNowOnly(v => !v)}
              >
                🟢 Открыто сейчас
              </button>

              <button style={s.locBtn} onClick={requestLocation} disabled={locLoading}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {Icons.locate}
                  {locLoading ? "Определяем..." : userLoc ? "Геолокация активна" : "Найти ближайшие"}
                </span>
                {userLoc && <span style={s.locDot} />}
              </button>
              {locError && <p style={s.locErrorMsg}>Не удалось получить геолокацию</p>}
              {userLoc && <Chips options={RADIUS_OPTIONS} active={radiusKm} onSelect={setRadiusKm} />}
              {districts.length > 1 && <Chips options={districtOptions} active={districtFilter} onSelect={setDistrictFilter} />}
            </div>

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
                      distanceKm={place.distanceKm}
                      onPhotoZoom={setLightboxUrl} />
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
                    ? haversine(userLoc.lat, userLoc.lng, live.lat, live.lng) : null;
                  return (
                    <PlaceCard key={place.id} place={live} index={i} city={cityFor(place.cityId)}
                      isOpen={expandedId === place.id}
                      onToggle={() => toggleExpand(place.id)}
                      onSave={() => toggleSave(place.id)}
                      isSaved={live.saved}
                      distanceKm={distanceKm}
                      onPhotoZoom={setLightboxUrl} />
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
  filtersBlock: { padding: "14px 0 4px", borderBottom: "1px solid #DED9D3", display: "flex", flexDirection: "column", gap: 10 },
  searchWrap: { position: "relative", display: "flex", alignItems: "center" },
  searchInput: { width: "100%", padding: "10px 36px 10px 14px", border: "1px solid #DED9D3", borderRadius: 3, background: "#F0EDE8", color: "#2C2520", fontSize: 14, fontFamily: "'DM Sans', -apple-system, sans-serif", outline: "none", boxSizing: "border-box", letterSpacing: "0.01em" },
  searchClear: { position: "absolute", right: 10, background: "none", border: "none", color: "#8A7F78", cursor: "pointer", fontSize: 13, padding: 4, lineHeight: 1 },
  locBtn: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "1px solid #DED9D3", borderRadius: 3, padding: "10px 14px", color: "#2C2520", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500, letterSpacing: "0.02em" },
  locDot: { width: 7, height: 7, borderRadius: "50%", background: "#7BAE7F", flexShrink: 0 },
  locErrorMsg: { fontSize: 11, color: "#B07070", marginBottom: 8, letterSpacing: "0.02em" },
  chipsRow: { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none", WebkitOverflowScrolling: "touch" },
  chip: { flexShrink: 0, padding: "6px 12px", border: "1px solid #DED9D3", borderRadius: 20, background: "none", color: "#8A7F78", cursor: "pointer", fontSize: 12, fontWeight: 500, letterSpacing: "0.03em", fontFamily: "inherit", whiteSpace: "nowrap" },
  chipActive: { flexShrink: 0, padding: "6px 12px", border: "1px solid #2C2520", borderRadius: 20, background: "#2C2520", color: "#F0EDE8", cursor: "pointer", fontSize: 12, fontWeight: 500, letterSpacing: "0.03em", fontFamily: "inherit", whiteSpace: "nowrap" },

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

  // Photo strip — placeholder (no photos case)
  photoStrip: { display: "flex", gap: 2, marginLeft: -24, width: "calc(100% + 48px)", height: 110, cursor: "pointer" },
  photoCell: { flex: 1, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" },
  photoInitial: { fontSize: 28, fontWeight: 800, color: "#B8B2A8" },

  // Card photo carousel (when real photos exist)
  cardCarousel: {
    display: "flex",
    overflowX: "auto",
    scrollSnapType: "x mandatory",
    scrollbarWidth: "none",
    WebkitOverflowScrolling: "touch",
    marginLeft: -24,
    width: "calc(100% + 48px)",
    height: 200,
    cursor: "zoom-in",
  },
  cardSlide: {
    minWidth: "100%",
    height: "100%",
    scrollSnapAlign: "start",
    flexShrink: 0,
    position: "relative",
    overflow: "hidden",
  },
  cardSlideImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  cardSlidePlaceholder: {
    position: "absolute", inset: 0,
    display: "none",
    alignItems: "center", justifyContent: "center",
  },
  cardDots: {
    position: "absolute",
    bottom: 8, left: 0, right: 0,
    display: "flex", justifyContent: "center", gap: 5,
    pointerEvents: "none",
  },
  cardDot: {
    height: 5, borderRadius: 3,
    transition: "width 0.2s, background 0.2s",
  },

  // Lightbox
  lightbox: {
    position: "fixed", inset: 0, zIndex: 999,
    background: "rgba(0,0,0,0.93)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "zoom-out",
  },
  lightboxImg: {
    maxWidth: "100%",
    maxHeight: "calc(100vh - 80px)",
    objectFit: "contain",
  },
  lightboxClose: {
    position: "absolute", top: 20, right: 20,
    background: "rgba(255,255,255,0.15)", border: "none", color: "white",
    width: 38, height: 38, borderRadius: "50%", fontSize: 18, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "inherit", lineHeight: 1,
  },

  // Accordion
  accordion: { overflow: "hidden", transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)" },
  accordionInner: { paddingTop: 16, paddingBottom: 4 },
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
