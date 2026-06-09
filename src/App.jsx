import { useState, useRef, useEffect } from "react";
import { CITIES, INITIAL_PLACES } from "./data.js";
import CULTURE_DATA from "./culture.json";

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
  "Арт галереи":           Icons.palette,
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

function parseMin(s) {
  const m = s && s.trim().match(/(\d+):(\d+)/);
  if (!m) return null;
  return parseInt(m[1]) * 60 + parseInt(m[2]);
}

function getOpenStatus(place) {
  const hours = place.hours;
  if (hours && typeof hours === "object") {
    const DAY = ["Su","Mo","Tu","We","Th","Fr","Sa"][new Date().getDay()];
    const entry = hours[DAY];
    if (!entry) return null;
    if (entry === "closed") return { open: false, label: "Закрыто сегодня" };
    const openMin = parseMin(entry.o);
    const closeMin = parseMin(entry.c);
    if (openMin === null || closeMin === null) return null;
    const cur = new Date().getHours() * 60 + new Date().getMinutes();
    const isOpen = closeMin > openMin
      ? cur >= openMin && cur < closeMin
      : cur >= openMin || cur < closeMin;
    if (isOpen) return { open: true,  label: `Открыто · до ${entry.c}` };
    return             { open: false, label: `Закрыто · с ${entry.o}` };
  }
  // Legacy openFrom/openTo integers
  if (!place.openFrom && !place.openTo) return null;
  const h = new Date().getHours();
  const open = place.openTo > place.openFrom
    ? h >= place.openFrom && h < place.openTo
    : h >= place.openFrom || h < place.openTo;
  if (open) return { open: true,  label: `Открыто · до ${String(place.openTo).padStart(2,"0")}:00` };
  return           { open: false, label: `Закрыто · с ${String(place.openFrom).padStart(2,"0")}:00` };
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

// ── Lightbox — vertical column, equal 20px gaps ───────────────────────────
function Lightbox({ photos, initialIdx, onClose }) {
  const stripRef = useRef(null);
  const touchData = useRef(null);
  const valid = (photos || []).filter(u => u);

  // Lock body scroll while open (prevents iOS background scroll)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    if (!stripRef.current) return;
    const el = stripRef.current.querySelector(`[data-idx="${initialIdx}"]`);
    if (el) el.scrollIntoView({ behavior: "instant", block: "center" });
  }, [initialIdx]);

  const onTouchStart = (e) => {
    touchData.current = {
      y: e.touches[0].clientY,
      scrollTop: stripRef.current?.scrollTop ?? 0,
    };
  };

  const onTouchEnd = (e) => {
    if (!touchData.current) return;
    const deltaY = e.changedTouches[0].clientY - touchData.current.y;
    const scrollMoved = Math.abs((stripRef.current?.scrollTop ?? 0) - touchData.current.scrollTop);
    touchData.current = null;
    // Sharp long swipe (>130px) that didn't scroll the strip → close
    if (Math.abs(deltaY) > 130 && scrollMoved < 40) onClose();
  };

  return (
    <div style={s.lightbox}>
      <button style={s.lightboxClose} onClick={onClose}>✕</button>
      <div
        ref={stripRef}
        style={s.filmStrip}
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {valid.map((url, i) => (
          <img
            key={i}
            data-idx={i}
            src={url}
            alt={`фото ${i + 1}`}
            style={s.filmImg}
          />
        ))}
      </div>
    </div>
  );
}

