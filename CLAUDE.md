# LocalLens — инструкции для Claude Code

## Общение
- Всегда отвечай **на русском языке**
- Перед первым инструментом — одно предложение что делаешь
- Короткие обновления по ходу работы
- В конце — 1–2 предложения: что изменилось и что дальше

---

## Проект

**LocalLens** — персональный travel mini-app (locallens-mocha.vercel.app).  
Личная подборка мест от Roo: кафе, рестораны, природа, достопримечательности.  
Репозиторий: `roozeeyan/locallens` · Деплой: Vercel автоматически из ветки `main`.

**Стек:** React 18.2, CRA (react-scripts 5.0.1/webpack), inline styles (объект `s` в App.jsx), без TypeScript.  
**Зависимости:** `react`, `react-dom`, `react-scripts`, `ajv` (валидация JSON).

**Автоматические фоновые задачи (GitHub Actions по расписанию):**
- Каждый день 06:00 UTC — аудит качества данных (`audit-places.yml`)
- Каждый понедельник 04:00 UTC (08:00 Ереван) — еженедельное обслуживание (`weekly-maintenance.yml`):
  1. Исправление описаний на английском → русский
  2. Перезапись шаблонных/клишированных описаний
  3. Финальный аудит качества
- При пуше в `main` с изменениями `src/data.js` — автозапуск `generate-descriptions.yml`

**Доступ защищён паролем:** код `919526` хранится в Vercel env var `REACT_APP_ACCESS_CODE`.

---

## Структура файлов

```
src/
  App.jsx           — весь UI (один файл, 1580 строк)
  data.js           — 925 мест, 8 городов (CITIES + INITIAL_PLACES, 981 строк)
  index.js          — точка входа React (7 строк)
  culture.json      — культурные факты по городам (сторис, 115 строк)
  descriptions.json — AI-описания мест {id: "текст"} (~264 записи)
  photos.json       — фотографии мест {id: ["url1","url2",...]} (3323 строки)
  coords.json       — координаты мест {id: {lat, lng}} — ПУСТОЙ ФАЙЛ
  hours.json        — часы работы мест — ПУСТОЙ ФАЙЛ

scripts/
  generate_descriptions.py          — AI-описания через Groq (llama-3.3-70b-versatile)
  fetch_photos.py                   — фото через Serper Image Search API
  fetch_culture_images.py           — фото для культурных фактов с Wikipedia
  fetch_wiki_descriptions.py        — описания достопримечательностей с Wikipedia
  fetch_descriptions.py             — общий скрипт получения описаний
  fetch_foursquare_descriptions.py  — описания через Foursquare API
  fetch_google_descriptions.py      — описания через Google Places API
  fetch_coords.py                   — координаты через Nominatim/OSM
  fetch_hours.py                    — часы работы
  audit_places.py                   — аудит качества данных

.github/workflows/
  generate-descriptions.yml         — AI-описания (Groq, auto при data.js push)
  fetch-photos.yml                  — фото через Serper
  fetch-coords.yml                  — координаты через OSM
  fetch-hours.yml                   — часы работы
  fetch-wiki-descriptions.yml       — описания с Wikipedia
  fetch-descriptions.yml            — общий fetch описаний
  fetch-foursquare-descriptions.yml — Foursquare описания
  fetch-google-descriptions.yml     — Google Places описания
  fetch-culture-images.yml          — фото для культурных фактов
  audit-places.yml                  — ежедневный аудит (06:00 UTC)
  weekly-maintenance.yml            — еженедельное обслуживание (пн 04:00 UTC)

public/
  index.html  — HTML-точка входа (46 строк)

vercel.json   — конфигурация Vercel
```

Также в корне есть ZIP-архивы Google Takeout и `Сохранено.zip` — это пользовательские данные, не трогать.

---

## Архитектура App.jsx

### Экраны (`screen` state)
| Значение | Что показывает |
|----------|---------------|
| `"home"` | Список городов + Saved |
| `"city"` | Категории выбранного города |
| `"places"` | Список мест выбранной категории |
| `"saved"` | Сохранённые места |

### Ключевые компоненты

