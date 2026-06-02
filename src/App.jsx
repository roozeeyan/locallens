import { useState, useEffect } from "react";

const CITIES_EMOJI = {
  "Москва": "🏛️", "Санкт-Петербург": "🌉", "Стамбул": "🕌", "Барселона": "🎨",
  "Париж": "🗼", "Токио": "⛩️", "Нью-Йорк": "🗽", "Берлин": "🎵",
  "Дубай": "🌆", "Рим": "🏟️", "Бангкок": "🛺", "Амстердам": "🚲"
};

const CATEGORY_COLORS = {
  "Еда и кафе": "#FF6B6B",
  "Достопримечательности": "#4ECDC4",
  "Ночная жизнь": "#9B59B6",
  "Природа": "#2ECC71",
  "Шопинг": "#F39C12",
  "Скрытые места": "#E74C3C",
};

const SAMPLE_GUIDES = [
  {
    id: 1, city: "Стамбул", title: "Лучшие кофейни Бейоглу", author: "Алина К.",
    category: "Еда и кафе", rating: 4.8, views: 1240,
    description: "Пройдись по узким улочкам Бейоглу и найди лучший турецкий кофе. Мои топ-7 мест, где местные пьют чай по утрам.",
    spots: ["Mandabatmaz", "Walter's Coffee", "Fazıl Bey", "Kronotrop"],
    date: "12 мая 2026", saved: false
  },
  {
    id: 2, city: "Барселона", title: "Скрытые дворики Готики", author: "Макс Р.",
    category: "Скрытые места", rating: 4.9, views: 890,
    description: "Большинство туристов проходят мимо этих мест. Я прожил здесь 3 месяца и собрал дворики, куда не ведут путеводители.",
    spots: ["Carrer del Bisbe", "Plaça de Sant Felip Neri", "El Born"],
    date: "5 мая 2026", saved: true
  },
  {
    id: 3, city: "Токио", title: "Завтраки в Симокитадзаве", author: "Дарья М.",
    category: "Еда и кафе", rating: 5.0, views: 2100,
    description: "Симокитадзава — самый уютный район Токио. Здесь лучшие кофейни, виниловые магазины и атмосфера 90-х.",
    spots: ["Bear Pond Espresso", "Cafe Bohemia", "Suzunari Theatre"],
    date: "1 мая 2026", saved: false
  }
];