// ── Card photo carousel — 3 photos per page, broken URLs removed ──────────
function CardPhotos({ photos, name, onZoom, onToggle }) {
  const [brokenUrls, setBrokenUrls] = useState(new Set());
  const [pageIdx, setPageIdx] = useState(0);
  const trackRef = useRef(null);
  const swipeStartX = useRef(null);

  const allUrls = (photos || []).filter(u => u);
  // Remove any URL that failed to load — pages reorganize automatically
  const valid = allUrls.filter(url => !brokenUrls.has(url));

  const pages = [];
  for (let i = 0; i < valid.length; i += 3) pages.push(valid.slice(i, i + 3));

  // Clamp page index if pages shrunk after broken URLs removed
  const pg = Math.min(pageIdx, Math.max(0, pages.length - 1));

  // Sync scroll position when page or page count changes
  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.scrollLeft = pg * trackRef.current.offsetWidth;
    }
  }, [pg, pages.length]);

  const markBroken = (url) =>
    setBrokenUrls(prev => { const s = new Set(prev); s.add(url); return s; });

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

  const goPage = (e, dir) => {
    if (e) e.stopPropagation();
    const next = Math.max(0, Math.min(pages.length - 1, pg + dir));
    setPageIdx(next);
    if (trackRef.current) {
      trackRef.current.scrollLeft = next * trackRef.current.offsetWidth;
    }
  };

  const onCarouselTouchStart = (e) => {
    swipeStartX.current = e.touches[0].clientX;
  };

  const onCarouselTouchEnd = (e) => {
    if (swipeStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(dx) > 40) goPage(null, dx < 0 ? 1 : -1);
  };

  return (
    <div
      style={{ ...s.carouselOuter, touchAction: "pan-y" }}
      onTouchStart={onCarouselTouchStart}
      onTouchEnd={onCarouselTouchEnd}
    >
      <div ref={trackRef} style={s.carouselTrack}>
        {pages.map((page, pi) => (
          <div key={pi} style={s.carouselPage}>
            {page.map((url, j) => {
              const globalIdx = valid.indexOf(url);
              return (
                <div
                  key={url}
                  style={{ ...s.photoCell, background: PHOTO_BG[j % 3] }}
                  onClick={() => onZoom && onZoom(valid, globalIdx)}
                >
                  <span style={s.photoInitial}>{name[0]}</span>
                  <img
                    src={url}
                    alt={`${name} ${globalIdx + 1}`}
                    style={{ ...s.photoCellImg, background: PHOTO_BG[j % 3] }}
                    onError={() => markBroken(url)}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {pg > 0 && (
        <button style={s.arrowLeft} onClick={e => goPage(e, -1)}>&#8249;</button>
      )}
      {pg < pages.length - 1 && (
        <button style={s.arrowRight} onClick={e => goPage(e, 1)}>&#8250;</button>
      )}
      {pages.length > 1 && (
        <div style={s.cardDots}>
          {pages.map((_, i) => (
            <span key={i} style={{
              ...s.cardDot,
              background: i === pg ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
              width: i === pg ? 14 : 5,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Place Card ─────────────────────────────────────────────────────────────
function PlaceCard({ place, index, city, onSave, isSaved, distanceKm, onPhotoZoom }) {
  const [descOpen, setDescOpen] = useState(false);
  const status = getOpenStatus(place);

  const distText = distanceKm !== null ? formatDist(distanceKm) : null;

  return (
    <div style={s.placeCard}>
      {/* ── Info block ── */}
      <div style={s.placeInfo}>

        <div style={s.placeTop}>
          <span style={s.placeIdx}>{String(index + 1).padStart(2, "0")}</span>
          <span style={s.placeName}>{place.name}</span>
          <button style={{ ...s.saveBtn, color: isSaved ? "#3D2B1F" : "#C5BEB7" }}
            onClick={e => { e.stopPropagation(); onSave(); }}>
            {isSaved ? Icons.bookmarkFilled : Icons.bookmarkEmpty}
          </button>
        </div>

        {/* Meta row: badge · distance · district */}
        <div style={s.placeMeta}>
          {place.badge && <span style={s.badge}>{place.badge}</span>}
          {place.district && <span style={s.area}>{place.district}</span>}
          {distText && (
            <span style={s.distPill}>
              {Icons.locate}&nbsp;{distText}
            </span>
          )}
        </div>

        {place.tags && <div style={s.tags}>{place.tags}</div>}

        {/* Open/closed status */}
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

      {/* ── Description (expandable — click anywhere in block) ── */}
      {place.description ? (
        <div
          style={{ ...s.descSection, cursor: "pointer" }}
          onClick={e => { e.stopPropagation(); setDescOpen(v => !v); }}
        >
          <p style={descOpen
            ? { fontSize: 13, color: "#5A5048", lineHeight: 1.7, margin: "0 0 4px" }
            : { ...s.descText, WebkitLineClamp: 3 }}>
            {place.description}
          </p>
          <button style={s.descToggle}>
            {descOpen ? "свернуть ↑" : "читать далее ↓"}
          </button>
        </div>
      ) : null}

      {/* ── Photo carousel (tap to open lightbox) ── */}
      <CardPhotos
        photos={place.photos}
        name={place.name}
        onZoom={(validPhotos, idx) => onPhotoZoom({ photos: validPhotos, idx })}
      />

      {/* ── Map links — always visible, small grid ── */}
      <div style={s.mapLinksRow}>
        <a href={place.mapsUrl || gMapsUrl(place.name, city?.name)}
           target="_blank" rel="noreferrer" style={s.mapLinkSmall}>
          Google Maps ↗
        </a>
        <a href={yMapsUrl(place.name, city?.name)}
           target="_blank" rel="noreferrer" style={s.mapLinkSmall}>
          Яндекс Карты ↗
        </a>
      </div>
    </div>
  );
}

// ── Culture Modal — Stories layout ───────────────────────────────────────────
function CultureModal({ cityId, onClose }) {
  const data = CULTURE_DATA[cityId];
  const [idx, setIdx] = useState(0);
  const touchX = useRef(null);
  const thumbRef = useRef(null);

  if (!data || !data.facts || data.facts.length === 0) return null;
  const facts = data.facts;
  const fact = facts[idx];

  const goTo = (i) => {
    setIdx(i);
    if (thumbRef.current) {
      const btn = thumbRef.current.children[i];
      if (btn) btn.scrollIntoView({ inline: "center", behavior: "smooth" });
    }
  };
  const prev = () => goTo(Math.max(0, idx - 1));
  const next = () => goTo(Math.min(facts.length - 1, idx + 1));

  const onTouchStart = e => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = e => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (dx < -50) next();
    else if (dx > 50) prev();
    touchX.current = null;
  };

  const onTap = e => {
    const x = e.clientX;
    const half = window.innerWidth / 2;
    if (x < half) prev(); else next();
  };

  return (
    <div style={s.cultureOverlay}>
      {/* Story card — tappable left/right to navigate */}
      <div style={s.storyCard} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onClick={onTap}>

        {/* Progress bars */}
        <div style={s.storyBars}>
          {facts.map((_, i) => (
            <div key={i} style={s.storyBarBg}>
              <div style={{ ...s.storyBarFill, width: i <= idx ? "100%" : "0%" }} />
            </div>
          ))}
        </div>

        {/* Top row: label + close */}
        <div style={s.storyTopRow}>
          <span style={s.storyLabel}>{data.headline}</span>
          <button style={s.storyClose} onClick={e => { e.stopPropagation(); onClose(); }}>✕</button>
        </div>

        {/* Photos — 2 рядом если оба есть, 1 на всю ширину если один */}
        {(fact.personImg || fact.inventionImg) ? (
          <div style={{
            ...s.storyPhotoGrid,
            gridTemplateColumns: (fact.personImg && fact.inventionImg) ? "1fr 1fr" : "1fr",
          }}>
            {fact.personImg && (
              <img src={fact.personImg} alt={fact.person} style={s.storyPhotoImg}
                onError={e => { e.target.style.display = "none"; }} />
            )}
            {fact.inventionImg && (
              <img src={fact.inventionImg} alt={fact.invention} style={s.storyPhotoImg}
                onError={e => { e.target.style.display = "none"; }} />
            )}
          </div>
        ) : (
          <div style={s.storyPhotoPlaceholder} />
        )}

        {/* Text content */}
        <div style={s.storyContent}>
          <p style={s.storyYearLoc}>{fact.year} · {fact.location}</p>
          <h2 style={s.storyInvention}>{fact.invention}</h2>
          <p style={s.storyPerson}>{fact.person}</p>
          <p style={s.storyText}>{fact.text}</p>
        </div>
      </div>

      {/* Bottom thumbnail carousel */}
      <div style={s.storyThumbs} ref={thumbRef}>
        {facts.map((f, i) => (
          <button key={i} onClick={e => { e.stopPropagation(); goTo(i); }}
            style={{ ...s.storyThumb, outline: i === idx ? "2px solid #F5F0EA" : "2px solid transparent" }}>
            {f.personImg
              ? <img src={f.personImg} alt={f.invention} style={s.storyThumbImg}
                  onError={e => { e.target.style.display = "none"; }} />
              : <span style={s.storyThumbLetter}>{f.invention[0]}</span>
            }
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Onboarding ─────────────────────────────────────────────────────────────
const ONBOARDING_KEY = "ll_onboarded_v1";

const OB_KF = `
  @keyframes ob-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
  @keyframes ob-walkL{0%,100%{transform:rotate(0deg)}35%{transform:rotate(26deg)}70%{transform:rotate(-20deg)}}
  @keyframes ob-walkR{0%,100%{transform:rotate(0deg)}35%{transform:rotate(-26deg)}70%{transform:rotate(20deg)}}
  @keyframes ob-armWave{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(52deg)}}
  @keyframes ob-blink{0%,88%,100%{transform:scaleY(1)}92%{transform:scaleY(0.06)}}
  @keyframes ob-pulse{0%{transform:scale(1);opacity:0.7}100%{transform:scale(3.2);opacity:0}}
  @keyframes ob-fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
  @keyframes ob-cityPop{0%{transform:scale(0)}65%{transform:scale(1.3)}100%{transform:scale(1)}}
  @keyframes ob-planePath{0%{opacity:0;transform:translateX(-30px)}100%{opacity:1;transform:translateX(0)}}
`;

// City positions on SVG 375×220 canvas
const OB_CITIES = [
  { name: "Ереван",   x: 64,  y: 148 },
  { name: "Бангкок",  x: 291, y: 130 },
  { name: "Дананг",   x: 304, y: 118 },
  { name: "Хой Ан",   x: 310, y: 125 },
  { name: "Пхаган",   x: 297, y: 140 },
  { name: "Самуи",    x: 303, y: 147 },
  { name: "Сингапур", x: 308, y: 158 },
  { name: "Бали",     x: 321, y: 164 },
];

// Character anchor points per slide (feet position)
const OB_CHAR_POS = [
  { x: 64,  y: 148, waving: true,  walking: false },
  { x: 178, y: 140, waving: false, walking: true  },
  { x: 305, y: 147, waving: true,  walking: false },
];

const OB_SLIDES = [
  {
    title: "Привет!\nЯ — Roo",
    text: "Это мой личный гид — только места, где я сама побывала",
    activeCities: [0],
  },
  {
    title: "8 городов,\n925 мест",
    text: "Кафе, рестораны, природа — фильтры, геолокация и режим работы",
    activeCities: [0, 1, 2, 3],
  },
  {
    title: "Готова\nисследовать?",
    text: "Плюс культурные факты перед каждой поездкой — факты, которые удивят",
    activeCities: [0, 1, 2, 3, 4, 5, 6, 7],
  },
];

// SVG character: girl with long medium-brown hair, big eyes, centered at (0,0) feet at +5
function ObCharacter({ waving, walking }) {
  const legL = { transformBox: "fill-box", transformOrigin: "50% 0%", animation: walking ? "ob-walkL 0.55s ease-in-out infinite" : "none" };
  const legR = { transformBox: "fill-box", transformOrigin: "50% 0%", animation: walking ? "ob-walkR 0.55s ease-in-out infinite" : "none" };
  const armLStyle = { transformBox: "fill-box", transformOrigin: "100% 50%", animation: walking ? "ob-walkR 0.55s ease-in-out infinite" : "none" };
  const armRStyle = { transformBox: "fill-box", transformOrigin: "0% 50%", animation: waving ? "ob-armWave 0.7s ease-in-out infinite" : (walking ? "ob-walkL 0.55s ease-in-out infinite" : "none") };
  const eyeL = { transformBox: "fill-box", transformOrigin: "50% 50%", animation: "ob-blink 3.8s 0.5s ease-in-out infinite" };
  const eyeR = { transformBox: "fill-box", transformOrigin: "50% 50%", animation: "ob-blink 3.8s 0.5s ease-in-out infinite" };

  return (
    <g style={{ animation: "ob-float 3s ease-in-out infinite" }}>
      {/* Shadow */}
      <ellipse cx="0" cy="7" rx="14" ry="3.5" fill="#2A1A10" opacity="0.12" />

      {/* Hair — long flowing behind body (medium-brown) */}
      <path d="M-8,-57 C-15,-38 -17,-8 -15,18" stroke="#8C5E34" strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M8,-57 C15,-38 17,-8 15,18" stroke="#8C5E34" strokeWidth="12" strokeLinecap="round" fill="none" />

      {/* Body / dress */}
      <path d="M-12,-38 C-15,-18 -13,-6 -11,5 L11,5 C13,-6 15,-18 12,-38Z" fill="#C4956A" />
      {/* Belt detail */}
      <rect x="-11" y="-21" width="22" height="3" rx="1.5" fill="#9E6E3C" />

      {/* Legs */}
      <rect x="-10" y="-16" width="8" height="20" rx="4" fill="#F0C896" style={legL} />
      <rect x="2"  y="-16" width="8" height="20" rx="4" fill="#F0C896" style={legR} />
      {/* Shoes */}
      <ellipse cx="-6"  cy="6" rx="7" ry="3" fill="#2A1A10" />
      <ellipse cx="6"   cy="6" rx="7" ry="3" fill="#2A1A10" />

      {/* Arms */}
      <rect x="-24" y="-37" width="13" height="7" rx="3.5" fill="#C4956A" style={armLStyle} />
      <rect x="11"  y="-37" width="13" height="7" rx="3.5" fill="#C4956A" style={armRStyle} />

      {/* Backpack */}
      <rect x="10" y="-36" width="8" height="14" rx="2" fill="#A37848" opacity="0.65" />
      <rect x="11" y="-38" width="6" height="4" rx="1" fill="#8B6038" opacity="0.65" />

      {/* Head */}
      <circle cx="0" cy="-52" r="14" fill="#F0C896" />

      {/* Hair sides (front) */}
      <path d="M-14,-56 C-19,-46 -18,-35 -15,-26" stroke="#8C5E34" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M14,-56 C19,-46 18,-35 15,-26" stroke="#8C5E34" strokeWidth="7" strokeLinecap="round" fill="none" />

      {/* Hair top */}
      <path d="M-13,-61 Q0,-74 13,-61 Q7,-67 0,-66 Q-7,-67 -13,-61Z" fill="#8C5E34" />

      {/* Eyes — large almond */}
      <ellipse cx="-5.5" cy="-52" rx="4.2" ry="5" fill="#1B0B03" style={eyeL} />
      <ellipse cx=" 5.5" cy="-52" rx="4.2" ry="5" fill="#1B0B03" style={eyeR} />
      {/* Iris gleam */}
      <circle cx="-3.8" cy="-54" r="1.5" fill="white" />
      <circle cx=" 7.2" cy="-54" r="1.5" fill="white" />

      {/* Eyebrows — thick arched */}
      <path d="M-10,-59.5 Q-5.5,-62.5 -1,-59.5" stroke="#3A200E" strokeWidth="2.3" fill="none" strokeLinecap="round" />
      <path d="M1,-59.5 Q5.5,-62.5 10,-59.5"    stroke="#3A200E" strokeWidth="2.3" fill="none" strokeLinecap="round" />

      {/* Nose */}
      <circle cx="0" cy="-47" r="1.8" fill="#D4906A" opacity="0.4" />

      {/* Mouth */}
      {waving
        ? <path d="M-5,-43 Q0,-40 5,-43"    stroke="#B85040" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        : <path d="M-3.5,-44 Q0,-42 3.5,-44" stroke="#B85040" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      }

      {/* Cheeks */}
      <circle cx="-9" cy="-47" r="4" fill="#E06858" opacity="0.16" />
      <circle cx=" 9" cy="-47" r="4" fill="#E06858" opacity="0.16" />
    </g>
  );
}

function Onboarding({ onDone }) {
  const [idx, setIdx] = useState(0);
  const [txtKey, setTxtKey] = useState(0);
  const swipeX = useRef(null);

  const slide = OB_SLIDES[idx];
  const char  = OB_CHAR_POS[idx];
  const isLast = idx === OB_SLIDES.length - 1;

  const go = (next) => { setIdx(next); setTxtKey(k => k + 1); };

  const advance = () => {
    if (isLast) { localStorage.setItem(ONBOARDING_KEY, "1"); onDone(); }
    else go(idx + 1);
  };
  const skip = () => { localStorage.setItem(ONBOARDING_KEY, "1"); onDone(); };

  const onTouchStart = e => { swipeX.current = e.touches[0].clientX; };
  const onTouchEnd = e => {
    if (swipeX.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeX.current;
    swipeX.current = null;
    if (dx < -50 && !isLast) go(idx + 1);
    else if (dx > 50 && idx > 0) go(idx - 1);
  };

  return (
    <div style={s.obWrap} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <style>{OB_KF}</style>

      {/* ── MAP SCENE ── */}
      <div style={s.obMapBox}>
        <svg viewBox="0 0 375 220" style={{ width: "100%", height: "100%", display: "block" }}>

          {/* Grid lines (map feel) */}
          {[75, 150, 225, 300].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2="220" stroke="#DDD5CC" strokeWidth="0.5" strokeDasharray="3,7" />
          ))}
          {[55, 110, 165].map(y => (
            <line key={y} x1="0" y1={y} x2="375" y2={y} stroke="#DDD5CC" strokeWidth="0.5" strokeDasharray="3,7" />
          ))}

          {/* Landmass blobs */}
          <ellipse cx="72"  cy="135" rx="58"  ry="44"  fill="#E5DDD4" opacity="0.75" />
          <ellipse cx="48"  cy="162" rx="32"  ry="24"  fill="#E5DDD4" opacity="0.5"  />
          <ellipse cx="182" cy="152" rx="42"  ry="36"  fill="#E5DDD4" opacity="0.55" />
          <ellipse cx="178" cy="182" rx="22"  ry="26"  fill="#E5DDD4" opacity="0.4"  />
          <ellipse cx="296" cy="138" rx="48"  ry="42"  fill="#E5DDD4" opacity="0.75" />
          <ellipse cx="290" cy="176" rx="26"  ry="22"  fill="#E5DDD4" opacity="0.55" />
          <ellipse cx="336" cy="170" rx="22"  ry="13"  fill="#E5DDD4" opacity="0.6"  />
          <ellipse cx="362" cy="176" rx="13"  ry="8"   fill="#E5DDD4" opacity="0.4"  />

          {/* Route — dashed path Yerevan → SE Asia */}
          <path d="M64,148 C115,106 222,178 291,148"
            fill="none" stroke="#C4956A" strokeWidth="1.8" strokeDasharray="5,4" strokeLinecap="round" />

          {/* Airplane emoji along the path (slide 1 — mid-journey) */}
          {idx === 1 && (
            <text x="174" y="134" style={{ fontSize: 14, animation: "ob-planePath 0.5s ease" }}>✈︎</text>
          )}

          {/* City dots */}
          {OB_CITIES.map((city, i) => {
            const active = slide.activeCities.includes(i);
            return (
              <g key={city.name}>
                {active && (
                  <circle cx={city.x} cy={city.y} r="5" fill="none" stroke="#C4956A" strokeWidth="1.4"
                    style={{ transformBox: "fill-box", transformOrigin: "50% 50%", animation: "ob-pulse 2s ease-out infinite" }} />
                )}
                <circle cx={city.x} cy={city.y} r={active ? 4 : 2.5}
                  fill={active ? "#C4956A" : "#C0B8B0"}
                  style={active && i > 0 ? { transformBox: "fill-box", transformOrigin: "50% 50%", animation: "ob-cityPop 0.4s ease" } : {}} />
                {i === 0 && (
                  <text x={city.x + 7} y={city.y + 4} style={{ fontSize: 7, fill: "#8A7F78", fontFamily: "inherit" }}>
                    {city.name}
                  </text>
                )}
                {active && i === OB_CITIES.length - 1 && idx === 2 && (
                  <text x={city.x + 7} y={city.y + 4} style={{ fontSize: 7, fill: "#8A7F78", fontFamily: "inherit" }}>
                    {city.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* SE Asia label (slide 2+) */}
          {idx >= 1 && (
            <text x="297" y="110" textAnchor="middle"
              style={{ fontSize: 7, fill: "#A09890", fontFamily: "inherit", animation: "ob-fadeUp 0.5s ease" }}>
              SE Asia
            </text>
          )}

          {/* Character */}
          <g style={{
            transform: `translate(${char.x}px, ${char.y}px)`,
            transition: "transform 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}>
            <ObCharacter waving={char.waving} walking={char.walking} />
          </g>

        </svg>
      </div>

      {/* ── TEXT ── */}
      <div key={txtKey} style={s.obContent}>
        <h1 style={s.obTitle}>
          {slide.title.split("\n").map((l, i) => <span key={i}>{l}{i === 0 && <br />}</span>)}
        </h1>
        <p style={s.obText}>{slide.text}</p>
      </div>

      {/* ── PROGRESS DOTS ── */}
      <div style={s.obDots}>
        {OB_SLIDES.map((_, i) => (
          <div key={i} onClick={() => go(i)} style={{
            ...s.obDot,
            width: i === idx ? 22 : 6,
            background: i === idx ? "#3D2B1F" : "#C8C0B8",
            cursor: "pointer",
          }} />
        ))}
      </div>

      {/* ── ACTIONS ── */}
      <div style={s.obActions}>
        <button style={s.obBtn} onClick={advance}>
          {isLast ? "Начать →" : "Продолжить →"}
        </button>
        {!isLast && <button style={s.obSkip} onClick={skip}>пропустить</button>}
      </div>
    </div>
  );
}

// ── Access gate (replaces index.html prompt — works in Telegram WebApp) ────
const ACCESS_CODE = process.env.REACT_APP_ACCESS_CODE || "919526";
function AccessGate({ onUnlock }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState(false);
  const submit = () => {
    if (val === ACCESS_CODE) {
      localStorage.setItem("ll_access", ACCESS_CODE);
      onUnlock();
    } else {
      setErr(true);
      setVal("");
    }
  };
  return (
    <div style={s.gateWrap}>
      <p style={s.gateLogo}>LOCALLENS</p>
      <p style={s.gateHint}>Введи код доступа</p>
      <input
        type="password"
        inputMode="numeric"
        autoFocus
        value={val}
        onChange={e => { setVal(e.target.value); setErr(false); }}
        onKeyDown={e => e.key === "Enter" && submit()}
        placeholder="······"
        style={{ ...s.gateInput, borderColor: err ? "#C06060" : "#DED9D3" }}
      />
      {err && <p style={s.gateErr}>Неверный код</p>}
      <button style={s.gateBtn} onClick={submit}>Войти →</button>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem("ll_access") === ACCESS_CODE);
  const [onboarded, setOnboarded] = useState(() => !!localStorage.getItem(ONBOARDING_KEY));
  const [screen, setScreen]             = useState("home");
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedCat, setSelectedCat]   = useState(null);
  const [places, setPlaces]             = useState(INITIAL_PLACES);
  const [toast, setToast]               = useState(null);
  const [cultureOpen, setCultureOpen]   = useState(false);

  // Lightbox: { photos: [], idx: number }
  const [lightbox, setLightbox] = useState(null);

  // Search & filters
  const [searchQuery, setSearchQuery]       = useState("");
  const [openNowOnly, setOpenNowOnly]       = useState(false);
  const [rooOnly, setRooOnly]               = useState(false);

  // Location & filters
  const [userLoc, setUserLoc]               = useState(null);
  const [locLoading, setLocLoading]         = useState(false);
  const [locError, setLocError]             = useState(false);
  const [locAsked, setLocAsked]             = useState(false);
  const [radiusKm, setRadiusKm]             = useState(null);
  const [districtFilter, setDistrictFilter] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  // Auto-request geolocation once when the user opens any places list
  useEffect(() => {
    if (screen === "places" && !locAsked && !userLoc && !locLoading) {
      setLocAsked(true);
      requestLocation();
    }
  }, [screen]); // intentional: only re-run when screen changes

  const toggleSave = (id) => {
    const p = places.find(p => p.id === id);
    setPlaces(prev => prev.map(pl => pl.id === id ? { ...pl, saved: !pl.saved } : pl));
    showToast(p?.saved ? "Удалено из сохранённых" : "Сохранено");
  };



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

  const resetFilters = () => { setSearchQuery(""); setOpenNowOnly(false); setRooOnly(false); };

  const goCity = (city) => {
    setSelectedCity(city); setDistrictFilter(null);
    resetFilters(); setScreen("city");
  };
  const goCat = (cat) => {
    setSelectedCat(cat); setDistrictFilter(null);
    resetFilters(); setScreen("places");
  };
  const goBack = () => {
    resetFilters();
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
    .filter(p => !openNowOnly || getOpenStatus(p)?.open === true)
    .filter(p => !rooOnly || p.rooChoice === true)
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

  if (!unlocked) return <AccessGate onUnlock={() => { setUnlocked(true); }} />;
  if (!onboarded) return <Onboarding onDone={() => setOnboarded(true)} />;

  return (
    <div style={s.root}>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* ── Lightbox ── */}
      {lightbox && (
        <Lightbox
          photos={lightbox.photos}
          initialIdx={lightbox.idx}
          onClose={() => setLightbox(null)}
        />
      )}

      <header style={s.header}>
        <span style={s.logo} onClick={() => { setScreen("home"); }}>LOCALLENS</span>
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

            {/* Culture card — only shown if facts exist for this city */}
            {CULTURE_DATA[selectedCity.id]?.facts?.length > 0 && (
              <button style={s.cultureBanner} onClick={() => setCultureOpen(true)}>
                <div>
                  <p style={s.cultureBannerLabel}>культурная памятка</p>
                  <p style={s.cultureBannerTitle}>{CULTURE_DATA[selectedCity.id].headline}</p>
                  <p style={s.cultureBannerSub}>{CULTURE_DATA[selectedCity.id].facts.length} фактов для смол-тока →</p>
                </div>
                <span style={s.cultureBannerEmoji}>💡</span>
              </button>
            )}

            <div style={s.list}>
              {categoriesFor(selectedCity.id).map(cat => (
                <button key={cat} style={s.catRow} onClick={() => goCat(cat)}>
                  <span style={s.catIcon}>{cat === TRAVEL_CAT ? Icons.pin : (CATEGORY_ICONS[cat] || Icons.pin)}</span>
                  <span style={s.catName}>{cat === TRAVEL_CAT ? "За городом" : cat}</span>
                  <span style={s.catMeta}>{placesFor(selectedCity.id, cat).length}&nbsp;мест&nbsp;→</span>
                </button>
              ))}
            </div>

            {/* Culture modal */}
            {cultureOpen && (
              <CultureModal cityId={selectedCity.id} onClose={() => setCultureOpen(false)} />
            )}
          </>
        )}

        {/* ── PLACES ── */}
        {screen === "places" && selectedCity && selectedCat && (
          <>
            {/* Sticky category label — always visible while scrolling */}
            <div style={s.stickyListHeader}>
              {selectedCity.name} · {selectedCat === TRAVEL_CAT ? "За городом" : selectedCat}
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

              {/* Chips row: Open now + ROO */}
              <div style={s.chipsRow}>
                <button
                  style={openNowOnly ? s.chipActive : s.chip}
                  onClick={() => setOpenNowOnly(v => !v)}
                >
                  🟢 Открыто сейчас
                </button>
                <button
                  style={rooOnly ? s.chipActive : s.chip}
                  onClick={() => setRooOnly(v => !v)}
                >
                  ⭐ ROO выбор
                </button>
              </div>

              {/* Location status row */}
              {locLoading && (
                <p style={s.locStatusMsg}>{Icons.locate}&nbsp; Определяем расстояния...</p>
              )}
              {locError && (
                <p style={s.locErrorMsg}>
                  Геолокация недоступна —{" "}
                  <button style={s.locRetryBtn} onClick={requestLocation}>повторить</button>
                </p>
              )}
              {userLoc && <Chips options={RADIUS_OPTIONS} active={radiusKm} onSelect={setRadiusKm} />}
              {districts.length > 1 && <Chips options={districtOptions} active={districtFilter} onSelect={setDistrictFilter} />}
            </div>

            <div style={s.list}>
              {displayPlaces.length === 0 ? (
                <p style={s.empty}>
                  {openNowOnly && !rawPlaces.some(p => p.openFrom || p.openTo)
                    ? "Расписание для этой категории ещё не загружено"
                    : "Нет мест в выбранном фильтре"}
                </p>
              ) : (
                displayPlaces.map((place, i) => {
                  const live = places.find(p => p.id === place.id);
                  return (
                    <PlaceCard key={place.id} place={live} index={i} city={selectedCity}
                      onSave={() => toggleSave(place.id)}
                      isSaved={live.saved}
                      distanceKm={place.distanceKm}
                      onPhotoZoom={setLightbox} />
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
                      onSave={() => toggleSave(place.id)}
                      isSaved={live.saved}
                      distanceKm={distanceKm}
                      onPhotoZoom={setLightbox} />
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
            <button key={sc} onClick={() => { setScreen(sc); }}
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
  root: { fontFamily: "'DM Sans', -apple-system, sans-serif", background: "#F0EDE8", minHeight: "100vh", color: "#3D2B1F", paddingBottom: 72 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", background: "#F0EDE8", borderBottom: "1px solid #DED9D3", position: "sticky", top: 0, zIndex: 100 },
  logo: { fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", color: "#3D2B1F", cursor: "pointer" },
  backBtn: { background: "none", border: "none", color: "#8A7F78", cursor: "pointer", fontSize: 13, letterSpacing: "0.05em", fontFamily: "inherit" },
  main: { maxWidth: 640, margin: "0 auto", padding: "0 24px" },

  hero: { padding: "52px 0 40px", borderBottom: "1px solid #DED9D3", marginBottom: 8 },
  heroTitle: { fontSize: 52, fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.025em", margin: "20px 0 18px" },
  heroSub: { fontSize: 14, color: "#8A7F78", lineHeight: 1.65, maxWidth: 300 },
  pageHero: { padding: "36px 0 24px", borderBottom: "1px solid #DED9D3", marginBottom: 0 },
  pageTitle: { fontSize: 44, fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.025em", margin: "14px 0 0" },
  label: { fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#8A7F78", margin: 0 },
  list: { display: "flex", flexDirection: "column" },

  cityRow: { display: "flex", alignItems: "center", gap: 16, padding: "20px 0", background: "none", border: "none", borderBottom: "1px solid #DED9D3", cursor: "pointer", textAlign: "left", width: "100%", color: "#3D2B1F", fontFamily: "inherit" },
  cityEmoji: { fontSize: 26, flexShrink: 0 },
  cityInfo: { display: "flex", flexDirection: "column", gap: 3, flex: 1 },
  cityName: { fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" },
  cityCountry: { fontSize: 11, color: "#8A7F78", letterSpacing: "0.1em", textTransform: "uppercase" },
  arrow: { color: "#C5BEB7", fontSize: 18, flexShrink: 0 },
  savedBanner: { marginTop: 32, width: "100%", padding: "16px 20px", background: "#3D2B1F", color: "#F0EDE8", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" },

  catRow: { display: "flex", alignItems: "center", gap: 14, padding: "18px 0", background: "none", border: "none", borderBottom: "1px solid #DED9D3", cursor: "pointer", width: "100%", fontFamily: "inherit", color: "#3D2B1F" },
  catIcon: { flexShrink: 0, display: "flex", alignItems: "center" },
  catName: { fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", flex: 1, textAlign: "left" },
  catMeta: { fontSize: 12, color: "#8A7F78", letterSpacing: "0.05em", flexShrink: 0 },

  stickyListHeader: {
    position: "sticky",
    top: 50,
    zIndex: 90,
    background: "#F0EDE8",
    borderBottom: "1px solid #DED9D3",
    padding: "10px 0",
    marginLeft: -24,
    marginRight: -24,
    paddingLeft: 24,
    paddingRight: 24,
    fontSize: 10,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "#8A7F78",
  },

  // Filters
  filtersBlock: { padding: "14px 0 4px", borderBottom: "1px solid #DED9D3", display: "flex", flexDirection: "column", gap: 10 },
  searchWrap: { position: "relative", display: "flex", alignItems: "center" },
  searchInput: { width: "100%", padding: "10px 36px 10px 14px", border: "1px solid #DED9D3", borderRadius: 3, background: "#F0EDE8", color: "#3D2B1F", fontSize: 14, fontFamily: "'DM Sans', -apple-system, sans-serif", outline: "none", boxSizing: "border-box", letterSpacing: "0.01em" },
  searchClear: { position: "absolute", right: 10, background: "none", border: "none", color: "#8A7F78", cursor: "pointer", fontSize: 13, padding: 4, lineHeight: 1 },
  locStatusMsg: { fontSize: 11, color: "#8A7F78", margin: 0, display: "flex", alignItems: "center", gap: 4, letterSpacing: "0.02em" },
  locErrorMsg: { fontSize: 11, color: "#B07070", margin: 0, letterSpacing: "0.02em" },
  locRetryBtn: { background: "none", border: "none", color: "#B07070", cursor: "pointer", fontSize: 11, padding: 0, fontFamily: "inherit", textDecoration: "underline" },
  chipsRow: { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none", WebkitOverflowScrolling: "touch" },
  chip: { flexShrink: 0, padding: "6px 12px", border: "1px solid #DED9D3", borderRadius: 20, background: "none", color: "#8A7F78", cursor: "pointer", fontSize: 12, fontWeight: 500, letterSpacing: "0.03em", fontFamily: "inherit", whiteSpace: "nowrap" },
  chipActive: { flexShrink: 0, padding: "6px 12px", border: "1px solid #2C2520", borderRadius: 20, background: "#3D2B1F", color: "#F0EDE8", cursor: "pointer", fontSize: 12, fontWeight: 500, letterSpacing: "0.03em", fontFamily: "inherit", whiteSpace: "nowrap" },

  // Place card
  placeCard: { borderBottom: "1px solid #DED9D3" },
  placeInfo: { padding: "16px 0 12px", cursor: "pointer" },
  placeTop: { display: "flex", alignItems: "center", gap: 10, marginBottom: 7 },
  placeIdx: { fontSize: 11, color: "#C5BEB7", minWidth: 22, flexShrink: 0, fontWeight: 500, letterSpacing: "0.05em" },
  placeName: { fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", flex: 1, lineHeight: 1.2 },
  saveBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 15, flexShrink: 0, padding: "2px", fontFamily: "inherit", lineHeight: 1 },
  placeMeta: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6, paddingLeft: 32, flexWrap: "wrap" },
  badge: { fontSize: 11, fontWeight: 600, color: "#3D2B1F", letterSpacing: "0.02em" },
  area: { fontSize: 11, color: "#8A7F78", letterSpacing: "0.03em" },
  distPill: { display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#6A8A6E", letterSpacing: "0.03em" },
  tags: { fontSize: 12, color: "#6A6058", letterSpacing: "0.02em", marginBottom: 6, paddingLeft: 32, lineHeight: 1.4 },
  statusRow: { display: "flex", alignItems: "center", gap: 5, paddingLeft: 32, marginBottom: 10 },
  dot: { width: 6, height: 6, borderRadius: "50%", flexShrink: 0 },
  scheduleText: { fontSize: 11, color: "#8A7F78", letterSpacing: "0.03em" },

  // Photo strip — placeholder (no photos)
  photoStrip: { display: "flex", gap: 2, marginLeft: -24, width: "calc(100% + 48px)", height: 110, cursor: "pointer" },
  photoCell: { flex: 1, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "zoom-in" },
  photoInitial: { fontSize: 24, fontWeight: 800, color: "#B8B2A8" },
  photoCellImg: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },

  // Card photo carousel — 3 photos per page
  carouselOuter: {
    position: "relative",
    marginLeft: -24,
    width: "calc(100% + 48px)",
    height: 110,
  },
  carouselTrack: {
    display: "flex",
    overflowX: "hidden",
    height: "100%",
  },
  carouselPage: {
    minWidth: "100%",
    flexShrink: 0,
    display: "flex",
    height: "100%",
    gap: 2,
  },
  arrowLeft: {
    position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.85)", border: "none", borderRadius: "50%",
    width: 32, height: 32, fontSize: 24, lineHeight: 1, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#3D2B1F", zIndex: 2, fontFamily: "inherit", boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
  },
  arrowRight: {
    position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.85)", border: "none", borderRadius: "50%",
    width: 32, height: 32, fontSize: 24, lineHeight: 1, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#3D2B1F", zIndex: 2, fontFamily: "inherit", boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
  },
  cardDots: {
    position: "absolute", bottom: 5, left: 0, right: 0,
    display: "flex", justifyContent: "center", gap: 4, pointerEvents: "none",
  },
  cardDot: { height: 4, borderRadius: 2, transition: "width 0.2s, background 0.2s" },

  // Description section
  descSection: { padding: "0 0 10px", borderBottom: "none" },
  descText: {
    fontSize: 13, color: "#5A5048", lineHeight: 1.7, margin: "0 0 4px",
    display: "-webkit-box", WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  descToggle: { background: "none", border: "none", color: "#8A7F78", fontSize: 11, letterSpacing: "0.08em", cursor: "pointer", fontFamily: "inherit", padding: "2px 0" },

  // Lightbox — vertical column, 20px equal gaps
  lightbox: {
    position: "fixed", inset: 0, zIndex: 999,
    background: "rgba(30,24,20,0.88)",
  },
  lightboxClose: {
    position: "fixed", top: 16, right: 16, zIndex: 1001,
    background: "rgba(20,14,10,0.75)",
    border: "1.5px solid rgba(255,255,255,0.3)",
    color: "white",
    width: 38, height: 38, borderRadius: "50%", fontSize: 17, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "inherit", lineHeight: 1,
    boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
  },
  filmStrip: {
    position: "fixed", inset: 0, zIndex: 1000,
    overflowY: "auto",
    overscrollBehavior: "contain",
    scrollbarWidth: "none",
    WebkitOverflowScrolling: "touch",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    padding: "60px 0 20px",
    boxSizing: "border-box",
    cursor: "default",
  },
  filmImg: {
    width: "100%",
    height: "auto",
    display: "block",
    flexShrink: 0,
    cursor: "default",
  },

  // Map links — always visible below photo strip
  mapLinksRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "8px 0 14px" },
  mapLinkSmall: { textAlign: "center", fontSize: 11, color: "#8A7F78", letterSpacing: "0.04em", textDecoration: "none", border: "1px solid #DED9D3", borderRadius: 2, padding: "6px 0", display: "block", fontWeight: 500 },

  bottomNav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "#F0EDE8", borderTop: "1px solid #DED9D3", display: "flex", zIndex: 100 },
  navBtn: { flex: 1, padding: "16px 0", background: "none", border: "none", color: "#8A7F78", cursor: "pointer", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "inherit" },
  navActive: { color: "#3D2B1F" },
  toast: { position: "fixed", bottom: 88, left: "50%", transform: "translateX(-50%)", background: "#3D2B1F", color: "#F0EDE8", padding: "10px 22px", borderRadius: 3, fontSize: 12, fontWeight: 500, letterSpacing: "0.08em", zIndex: 200, whiteSpace: "nowrap" },
  empty: { textAlign: "center", color: "#8A7F78", padding: "64px 0", fontSize: 14, lineHeight: 1.7 },

  // Onboarding
  obWrap: {
    display: "flex", flexDirection: "column", minHeight: "100vh",
    background: "#F0EDE8", boxSizing: "border-box", overflow: "hidden",
  },
  obMapBox: {
    width: "100%", height: 240, flexShrink: 0, background: "#F5F1EC",
    borderBottom: "1px solid #E8E0D8",
  },
  obContent: {
    flex: 1, padding: "28px 32px 16px", animation: "ob-fadeUp 0.45s ease",
  },
  obTitle: {
    fontSize: 46, fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.03em",
    color: "#3D2B1F", margin: "0 0 16px",
  },
  obText: {
    fontSize: 15, lineHeight: 1.65, color: "#8A7F78", margin: 0,
  },
  obDots: {
    display: "flex", gap: 6, alignItems: "center", padding: "0 32px 20px",
  },
  obDot: {
    height: 6, borderRadius: 3, transition: "width 0.3s ease, background 0.3s ease",
  },
  obActions: {
    display: "flex", flexDirection: "column", gap: 10, padding: "0 32px 40px",
  },
  obBtn: {
    width: "100%", padding: "16px 0", background: "#3D2B1F", color: "#F0EDE8",
    border: "none", borderRadius: 4, fontSize: 15, fontWeight: 600,
    letterSpacing: "0.06em", cursor: "pointer", fontFamily: "inherit",
  },
  obSkip: {
    background: "none", border: "none", color: "#B5ADA5", fontSize: 13,
    cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em",
    padding: "4px 0", alignSelf: "center",
  },

  // Access gate
  gateWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F0EDE8", padding: 32, gap: 16 },
  gateLogo: { fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", color: "#3D2B1F", marginBottom: 24 },
  gateHint: { fontSize: 14, color: "#8A7F78", letterSpacing: "0.04em", marginBottom: 8 },
  gateInput: { width: "100%", maxWidth: 260, textAlign: "center", padding: "14px 16px", border: "1px solid #DED9D3", borderRadius: 3, background: "#F0EDE8", color: "#3D2B1F", fontSize: 22, letterSpacing: "0.3em", fontFamily: "'DM Sans', sans-serif", outline: "none" },
  gateErr: { fontSize: 12, color: "#C06060", letterSpacing: "0.04em" },
  gateBtn: { marginTop: 8, padding: "12px 32px", background: "#3D2B1F", color: "#F0EDE8", border: "none", borderRadius: 3, fontSize: 13, fontWeight: 600, letterSpacing: "0.12em", cursor: "pointer", fontFamily: "inherit" },

  // Culture banner (city screen entry point)
  cultureBanner: { display: "flex", alignItems: "center", justifyContent: "space-between", margin: "16px 0 8px", padding: "18px 20px", background: "linear-gradient(135deg, #2C1800 0%, #3D2410 100%)", borderRadius: 12, border: "none", cursor: "pointer", textAlign: "left", width: "100%", boxSizing: "border-box" },
  cultureBannerLabel: { fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "#C4956A", textTransform: "uppercase", marginBottom: 5 },
  cultureBannerTitle: { fontSize: 17, fontWeight: 700, color: "#F5EEE4", letterSpacing: "-0.02em", marginBottom: 3 },
  cultureBannerSub: { fontSize: 12, color: "#9A7D60", letterSpacing: "0.02em" },
  cultureBannerEmoji: { fontSize: 26, marginLeft: 16, flexShrink: 0, opacity: 0.9 },

  // Culture modal overlay
  cultureOverlay: { position: "fixed", inset: 0, background: "#0A0806", zIndex: 300, display: "flex", flexDirection: "column", overflow: "hidden" },
  cultureModal: { display: "flex", flexDirection: "column", minHeight: "100%", padding: "20px 24px 40px" },

  // Culture header
  cultureHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 },
  cultureTag: { fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "#6A5F55", textTransform: "uppercase" },
  cultureClose: { background: "none", border: "none", color: "#6A5F55", fontSize: 18, cursor: "pointer", padding: 4 },

  // Culture card content
  cultureCard: { flex: 1, display: "flex", flexDirection: "column" },
  cultureInvention: { fontSize: 34, fontWeight: 800, color: "#F5F0EA", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 8 },
  culturePerson: { fontSize: 18, fontStyle: "italic", color: "#C4A882", marginBottom: 12, fontWeight: 400 },
  culturePhotos: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 },
  culturePhoto: { width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 4, filter: "grayscale(30%)" },
  cultureYearLoc: { fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", color: "#6A5F55", textTransform: "uppercase", marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #2A2420" },
  cultureText: { fontSize: 15, lineHeight: 1.75, color: "#C8BEB4", flex: 1 },

  // Culture navigation
  cultureDots: { display: "flex", justifyContent: "center", gap: 6, marginTop: 32, marginBottom: 16 },
  cultureDot: { width: 6, height: 6, borderRadius: "50%", background: "#F5F0EA", border: "none", cursor: "pointer", padding: 0 },
  cultureNav: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cultureNavBtn: { background: "none", border: "1px solid #3A3028", color: "#F5F0EA", fontSize: 18, cursor: "pointer", padding: "10px 20px", borderRadius: 3, fontFamily: "inherit" },
  cultureNavCount: { fontSize: 12, color: "#6A5F55", letterSpacing: "0.1em" },

  // Stories layout — всё помещается на один экран без скролла
  storyCard: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    cursor: "pointer",
    userSelect: "none",
    overflow: "hidden",
  },
  storyBars: {
    display: "flex",
    gap: 4,
    padding: "14px 16px 6px",
    flexShrink: 0,
  },
  storyBarBg: {
    flex: 1,
    height: 2,
    background: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  storyBarFill: {
    height: "100%",
    background: "rgba(255,255,255,0.9)",
    borderRadius: 2,
  },
  storyTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 16px 10px",
    flexShrink: 0,
  },
  storyLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#F5F0EA",
    letterSpacing: "-0.01em",
  },
  storyClose: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.6)",
    fontSize: 20,
    cursor: "pointer",
    padding: "4px 6px",
    lineHeight: 1,
    fontFamily: "inherit",
  },
  // фиксированная высота — не растягивается на iPad
  storyPhotoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    padding: "0 16px",
    marginBottom: 14,
    flexShrink: 0,
    height: 160,
  },
  storyPhotoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: 10,
    filter: "grayscale(15%)",
    display: "block",
  },
  storyPhotoPlaceholder: {
    height: 0,
    flexShrink: 0,
  },
  storyContent: {
    padding: "0 20px 12px",
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  storyYearLoc: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.12em",
    color: "#7A6F65",
    textTransform: "uppercase",
    margin: "0 0 8px",
    flexShrink: 0,
  },
  storyInvention: {
    fontSize: 26,
    fontWeight: 800,
    color: "#F5F0EA",
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
    margin: "0 0 6px",
    flexShrink: 0,
  },
  storyPerson: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#C4A882",
    margin: "0 0 10px",
    fontWeight: 400,
    flexShrink: 0,
  },
  storyText: {
    fontSize: 13,
    lineHeight: 1.65,
    color: "#C8BEB4",
    margin: 0,
    overflow: "hidden",
    flex: 1,
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 6,
  },
  storyThumbs: {
    display: "flex",
    gap: 8,
    padding: "10px 16px 20px",
    overflowX: "auto",
    scrollbarWidth: "none",
    WebkitOverflowScrolling: "touch",
    background: "rgba(0,0,0,0.4)",
    flexShrink: 0,
  },
  storyThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: "hidden",
    flexShrink: 0,
    background: "#2A2420",
    border: "none",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    outlineOffset: 2,
  },
  storyThumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  storyThumbLetter: {
    fontSize: 18,
    fontWeight: 800,
    color: "#6A5F55",
  },
};
