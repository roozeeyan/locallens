import { useState } from "react";

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
  { id: 1,  cityId: "yerevan", category: "Кафе и рестораны", name: "Jazzve Coffee" },
  { id: 2,  cityId: "yerevan", category: "Кафе и рестораны", name: "Aperitivo" },
  { id: 3,  cityId: "yerevan", category: "Кафе и рестораны", name: "Dolmama" },
  { id: 4,  cityId: "yerevan", category: "Кафе и рестораны", name: "Lavash" },
  { id: 5,  cityId: "yerevan", category: "Бары",             name: "Wine Republic" },
  { id: 6,  cityId: "yerevan", category: "Бары",             name: "Churchill Bar" },
  { id: 7,  cityId: "yerevan", category: "Достопримечательности", name: "Каскад" },
  { id: 8,  cityId: "yerevan", category: "Достопримечательности", name: "Матенадаран" },
  { id: 9,  cityId: "yerevan", category: "Природа",          name: "Озеро Севан" },
  { id: 10, cityId: "yerevan", category: "Шопинг",           name: "Вернисаж" },
  // — Бангкок —
  { id: 11, cityId: "bangkok", category: "Кафе и рестораны", name: "Gaggan Anand" },
  { id: 12, cityId: "bangkok", category: "Кафе и рестораны", name: "Nahm" },
  { id: 13, cityId: "bangkok", category: "Достопримечательности", name: "Wat Pho" },
  { id: 14, cityId: "bangkok", category: "Шопинг",           name: "Chatuchak Market" },
  // — Самуи —
  { id: 15, cityId: "samui",   category: "Пляжи",            name: "Chaweng Beach" },
  { id: 16, cityId: "samui",   category: "Кафе и рестораны", name: "The Larder" },
  // — Панган —
  { id: 17, cityId: "phangan", category: "Пляжи",            name: "Haad Yao" },
  { id: 18, cityId: "phangan", category: "Природа",          name: "Than Sadet Waterfall" },
  // — Хой Ан —
  { id: 19, cityId: "hoian",   category: "Достопримечательности", name: "Ancient Town" },
  { id: 20, cityId: "hoian",   category: "Кафе и рестораны", name: "Morning Glory" },
  // — Бали —
  { id: 21, cityId: "bali",    category: "Природа",          name: "Tegallalang Rice Terraces" },
  { id: 22, cityId: "bali",    category: "Кафе и рестораны", name: "Locavore" },
].map(p => ({ ...p, saved: false }));