| Компонент | Назначение |
|-----------|-----------|
| `App` | Корневой, управляет стейтом и навигацией |
| `AccessGate` | Экран ввода пароля |
| `OnboardingScreen` | Онбординг (3 слайда) с персонажем Roo |
| `RooPortrait` | SVG-аватар Roo (позы: `default`, `wave`, `excited`) |
| `CultureModal` | Истории в стиле Instagram Stories |
| `PlaceCard` | Карточка места (фото, описание, ссылки) |
| `CardPhotos` | Карусель фото в карточке (3 фото на страницу, свайп) |
| `Lightbox` | Полноэкранный просмотр фото (вертикальный скролл, свайп для закрытия) |
| `Chips` | Фильтр-чипсы (категории, районы) |

### Стейт `App`

```js
// Авторизация и онбординг
unlocked        // localStorage.getItem("ll_access") === ACCESS_CODE
onboarded       // localStorage.getItem(ONBOARDING_KEY)

// Навигация
screen          // "home" | "city" | "places" | "saved"
selectedCity    // объект города из CITIES
selectedCat     // строка категории или "__travel__"

// Данные
places          // INITIAL_PLACES + saved/toggled state
toast           // { msg } — временное уведомление 2с
cultureOpen     // bool — открыта ли CultureModal
lightbox        // { photos: [], idx: number } | null

// Поиск и фильтры
searchQuery     // строка поиска
openNowOnly     // фильтр «открыто сейчас»
rooOnly         // фильтр «выбор Roo»
districtFilter  // фильтр по району

// Геолокация
userLoc         // { lat, lng } | null
locLoading      // bool
locError        // bool
locAsked        // bool (запрашивали ли геолокацию)
radiusKm        // null | число — радиус фильтра
```

### Специальная категория `TRAVEL_CAT = "__travel__"`
Виртуальная категория для мест с `travelAround: true` — показывает однодневные поездки из города.

### Стили
Все стили — объект `s` в конце файла (~400 строк). Используются как `style={s.keyName}`. Без CSS-файлов, без CSS-модулей.

### Иконки
SVG-иконки инлайн через компонент `Icon`. Маппинг категорий → иконки в `CATEGORY_ICONS`.

---

## data.js — структура данных

### CITIES
```js
{ id: "yerevan", name: "Ереван", country: "Армения", emoji: "🇦🇲" }
```

### INITIAL_PLACES — поля места
```js
{
  id,           // число (101–...)
  cityId,       // "yerevan" | "bangkok" | "samui" | "phangan" | "hoian" | "bali" | "danang" | "singapore"
  category,     // строка (см. CATEGORY_ICONS)
  name,         // строка
  lat, lng,     // координаты (часто 40.1872, 44.5152 — placeholder для Еревана)
  mapsUrl,      // Google Maps URL
  description,  // строка (может быть пустой — тогда берётся из descriptions.json)
  badge,        // строка-ярлык (напр. "Хит", "Новинка")
  district,     // строка района
  tags,         // строка тегов
  travelAround, // bool — однодневные поездки
  rooChoice,    // bool — выбор Roo
}
```

### Мёрдж данных при инициализации
`data.js` импортирует `photos.json`, `descriptions.json`, `coords.json`, `hours.json` и мержит их в `INITIAL_PLACES`:
- `photos.json` → `place.photos = PHOTOS[id]`
- `descriptions.json` → `place.description = DESCRIPTIONS[id]` (если в data.js пусто)
- `coords.json` → `place.coords = COORDS[id]` (файл пуст!)
- `hours.json` → `place.hours = HOURS[id]` (файл пуст!)

---

## Города и данные

| Город | Мест | Описания | Фото |
|-------|------|----------|------|
| yerevan | 285 | ✅ все 263 | ✅ 284/285 |
| phangan | 203 | частично | частично |
| bali | 128 | частично | частично |
| bangkok | 117 | частично | частично |
| samui | 82 | частично | частично |
| danang | 69 | частично | частично |
| hoian | 28 | частично | частично |
| singapore | 13 | частично | частично |

**coords.json и hours.json — полностью пустые** (`{}`). Координаты в data.js — placeholder значения `40.1872, 44.5152` для большинства мест.

---

## Культурные факты (сторис)

Компонент `CultureModal` — Instagram Stories стиль:
- Прогресс-бары сверху, тап по половинам экрана для навигации
- Фото: два рядом (человек + изобретение) или одно на всю ширину
- Карусель превью снизу

### Структура `culture.json`
```json
{
  "yerevan": {
    "headline": "...",
    "subtitle": "...",
    "facts": [{
      "invention": "...",
      "person": "...",
      "year": "...",
      "location": "...",
      "text": "...",
      "personImg": "URL или ''",
      "inventionImg": "URL или ''"
    }]
  }
}
```

