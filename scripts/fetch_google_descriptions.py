#!/usr/bin/env python3
"""
Fetch real place descriptions from Google Places API (New).

For each place:
  1. Search by name + city via Places Text Search
  2. Use editorialSummary if available
  3. Otherwise feed top reviews to Groq AI → natural Russian summary
  4. Commit updated descriptions.json to repo via GitHub API

Requires:
  GOOGLE_PLACES_KEY  — Google Maps Platform API key (Places API New enabled)
  GROQ_API_KEY       — for AI summarization when no editorial summary
  GITHUB_TOKEN       — for committing results
"""

import argparse
import base64
import json
import os
import re
import sys
import time

import requests

GOOGLE_KEY   = os.environ.get("GOOGLE_PLACES_KEY", "")
GROQ_KEY     = os.environ.get("GROQ_API_KEY", "")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GITHUB_REPO  = os.environ.get("GITHUB_REPOSITORY", "roozeeyan/locallens")
DESC_FILE    = "src/descriptions.json"
DATA_FILE    = "src/data.js"

PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
FIELD_MASK = "places.id,places.displayName,places.editorialSummary,places.reviews,places.rating,places.userRatingCount"

CITY_EN = {
    "yerevan":   "Yerevan Armenia",
    "bangkok":   "Bangkok Thailand",
    "samui":     "Koh Samui Thailand",
    "phangan":   "Koh Phangan Thailand",
    "hoian":     "Hoi An Vietnam",
    "bali":      "Bali Indonesia",
    "danang":    "Da Nang Vietnam",
    "singapore": "Singapore",
}

CITY_RU = {
    "yerevan":   "Ереван, Армения",
    "bangkok":   "Бангкок, Таиланд",
    "samui":     "Ко Самуи, Таиланд",
    "phangan":   "Ко Панган, Таиланд",
    "hoian":     "Хой Ан, Вьетнам",
    "bali":      "Бали, Индонезия",
    "danang":    "Дананг, Вьетнам",
    "singapore": "Сингапур",
}

CATEGORY_HINTS = {
    "Кафе и рестораны":      "кафе или ресторан",
    "Кофе и чай":            "кофейня",
    "Бары":                  "бар",
    "Фудмаркеты":            "фуд-маркет",
    "Достопримечательности": "достопримечательность",
    "Исторические места":    "историческое место",
    "Храмы":                 "храм",
    "Архитектура":           "архитектурный объект",
    "Музеи и галереи":       "музей или галерея",
    "Арт галереи":           "арт-галерея",
    "Смотровые точки":       "смотровая точка",
    "Природа":               "природное место",
    "Пляжи":                 "пляж",
    "Велнес и spa":          "велнес-студия или spa",
    "Жильё":                 "отель",
    "Шопинг":                "магазин",
    "Медицина":              "медицинский центр",
    "Коворкинг":             "коворкинг",
}

BANNED = (
    "НЕ используй слова: 'уютный', 'расположен', 'находится', 'в сердце', 'в центре', "
    "'идеальное место', 'настоящая находка'. "
    "Опиши конкретную деталь: атмосферу, концепцию, блюдо, фишку."
)


def google_search(name: str, city_id: str) -> dict | None:
    """Search Google Places and return the best match (first result)."""
    city = CITY_EN.get(city_id, city_id)
    query = f"{name} {city}"
    headers = {
        "X-Goog-Api-Key": GOOGLE_KEY,
        "X-Goog-FieldMask": FIELD_MASK,
        "Content-Type": "application/json",
    }
    try:
        resp = requests.post(
            PLACES_SEARCH_URL,
            headers=headers,
            json={"textQuery": query, "languageCode": "ru"},
            timeout=15,
        )
        if resp.status_code == 200:
            places = resp.json().get("places", [])
            return places[0] if places else None
        print(f"  Google error {resp.status_code}: {resp.text[:200]}", file=sys.stderr)
    except Exception as e:
        print(f"  Google request failed: {e}", file=sys.stderr)
    return None


def groq_summarize(name: str, category: str, city_id: str, reviews: list) -> str:
    """Ask Groq to write a 1-2 sentence Russian description using real reviews as context."""
    city = CITY_RU.get(city_id, city_id)
    cat = CATEGORY_HINTS.get(category, category)
    review_texts = "\n".join(
        f"- {r.get('text', {}).get('text', '')}"
        for r in reviews[:4]
        if r.get("text", {}).get("text")
    )
    if review_texts:
        prompt = (
            f'Напиши описание места "{name}" — это {cat} в {city}.\n'
            f"Используй реальные отзывы как контекст:\n{review_texts}\n\n"
            "1–2 предложения. Передай суть и атмосферу на основе отзывов.\n"
            f"{BANNED}\n"
            "Ответ: только текст описания, без кавычек и пояснений."
        )
    else:
        prompt = (
            f'Напиши описание места "{name}" — это {cat} в {city}.\n'
            "1–2 предложения. Описывай атмосферу, концепцию или чем оно примечательно.\n"
            f"{BANNED}\n"
            "Ответ: только текст описания, без кавычек и пояснений."
        )
    for attempt in range(3):
        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"},
                json={"model": "llama-3.3-70b-versatile", "max_tokens": 150, "temperature": 0.7,
                      "messages": [{"role": "user", "content": prompt}]},
                timeout=30,
            )
            if resp.status_code == 429:
                wait = int(resp.headers.get("retry-after", 10))
                print(f"  Groq rate limit, waiting {wait}s...")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            text = resp.json()["choices"][0]["message"]["content"].strip()
            return re.sub(r'^[""«]+|[""»]+$', "", text).strip()
        except Exception as e:
            print(f"  Groq error (attempt {attempt + 1}): {e}", file=sys.stderr)
            time.sleep(3)
    return ""