export default function App() {
  const [screen, setScreen]               = useState("home");
  const [selectedCity, setSelectedCity]   = useState(null);
  const [selectedCat, setSelectedCat]     = useState(null);
  const [places, setPlaces]               = useState(INITIAL_PLACES);
  const [toast, setToast]                 = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const toggleSave = (id, e) => {
    e?.stopPropagation();
    const place = places.find(p => p.id === id);
    setPlaces(prev => prev.map(p => p.id === id ? { ...p, saved: !p.saved } : p));
    showToast(place?.saved ? "Удалено из сохранённых" : "Сохранено");
  };

  const categoriesFor  = (cityId) => [...new Set(places.filter(p => p.cityId === cityId).map(p => p.category))];
  const placesFor      = (cityId, cat) => places.filter(p => p.cityId === cityId && p.category === cat);
  const savedPlaces    = places.filter(p => p.saved);

  const goCity = (city) => { setSelectedCity(city); setScreen("city"); };
  const goCat  = (cat)  => { setSelectedCat(cat);   setScreen("places"); };
  const goBack = ()     => screen === "places" ? setScreen("city") : setScreen("home");

  const cityFor = (cityId) => CITIES.find(c => c.id === cityId);

  return (
    <div style={s.root}>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* ── HEADER ── */}
      <header style={s.header}>
        <span style={s.logo} onClick={() => setScreen("home")}>LOCALLENS</span>
        {(screen === "city" || screen === "places") && (
          <button style={s.backBtn} onClick={goBack}>← назад</button>
        )}
      </header>

      <main style={s.main}>

        {/* ── HOME ── */}
        {screen === "home" && (
          <>
            <div style={s.hero}>
              <p style={s.heroLabel}>ROO SELECTION · TRAVEL</p>
              <h1 style={s.heroTitle}>Города,<br />которые я люблю</h1>
              <p style={s.heroSub}>Личная подборка мест — кафе, рестораны, природа, атмосфера</p>
            </div>

            <div style={s.list}>
              {CITIES.map((city) => (
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
              <p style={s.pageLabel}>{selectedCity.country}</p>
              <h1 style={s.pageTitle}>{selectedCity.name}</h1>
            </div>
            <div style={s.list}>
              {categoriesFor(selectedCity.id).map(cat => (
                <button key={cat} style={s.catRow} onClick={() => goCat(cat)}>
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
              <p style={s.pageLabel}>{selectedCity.name} · {selectedCat}</p>
            </div>
            <div style={s.list}>
              {placesFor(selectedCity.id, selectedCat).map((place, i) => (
                <div key={place.id} style={s.placeRow}>
                  <span style={s.placeIdx}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={s.placeName}>{place.name}</span>
                  <button style={s.saveBtn} onClick={(e) => toggleSave(place.id, e)}>
                    {place.saved ? "◆" : "◇"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── SAVED ── */}
        {screen === "saved" && (
          <>
            <div style={s.pageHero}>
              <p style={s.pageLabel}>МОИ ЗАКЛАДКИ</p>
              <h1 style={s.pageTitle}>Сохранённое</h1>
            </div>
            {savedPlaces.length === 0 ? (
              <p style={s.empty}>Пока пусто — сохраняй места которые понравились</p>
            ) : (
              <div style={s.list}>
                {savedPlaces.map((place) => {
                  const city = cityFor(place.cityId);
                  return (
                    <div key={place.id} style={s.placeRow}>
                      <span style={s.placeIdx}>{city?.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={s.placeName}>{place.name}</div>
                        <div style={s.cityCountry}>{city?.name} · {place.category}</div>
                      </div>
                      <button style={s.saveBtn} onClick={(e) => toggleSave(place.id, e)}>◆</button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </main>

      {/* ── BOTTOM NAV ── */}
      <nav style={s.bottomNav}>
        {[
          ["home",  "Города"],
          ["saved", "Сохранено"],
        ].map(([sc, label]) => {
          const active = sc === "home"
            ? ["home", "city", "places"].includes(screen)
            : screen === sc;
          return (
            <button key={sc} onClick={() => setScreen(sc)}
              style={{ ...s.navBtn, ...(active ? s.navActive : {}) }}>
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

const s = {
  root: {
    fontFamily: "'DM Sans', -apple-system, sans-serif",
    background: "#F0EDE8",
    minHeight: "100vh",
    color: "#2C2520",
    paddingBottom: 72,
  },

  // Header
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 24px",
    background: "#F0EDE8",
    borderBottom: "1px solid #DED9D3",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.18em",
    color: "#2C2520",
    cursor: "pointer",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#8A7F78",
    cursor: "pointer",
    fontSize: 13,
    letterSpacing: "0.05em",
    fontFamily: "inherit",
  },

  main: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "0 24px",
  },

  // Hero
  hero: {
    padding: "52px 0 40px",
    borderBottom: "1px solid #DED9D3",
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: 10,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "#8A7F78",
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 52,
    fontWeight: 800,
    lineHeight: 1.0,
    letterSpacing: "-0.025em",
    marginBottom: 18,
    color: "#2C2520",
  },
  heroSub: {
    fontSize: 14,
    color: "#8A7F78",
    lineHeight: 1.65,
    maxWidth: 300,
  },

  // Page hero (city / category screens)
  pageHero: {
    padding: "40px 0 28px",
    borderBottom: "1px solid #DED9D3",
    marginBottom: 8,
  },
  pageLabel: {
    fontSize: 10,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "#8A7F78",
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 44,
    fontWeight: 800,
    lineHeight: 1.0,
    letterSpacing: "-0.025em",
    color: "#2C2520",
  },

  // List container
  list: {
    display: "flex",
    flexDirection: "column",
  },

  // City row
  cityRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "20px 0",
    background: "none",
    border: "none",
    borderBottom: "1px solid #DED9D3",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    color: "#2C2520",
    fontFamily: "inherit",
  },
  cityEmoji: { fontSize: 26, flexShrink: 0 },
  cityInfo:  { display: "flex", flexDirection: "column", gap: 3, flex: 1 },
  cityName:  { fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" },
  cityCountry: { fontSize: 11, color: "#8A7F78", letterSpacing: "0.1em", textTransform: "uppercase" },
  arrow: { color: "#C5BEB7", fontSize: 18, flexShrink: 0 },

  // Saved banner
  savedBanner: {
    marginTop: 32,
    width: "100%",
    padding: "16px 20px",
    background: "#2C2520",
    color: "#F0EDE8",
    border: "none",
    borderRadius: 3,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  // Category row
  catRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 0",
    background: "none",
    border: "none",
    borderBottom: "1px solid #DED9D3",
    cursor: "pointer",
    width: "100%",
    fontFamily: "inherit",
    color: "#2C2520",
  },
  catName: { fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" },
  catMeta: { fontSize: 12, color: "#8A7F78", letterSpacing: "0.05em" },

  // Place row
  placeRow: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    padding: "16px 0",
    borderBottom: "1px solid #DED9D3",
  },
  placeIdx:  { fontSize: 11, color: "#C5BEB7", letterSpacing: "0.05em", minWidth: 24, flexShrink: 0, fontWeight: 500 },
  placeName: { fontSize: 16, fontWeight: 500, flex: 1, letterSpacing: "-0.01em" },
  saveBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 15,
    color: "#8A7F78",
    flexShrink: 0,
    padding: "4px 0",
    fontFamily: "inherit",
    lineHeight: 1,
  },

  // Bottom nav
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "#F0EDE8",
    borderTop: "1px solid #DED9D3",
    display: "flex",
    zIndex: 100,
  },
  navBtn: {
    flex: 1,
    padding: "16px 0",
    background: "none",
    border: "none",
    color: "#8A7F78",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    fontFamily: "inherit",
  },
  navActive: {
    color: "#2C2520",
  },

  // Toast
  toast: {
    position: "fixed",
    bottom: 88,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#2C2520",
    color: "#F0EDE8",
    padding: "10px 22px",
    borderRadius: 3,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.08em",
    zIndex: 200,
    whiteSpace: "nowrap",
  },

  // Empty state
  empty: {
    textAlign: "center",
    color: "#8A7F78",
    padding: "64px 0",
    fontSize: 14,
    lineHeight: 1.7,
    letterSpacing: "0.02em",
  },
};