export default function App() {
  const [screen, setScreen] = useState("home"); // home | explore | create | detail | profile
  const [guides, setGuides] = useState(SAMPLE_GUIDES);
  const [activeGuide, setActiveGuide] = useState(null);
  const [filterCity, setFilterCity] = useState("Все");
  const [filterCat, setFilterCat] = useState("Все");
  const [form, setForm] = useState({ city: "", title: "", description: "", category: "Еда и кафе", spots: "" });
  const [published, setPublished] = useState(false);
  const [search, setSearch] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const cities = ["Все", ...new Set(guides.map(g => g.city))];
  const categories = ["Все", ...Object.keys(CATEGORY_COLORS)];

  const filtered = guides.filter(g => {
    const matchCity = filterCity === "Все" || g.city === filterCity;
    const matchCat = filterCat === "Все" || g.category === filterCat;
    const matchSearch = g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.city.toLowerCase().includes(search.toLowerCase());
    const matchSaved = !savedOnly || g.saved;
    return matchCity && matchCat && matchSearch && matchSaved;
  });

  const toggleSave = (id) => {
    setGuides(prev => prev.map(g => g.id === id ? { ...g, saved: !g.saved } : g));
    const guide = guides.find(g => g.id === id);
    showToast(guide?.saved ? "Удалено из сохранённых" : "Сохранено ✓");
  };

  const handlePublish = () => {
    if (!form.city || !form.title || !form.description) return;
    const newGuide = {
      id: Date.now(), city: form.city, title: form.title, author: "Вы",
      category: form.category, rating: 5.0, views: 1,
      description: form.description,
      spots: form.spots.split(",").map(s => s.trim()).filter(Boolean),
      date: new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }),
      saved: false, isOwn: true
    };
    setGuides(prev => [newGuide, ...prev]);
    setPublished(true);
    setTimeout(() => { setPublished(false); setForm({ city: "", title: "", description: "", category: "Еда и кафе", spots: "" }); setScreen("home"); }, 1800);
  };

  const openGuide = (guide) => {
    setActiveGuide(guide);
    setGuides(prev => prev.map(g => g.id === guide.id ? { ...g, views: g.views + 1 } : g));
    setScreen("detail");
  };

  return (
    <div style={styles.root}>
      {/* Toast */}
      {toast && <div style={styles.toast}>{toast}</div>}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo} onClick={() => setScreen("home")}>
          <span style={styles.logoIcon}>🧭</span>
          <span style={styles.logoText}>LocalLens</span>
        </div>
        <nav style={styles.nav}>
          {["home", "explore", "create", "profile"].map(s => (
            <button key={s} onClick={() => setScreen(s)} style={{ ...styles.navBtn, ...(screen === s ? styles.navActive : {}) }}>
              {s === "home" ? "🏠" : s === "explore" ? "🔍" : s === "create" ? "✏️" : "👤"}
            </button>
          ))}
        </nav>
      </header>

      <main style={styles.main}>

        {/* ─── HOME ─── */}
        {screen === "home" && (
          <div>
            <div style={styles.hero}>
              <div style={styles.heroTag}>Гайды от реальных путешественников</div>
              <h1 style={styles.heroTitle}>Открывай города<br /><span style={styles.accent}>как местный</span></h1>
              <p style={styles.heroSub}>Делись своими находками. Помогай другим путешественникам.</p>
              <div style={styles.heroActions}>
                <button style={styles.btnPrimary} onClick={() => setScreen("explore")}>Смотреть гайды</button>
                <button style={styles.btnSecondary} onClick={() => setScreen("create")}>Написать гайд</button>
              </div>
            </div>

            {/* Stats */}
            <div style={styles.stats}>
              {[["🗺️", guides.length, "гайдов"], ["🌍", new Set(guides.map(g => g.city)).size, "городов"], ["👁️", guides.reduce((a, g) => a + g.views, 0).toLocaleString(), "просмотров"]].map(([ic, v, l]) => (
                <div key={l} style={styles.statCard}>
                  <div style={styles.statIcon}>{ic}</div>
                  <div style={styles.statVal}>{v}</div>
                  <div style={styles.statLabel}>{l}</div>
                </div>
              ))}
            </div>

            {/* Recent */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Свежие гайды</h2>
                <button style={styles.seeAll} onClick={() => setScreen("explore")}>Все →</button>
              </div>
              <div style={styles.cardGrid}>
                {guides.slice(0, 3).map(g => <GuideCard key={g.id} guide={g} onOpen={openGuide} onSave={toggleSave} />)}
              </div>
            </div>

            {/* City bubbles */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Популярные города</h2>
              <div style={styles.cityBubbles}>
                {Object.entries(CITIES_EMOJI).map(([city, emoji]) => (
                  <button key={city} style={styles.cityBubble} onClick={() => { setFilterCity(city); setScreen("explore"); }}>
                    {emoji} {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── EXPLORE ─── */}
        {screen === "explore" && (
          <div>
            <h2 style={styles.pageTitle}>Исследовать</h2>
            <input
              style={styles.searchInput}
              placeholder="🔍  Поиск по городу или названию..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div style={styles.filters}>
              <div style={styles.filterRow}>
                <span style={styles.filterLabel}>Город:</span>
                {cities.slice(0, 6).map(c => (
                  <button key={c} onClick={() => setFilterCity(c)}
                    style={{ ...styles.filterChip, ...(filterCity === c ? styles.filterChipActive : {}) }}>
                    {c}
                  </button>
                ))}
              </div>
              <div style={styles.filterRow}>
                <span style={styles.filterLabel}>Тема:</span>
                {categories.slice(0, 5).map(c => (
                  <button key={c} onClick={() => setFilterCat(c)}
                    style={{ ...styles.filterChip, ...(filterCat === c ? styles.filterChipActive : {}) }}>
                    {c}
                  </button>
                ))}
              </div>
              <div style={styles.filterRow}>
                <button onClick={() => setSavedOnly(!savedOnly)}
                  style={{ ...styles.filterChip, ...(savedOnly ? styles.filterChipActive : {}) }}>
                  🔖 Сохранённые
                </button>
              </div>
            </div>
            <p style={styles.resultCount}>{filtered.length} гайдов найдено</p>
            <div style={styles.cardGrid}>
              {filtered.map(g => <GuideCard key={g.id} guide={g} onOpen={openGuide} onSave={toggleSave} />)}
            </div>
            {filtered.length === 0 && (
              <div style={styles.empty}>😕<br />Ничего не найдено.<br />Попробуй другие фильтры.</div>
            )}
          </div>
        )}

        {/* ─── CREATE ─── */}
        {screen === "create" && (
          <div>
            <h2 style={styles.pageTitle}>Создать гайд</h2>
            {published ? (
              <div style={styles.successBox}>
                <div style={{ fontSize: 56 }}>🎉</div>
                <h3 style={{ margin: "12px 0 4px", fontSize: 22 }}>Опубликовано!</h3>
                <p style={{ color: "#666", margin: 0 }}>Твой гайд виден всем путешественникам</p>
              </div>
            ) : (
              <div style={styles.createForm}>
                <label style={styles.label}>Город *</label>
                <input style={styles.input} placeholder="Например: Стамбул" value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })} />

                <label style={styles.label}>Название гайда *</label>
                <input style={styles.input} placeholder="Например: Лучшие завтраки в центре"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />

                <label style={styles.label}>Категория</label>
                <select style={styles.input} value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}>
                  {Object.keys(CATEGORY_COLORS).map(c => <option key={c}>{c}</option>)}
                </select>

                <label style={styles.label}>Описание *</label>
                <textarea style={{ ...styles.input, height: 100, resize: "vertical" }}
                  placeholder="Расскажи, что особенного в этих местах..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

                <label style={styles.label}>Локации (через запятую)</label>
                <input style={styles.input} placeholder="Кафе Роза, Парк Победы, Набережная..."
                  value={form.spots} onChange={e => setForm({ ...form, spots: e.target.value })} />

                <button style={{
                  ...styles.btnPrimary,
                  width: "100%",
                  marginTop: 8,
                  opacity: (!form.city || !form.title || !form.description) ? 0.5 : 1
                }} onClick={handlePublish}>
                  Опубликовать гайд 🚀
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── DETAIL ─── */}
        {screen === "detail" && activeGuide && (
          <div>
            <button style={styles.backBtn} onClick={() => setScreen("explore")}>← Назад</button>
            <div style={styles.detailCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ ...styles.catBadge, background: CATEGORY_COLORS[activeGuide.category] || "#888" }}>
                    {activeGuide.category}
                  </div>
                  <h1 style={styles.detailTitle}>{activeGuide.title}</h1>
                  <div style={styles.detailMeta}>
                    <span>📍 {activeGuide.city}</span>
                    <span>✍️ {activeGuide.author}</span>
                    <span>📅 {activeGuide.date}</span>
                  </div>
                </div>
                <button style={styles.saveBtn} onClick={() => toggleSave(activeGuide.id)}>
                  {activeGuide.saved ? "🔖" : "🏷️"}
                </button>
              </div>

              <div style={styles.detailStats}>
                <span>⭐ {activeGuide.rating}</span>
                <span>👁️ {activeGuide.views} просмотров</span>
              </div>

              <p style={styles.detailDesc}>{activeGuide.description}</p>

              {activeGuide.spots?.length > 0 && (
                <div>
                  <h3 style={styles.spotsTitle}>📌 Места в гайде</h3>
                  <div style={styles.spotsList}>
                    {activeGuide.spots.map((s, i) => (
                      <div key={i} style={styles.spotItem}>
                        <span style={styles.spotNum}>{i + 1}</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button style={{ ...styles.btnPrimary, width: "100%", marginTop: 24 }}
                onClick={() => toggleSave(activeGuide.id)}>
                {activeGuide.saved ? "🔖 Сохранено" : "Сохранить гайд"}
              </button>
            </div>
          </div>
        )}

        {/* ─── PROFILE ─── */}
        {screen === "profile" && (
          <div>
            <div style={styles.profileHeader}>
              <div style={styles.avatar}>✈️</div>
              <h2 style={{ margin: "12px 0 4px", fontSize: 22 }}>Путешественник</h2>
              <p style={{ color: "#888", margin: 0 }}>Делюсь находками с миром</p>
            </div>
            <div style={styles.stats}>
              {[
                ["✏️", guides.filter(g => g.isOwn).length, "моих гайдов"],
                ["🔖", guides.filter(g => g.saved).length, "сохранённых"],
                ["👁️", guides.filter(g => g.isOwn).reduce((a, g) => a + g.views, 0), "просмотров"]
              ].map(([ic, v, l]) => (
                <div key={l} style={styles.statCard}>
                  <div style={styles.statIcon}>{ic}</div>
                  <div style={styles.statVal}>{v}</div>
                  <div style={styles.statLabel}>{l}</div>
                </div>
              ))}
            </div>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Мои гайды</h3>
              {guides.filter(g => g.isOwn).length === 0 ? (
                <div style={styles.empty}>
                  Ты ещё не написал ни одного гайда.<br />
                  <button style={{ ...styles.btnPrimary, marginTop: 16 }} onClick={() => setScreen("create")}>
                    Создать первый гайд
                  </button>
                </div>
              ) : (
                <div style={styles.cardGrid}>
                  {guides.filter(g => g.isOwn).map(g => <GuideCard key={g.id} guide={g} onOpen={openGuide} onSave={toggleSave} />)}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Bottom nav mobile */}
      <div style={styles.bottomNav}>
        {[["home", "🏠", "Главная"], ["explore", "🔍", "Поиск"], ["create", "✏️", "Создать"], ["profile", "👤", "Профиль"]].map(([s, ic, lb]) => (
          <button key={s} onClick={() => setScreen(s)}
            style={{ ...styles.bottomNavBtn, ...(screen === s ? styles.bottomNavActive : {}) }}>
            <span style={{ fontSize: 20 }}>{ic}</span>
            <span style={{ fontSize: 11 }}>{lb}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function GuideCard({ guide, onOpen, onSave }) {
  return (
    <div style={styles.card} onClick={() => onOpen(guide)}>
      <div style={{ ...styles.cardTop, background: `linear-gradient(135deg, ${CATEGORY_COLORS[guide.category] || "#888"}33, ${CATEGORY_COLORS[guide.category] || "#888"}11)` }}>
        <span style={{ fontSize: 40 }}>{CITIES_EMOJI[guide.city] || "🌍"}</span>
        <button style={styles.cardSaveBtn} onClick={e => { e.stopPropagation(); onSave(guide.id); }}>
          {guide.saved ? "🔖" : "🏷️"}
        </button>
      </div>
      <div style={styles.cardBody}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <span style={{ ...styles.catBadge, background: CATEGORY_COLORS[guide.category] || "#888", fontSize: 10, padding: "2px 8px" }}>
            {guide.category}
          </span>
          <span style={{ color: "#999", fontSize: 11 }}>📍 {guide.city}</span>
        </div>
        <h3 style={styles.cardTitle}>{guide.title}</h3>
        <p style={styles.cardDesc}>{guide.description.slice(0, 80)}...</p>
        <div style={styles.cardFooter}>
          <span style={{ color: "#F39C12", fontSize: 12 }}>⭐ {guide.rating}</span>
          <span style={{ color: "#aaa", fontSize: 11 }}>👁️ {guide.views}</span>
          <span style={{ color: "#bbb", fontSize: 11 }}>{guide.author}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: { fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#0f0f13", minHeight: "100vh", color: "#f0f0f0", paddingBottom: 80 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#16161d", borderBottom: "1px solid #2a2a35", position: "sticky", top: 0, zIndex: 100 },
  logo: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer" },
  logoIcon: { fontSize: 24 },
  logoText: { fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", color: "#fff" },
  nav: { display: "flex", gap: 4 },
  navBtn: { background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: "6px 10px", borderRadius: 8, color: "#666" },
  navActive: { background: "#2a2a40", color: "#fff" },
  main: { maxWidth: 640, margin: "0 auto", padding: "20px 16px" },
  hero: { textAlign: "center", padding: "32px 0 24px" },
  heroTag: { display: "inline-block", background: "#1e1e2e", border: "1px solid #3a3a50", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#9090b0", marginBottom: 16 },
  heroTitle: { fontSize: 38, fontWeight: 900, lineHeight: 1.15, margin: "0 0 12px", letterSpacing: "-1px" },
  accent: { color: "#7C6FF7" },
  heroSub: { color: "#888", fontSize: 15, margin: "0 0 24px" },
  heroActions: { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" },
  btnPrimary: { background: "#7C6FF7", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontWeight: 700, fontSize: 15, cursor: "pointer" },
  btnSecondary: { background: "transparent", color: "#7C6FF7", border: "2px solid #7C6FF7", borderRadius: 12, padding: "10px 22px", fontWeight: 700, fontSize: 15, cursor: "pointer" },
  stats: { display: "flex", gap: 12, margin: "24px 0" },
  statCard: { flex: 1, background: "#16161d", border: "1px solid #2a2a35", borderRadius: 16, padding: "16px 8px", textAlign: "center" },
  statIcon: { fontSize: 22 },
  statVal: { fontSize: 22, fontWeight: 800, margin: "4px 0 2px" },
  statLabel: { fontSize: 11, color: "#666" },
  section: { marginBottom: 32 },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 700, margin: "0 0 16px" },
  seeAll: { background: "none", border: "none", color: "#7C6FF7", cursor: "pointer", fontWeight: 600 },
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 },
  card: { background: "#16161d", border: "1px solid #2a2a35", borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "transform 0.15s", },
  cardTop: { height: 90, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" },
  cardSaveBtn: { position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.4)", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 16, padding: "4px 6px" },
  cardBody: { padding: "12px 14px 14px" },
  cardTitle: { fontSize: 15, fontWeight: 700, margin: "0 0 6px" },
  cardDesc: { fontSize: 12, color: "#888", margin: "0 0 10px", lineHeight: 1.5 },
  cardFooter: { display: "flex", gap: 10, alignItems: "center" },
  catBadge: { display: "inline-block", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 },
  cityBubbles: { display: "flex", flexWrap: "wrap", gap: 8 },
  cityBubble: { background: "#1e1e2e", border: "1px solid #2a2a35", borderRadius: 20, padding: "8px 14px", cursor: "pointer", fontSize: 13, color: "#ccc", fontWeight: 500 },
  pageTitle: { fontSize: 26, fontWeight: 800, margin: "0 0 20px" },
  searchInput: { width: "100%", background: "#1e1e2e", border: "1px solid #2a2a35", borderRadius: 12, padding: "12px 16px", color: "#fff", fontSize: 14, marginBottom: 16, boxSizing: "border-box" },
  filters: { marginBottom: 16 },
  filterRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8, alignItems: "center" },
  filterLabel: { fontSize: 12, color: "#666", minWidth: 50 },
  filterChip: { background: "#1e1e2e", border: "1px solid #2a2a35", color: "#aaa", borderRadius: 20, padding: "5px 12px", fontSize: 12, cursor: "pointer" },
  filterChipActive: { background: "#7C6FF7", border: "1px solid #7C6FF7", color: "#fff" },
  resultCount: { color: "#666", fontSize: 13, margin: "0 0 16px" },
  empty: { textAlign: "center", color: "#666", padding: "48px 0", lineHeight: 2, fontSize: 15 },
  createForm: { background: "#16161d", border: "1px solid #2a2a35", borderRadius: 20, padding: 24 },
  label: { display: "block", fontSize: 13, color: "#aaa", marginBottom: 6, fontWeight: 600 },
  input: { width: "100%", background: "#0f0f13", border: "1px solid #2a2a35", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, marginBottom: 16, boxSizing: "border-box" },
  successBox: { background: "#16161d", border: "1px solid #2a2a35", borderRadius: 20, padding: 48, textAlign: "center" },
  backBtn: { background: "none", border: "none", color: "#7C6FF7", cursor: "pointer", fontSize: 14, fontWeight: 600, marginBottom: 16, padding: 0 },
  detailCard: { background: "#16161d", border: "1px solid #2a2a35", borderRadius: 20, padding: 24 },
  detailTitle: { fontSize: 24, fontWeight: 800, margin: "8px 0 10px", lineHeight: 1.2 },
  detailMeta: { display: "flex", gap: 12, flexWrap: "wrap", color: "#888", fontSize: 13 },
  detailStats: { display: "flex", gap: 16, margin: "16px 0", color: "#aaa", fontSize: 14 },
  detailDesc: { color: "#ccc", lineHeight: 1.7, fontSize: 15, margin: "0 0 20px" },
  spotsTitle: { fontSize: 16, fontWeight: 700, margin: "0 0 12px" },
  spotsList: { display: "flex", flexDirection: "column", gap: 8 },
  spotItem: { display: "flex", alignItems: "center", gap: 12, background: "#0f0f13", borderRadius: 10, padding: "10px 14px" },
  spotNum: { background: "#7C6FF7", color: "#fff", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 },
  saveBtn: { background: "#1e1e2e", border: "none", borderRadius: 10, padding: "8px 10px", cursor: "pointer", fontSize: 20 },
  profileHeader: { textAlign: "center", padding: "24px 0" },
  avatar: { width: 80, height: 80, background: "#7C6FF7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto" },
  bottomNav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "#16161d", borderTop: "1px solid #2a2a35", display: "flex", zIndex: 100 },
  bottomNavBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 0", background: "none", border: "none", color: "#555", cursor: "pointer" },
  bottomNavActive: { color: "#7C6FF7" },
  toast: { position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "#2a2a40", color: "#fff", padding: "10px 20px", borderRadius: 20, fontSize: 13, zIndex: 200, whiteSpace: "nowrap" },
};
