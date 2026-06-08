#!/usr/bin/env python3
"""
Fetch real place descriptions from Foursquare Places API v3.

For each place:
  1. Search by name + city → get fsq_id
  2. Use place description if available
  3. Otherwise fetch top tips (user reviews) → feed to Groq AI → Russian summary
  4. Commit updated descriptions.json to repo via GitHub API

Requires:
  FOURSQUARE_KEY  — Foursquare API key (developer.foursquare.com)
  GROQ_API_KEY    — for AI summarization when no description
  GITHUB_TOKEN    — for committing results
"""

import argparse
import base64
import json
import os
import re
import sys
import time

import requests

FSQ_KEY      = os.environ.get("FOURSQUARE_KEY", "")
GROQ_KEY     = os.environ.get("GROQ_API_KEY", "")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GITHUB_REPO  = os.environ.get("GITHUB_REPOSITORY", "roozeeyan/locallens")
DESC_FILE    = "src/descriptions.json"
DATA_FILE    = "src/data.js"

FSQ_SEARCH  = "https://api.foursquare.com/v3/places/search"
FSQ_DETAILS = "https://api.foursquare.com/v3/places/{fsq_id}"
FSQ_TIPS    = "https://api.foursquare.com/v3/places/{fsq_id}/tips"

CITY_EN = {
    "yerevan":   "Yerevan, Armenia",
    "bangkok":   "Bangkok, Thailand",
    "samui":     "Koh Samui, Thailand",
    "phangan":   "Koh Phangan, Thailand",
    "hoian":     "Hoi An, Vietnam",
    "bali":      "Bali, Indonesia",
    "danang":    "Da Nang, Vietnam",
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

FSQ_HEADERS = lambda: {"Authorization": FSQ_KEY, "Accept": "application/json"}


def fsq_search(name: str, city_id: str) -> str | None:
    """Search Foursquare, return fsq_id of best match."""
    city = CITY_EN.get(city_id, city_id)
    try:
        resp = requests.get(
            FSQ_SEARCH,
            headers=FSQ_HEADERS(),
            params={"query": name, "near": city, "limit": 1},
            timeout=15,
        )
        if resp.status_code == 200:
            results = resp.json().get("results", [])
            return results[0]["fsq_id"] if results else None
        print(f"  FSQ search error {resp.status_code}: {resp.text[:200]}", file=sys.stderr)
    except Exception as e:
        print(f"  FSQ search failed: {e}", file=sys.stderr)
    return None


def fsq_description(fsq_id: str) -> str:
    """Get place description field."""
    try:
        resp = requests.get(
            FSQ_DETAILS.format(fsq_id=fsq_id),
            headers=FSQ_HEADERS(),
            params={"fields": "description,rating,stats"},
            timeout=15,
        )
        if resp.status_code == 200:
            return resp.json().get("description", "")
    except Exception as e:
        print(f"  FSQ details failed: {e}", file=sys.stderr)
    return ""


def fsq_tips(fsq_id: str, limit: int = 5) -> list:
    """Get top user tips for a place."""
    try:
        resp = requests.get(
            FSQ_TIPS.format(fsq_id=fsq_id),
            headers=FSQ_HEADERS(),
            params={"limit": limit, "sort": "POPULAR"},
            timeout=15,
        )
        if resp.status_code == 200:
            return [t.get("text", "") for t in resp.json() if t.get("text")]
    except Exception as e:
        print(f"  FSQ tips failed: {e}", file=sys.stderr)
    return []


def groq_summarize(name: str, category: str, city_id: str, tips: list) -> str:
    """Write a Russian description using real user tips as context."""
    city = CITY_RU.get(city_id, city_id)
    cat = CATEGORY_HINTS.get(category, category)
    tips_text = "\n".join(f"- {t}" for t in tips[:4] if t)

    if tips_text:
        prompt = (
            f'Напиши описание места "{name}" — это {cat} в {city}.\n'
            f"Используй реальные отзывы как контекст:\n{tips_text}\n\n"
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
                json={
                    "model": "llama-3.3-70b-versatile",
                    "max_tokens": 150,
                    "temperature": 0.7,
                    "messages": [{"role": "user", "content": prompt}],
                },
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
    message = f"Enrich descriptions from Foursquare ({filled} places, {label})"

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
    parser.add_argument("--batch",     type=int, default=300,
                        help="Max places per run (default 300, free tier = 1000/day)")
    parser.add_argument("--overwrite", action="store_true",
                        help="Re-fetch even if description already exists")
    parser.add_argument("--skip",      type=str, default="",
                        help="Comma-separated place IDs to skip")
    args = parser.parse_args()

    if not FSQ_KEY:
        print("ERROR: FOURSQUARE_KEY not set", file=sys.stderr)
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

        fsq_id = fsq_search(name, city_id)
        time.sleep(0.3)

        if fsq_id:
            desc = fsq_description(fsq_id)
            time.sleep(0.2)

            if desc and len(desc) > 30:
                desc_db[pid] = desc
                enriched += 1
                print(f"  → description ({len(desc)} chars)")
            elif GROQ_KEY:
                tips = fsq_tips(fsq_id)
                time.sleep(0.2)
                summary = groq_summarize(name, category, city_id, tips)
                if summary:
                    desc_db[pid] = summary
                    enriched += 1
                    src = f"tips({len(tips)})" if tips else "groq-only"
                    print(f"  → {src}")
                else:
                    print(f"  → groq failed")
            else:
                print(f"  → no description, no Groq key")
        else:
            print(f"  → not found on Foursquare")

        processed += 1

        if processed % 20 == 0:
            with open(DESC_FILE, "w", encoding="utf-8") as f:
                json.dump(desc_db, f, ensure_ascii=False, indent=2)
            print(f"  Checkpoint: {processed} done, {enriched} enriched")

    with open(DESC_FILE, "w", encoding="utf-8") as f:
        json.dump(desc_db, f, ensure_ascii=False, indent=2)

    filled = sum(1 for v in desc_db.values() if v)
    print(f"\nSummary:")
    print(f"  Processed this run  : {processed}")
    print(f"  Enriched from FSQ   : {enriched}")
    print(f"  Skipped (existing)  : {skipped}")
    print(f"  Total with desc     : {filled} / {len(desc_db)}")

    if GITHUB_TOKEN and processed > 0:
        print("\nCommitting to repo via GitHub API...")
        github_commit(desc_db, args.city, filled)
    elif processed == 0:
        print("\nNothing new processed — skipping commit.")
    else:
        print("\nNo GITHUB_TOKEN — skipping commit.")


if __name__ == "__main__":
    main()