def extract_places(js_content: str) -> list:
    pattern = re.compile(
        r'\{\s*id:\s*(\d+),\s*cityId:\s*"([^"]+)",\s*category:\s*"([^"]+)"'
        r'.*?name:\s*["`]([^"`\n]+)["`]'
        r'(.*?)(?=\{|$)',
        re.DOTALL,
    )
    desc_pat = re.compile(r'description:\s*["`]([^"`]{10,})["`]')
    results = []
    for m in pattern.finditer(js_content):
        has_desc = bool(desc_pat.search(m.group(5)))
        results.append((m.group(1), m.group(2), m.group(3), m.group(4), has_desc))
    return results


def github_commit(desc_db: dict, city: str, filled: int) -> None:
    api = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{DESC_FILE}"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    content_b64 = base64.b64encode(
        json.dumps(desc_db, ensure_ascii=False, indent=2).encode("utf-8")
    ).decode("ascii")
    label = f"city={city}" if city else "all cities"
    message = f"Enrich descriptions from Google Places ({filled} places, {label})"

    for attempt in range(1, 4):
        resp = requests.get(api, headers=headers, timeout=30)
        sha = resp.json().get("sha", "") if resp.status_code == 200 else ""
        payload = {"message": message, "content": content_b64}
        if sha:
            payload["sha"] = sha
        put = requests.put(api, headers=headers, json=payload, timeout=90)
        if put.status_code in (200, 201):
            print(f"  descriptions.json committed. ({filled} places with descriptions)")
            return
        if put.status_code == 409 and attempt < 3:
            time.sleep(3)
            continue
        print(f"  GitHub commit failed: {put.status_code} {put.text[:400]}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--city",      type=str, default="",
                        help="Only process this cityId (empty = all)")
    parser.add_argument("--batch",     type=int, default=200,
                        help="Max new places to process per run (default 200 to stay in free tier)")
    parser.add_argument("--overwrite", action="store_true",
                        help="Re-fetch even if description already exists")
    parser.add_argument("--skip",      type=str, default="",
                        help="Comma-separated place IDs to skip")
    args = parser.parse_args()

    if not GOOGLE_KEY:
        print("ERROR: GOOGLE_PLACES_KEY not set", file=sys.stderr)
        sys.exit(1)

    skip_ids = {s.strip() for s in args.skip.split(",") if s.strip()}

    with open(DESC_FILE, "r", encoding="utf-8") as f:
        desc_db: dict = json.load(f)
    print(f"Loaded descriptions.json: {len(desc_db)} existing entries")

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        js = f.read()
    places = extract_places(js)
    if args.city:
        places = [p for p in places if p[1] == args.city]
    print(f"Places to process: {len(places)}")

    processed = 0
    enriched  = 0
    skipped   = 0

    for pid, city_id, category, name, has_hardcoded in places:
        existing = desc_db.get(pid, "")

        if has_hardcoded:
            skipped += 1
            continue
        if not args.overwrite and existing and len(existing) > 40:
            skipped += 1
            continue
        if pid in skip_ids:
            continue
        if processed >= args.batch:
            print(f"Batch limit {args.batch} reached.")
            break

        print(f"[{pid}] {name}  ({city_id})")
        result = google_search(name, city_id)
        time.sleep(0.2)

        if result:
            editorial = result.get("editorialSummary", {}).get("text", "")
            reviews   = result.get("reviews", [])
            rating    = result.get("rating")
            count     = result.get("userRatingCount", 0)

            if editorial:
                # Use Google's own description directly
                desc_db[pid] = editorial
                enriched += 1
                src = "editorial"
            elif reviews and GROQ_KEY:
                # Summarize real reviews via AI
                desc = groq_summarize(name, category, city_id, reviews)
                if desc:
                    desc_db[pid] = desc
                    enriched += 1
                    src = f"reviews({len(reviews)})"
                else:
                    src = "groq-failed"
            else:
                src = "no-content"

            rating_str = f" ★{rating} ({count})" if rating else ""
            print(f"  → {src}{rating_str}")
        else:
            print(f"  → not found on Google Maps")

        processed += 1

        if processed % 20 == 0:
            with open(DESC_FILE, "w", encoding="utf-8") as f:
                json.dump(desc_db, f, ensure_ascii=False, indent=2)
            print(f"  Checkpoint: {processed} done, {enriched} enriched")

    with open(DESC_FILE, "w", encoding="utf-8") as f:
        json.dump(desc_db, f, ensure_ascii=False, indent=2)

    filled = sum(1 for v in desc_db.values() if v)
    print(f"\nSummary:")
    print(f"  Processed this run : {processed}")
    print(f"  Enriched from Google: {enriched}")
    print(f"  Skipped (existing) : {skipped}")
    print(f"  Total with desc    : {filled} / {len(desc_db)}")

    if GITHUB_TOKEN and processed > 0:
        print("\nCommitting to repo via GitHub API...")
        github_commit(desc_db, args.city, filled)
    elif processed == 0:
        print("\nNothing new processed — skipping commit.")
    else:
        print("\nNo GITHUB_TOKEN — skipping commit.")


if __name__ == "__main__":
    main()