**Ереван:** 8 фактов про армянских изобретателей.
- Есть фото: Ованес Адамян (personImg), Рэймонд Дамадян (personImg)
- Нет фото personImg: Майкл Тер-Погосян, Лютер Симджян, Оскар Бэнкер, Артур Булбулян, Эмик Авагян, Алек Манукян
- Нет фото inventionImg: Банкомат (Симджян), Смеситель Delta (Манукян)

**Остальные города** (bangkok, samui, phangan, hoian, bali, danang, singapore): `facts: []` — нужно наполнить.

---

## Как запускать воркфлоу

GitHub → Actions → выбрать воркфлоу → **Run workflow**.

| Воркфлоу | Назначение | Ключевые параметры |
|----------|-----------|-------------------|
| `Generate AI Descriptions` | AI-описания через Groq | city, batch_size, skip_ids, overwrite, fix_language, fix_template |
| `Fetch Photos` | Фото мест через Serper | city |
| `Fetch Coords` | Координаты через OSM | city |
| `Fetch Hours` | Часы работы | city |
| `Fetch Wikipedia Descriptions` | Описания достопримечательностей | city |
| `Fetch Descriptions` | Общий fetch описаний | — |
| `Fetch Foursquare Descriptions` | Описания через Foursquare | — |
| `Fetch Google Descriptions` | Описания через Google Places | — |
| `Fetch Culture Images` | Фото для культурных фактов с Wikipedia | — |
| `Audit Places` | Ежедневный аудит качества | — |
| `Weekly Quality Maintenance` | Еженедельное обслуживание | — |

**Secrets в GitHub:** `GROQ_API_KEY`, `SERPER_API_KEY`, `FOURSQUARE_API_KEY`.  
`GITHUB_TOKEN` предоставляется Actions автоматически.

### Параметры `Generate AI Descriptions`
- `city` — конкретный город или пусто (все)
- `batch_size` — макс. мест за запуск (9999 = все)
- `skip_ids` — через запятую ID мест для пропуска
- `overwrite` — перегенерировать даже если описание есть
- `fix_language` — только переписать английские описания на русский
- `fix_template` — только переписать описания начинающиеся с клише («В сердце / В центре»)

---

## Ключевые технические решения

- `src/data.js` — единственный источник правды для списка мест, JSON-файлы только дополняют
- `descriptions.json` и `photos.json` мержатся в `INITIAL_PLACES` при инициализации (см. data.js)
- Описания от Groq: запрещены слова «уютный», «расположен», «находится», «в сердце», «в центре», «предлагает»
- Фото: фильтруются BAD_DOMAINS (социальные сети, музыкальные сервисы, wikipedia) в скриптах
- Пароль: `localStorage.setItem("ll_access", code)` — без re-enter после перезагрузки
- Онбординг: `localStorage.setItem(ONBOARDING_KEY, "1")` — показывается один раз
- Геолокация: автозапрашивается при первом открытии экрана мест, haversine-дистанция для сортировки
- Часы работы: поддерживает два формата — объект `{Mo: {o:"09:00", c:"22:00"}, ...}` и legacy `openFrom/openTo` (целые числа)

---

## Текущие задачи / бэклог

- [ ] Добавить personImg для изобретателей: Тер-Погосян, Симджян, Бэнкер, Булбулян, Авагян, Манукян
- [ ] Добавить inventionImg: Банкомат, Смеситель Delta
- [ ] Наполнить культурные факты для 7 других городов (bangkok, samui, phangan, hoian, bali, danang, singapore)
- [ ] Заполнить coords.json (сейчас пустой)
- [ ] Заполнить hours.json (сейчас пустой)
- [ ] Пофиксить фото Ruby (id=140) — пересобрать через воркфлоу
- [ ] Описания для городов кроме Еревана
- [ ] Фото и описания для Singapore (13 мест)

---

## Что НЕ делать

- Не пушить в ветки кроме `main` без явной просьбы
- Не добавлять комментарии в код без необходимости
- Не создавать документацию (MD-файлы) без просьбы
- Не добавлять фичи сверх задачи
- Перед деструктивными операциями — спрашивать подтверждение
- Не трогать ZIP-файлы в корне проекта (Google Takeout / пользовательские данные)
