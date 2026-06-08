#!/usr/bin/env python3
"""
Generate place descriptions using Groq AI (llama-3.3-70b-versatile).
Free tier, no credit card required. Sign up at console.groq.com.
~925 places well within free daily limits (14,400 req/day).

Requires: GROQ_API_KEY secret in GitHub Actions.
"""

import argparse
import base64
import json
import os
import re
import sys
import time

import requests

GROQ_KEY = os.environ.get("GROQ_API_KEY", "")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GITHUB_REPO = os.environ.get("GITHUB_REPOSITORY", "roozeeyan/locallens")
DESC_FILE = "src/descriptions.json"
DATA_FILE = "src/data.js"

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
    "Фудмаркеты":            "фуд-маркет или фуд-корт",
    "Достопримечательности": "достопримечательность или туристическое место",
    "Исторические места":    "историческое место",
    "Храмы":                 "храм или религиозное место",
    "Архитектура":           "архитектурный объект",
    "Музеи и галереи":       "музей или галерея",
    "Смотровые точки":       "смотровая точка",
    "Природа":               "природное место",
    "Пляжи":                 "пляж или прибрежное место",
    "Велнес и spa":          "велнес-студия, йога или spa",
    "Жильё":                 "отель или место для проживания",
    "Шопинг":                "магазин или шопинг",
    "Медицина":              "медицинский центр или клиника",
    "Коворкинг":             "коворкинг или рабочее пространство",
}


def groq_describe(name: str, category: str, city_id: str, travel_around: bool = False) -> str:
    """Call Groq Llama to generate a place description. Returns '' on failure."""
    city = CITY_RU.get(city_id, city_id)
    cat_hint = CATEGORY_HINTS.get(category, category)

    if travel_around:
        # Place is OUTSIDE the city — don't claim it's "в центре города"
        country = city.split(",")[-1].strip()
        location_ctx = f"за пределами города, в {country}"
        prompt = (
            f'Напиши описание места "{name}" — это {cat_hint}, находится {location_ctx}.\n'
            "1–2 предложения. Опиши природу, атмосферу, маршрут или что там можно делать.\n"
            "НЕ пиши что место находится в городе или в центре города.\n"
            "Будь конкретным и живым, без шаблонных фраз. Не начинай с названия места.\n"
            "Ответ: только текст описания, без кавычек и пояснений."
        )
    else:
        prompt = (
            f'Напиши описание места "{name}" — это {cat_hint} в городе {city}.\n'
            "1–2 предложения. Описывай атмосферу, концепцию или чем оно примечательно.\n"
            "Будь конкретным и живым. НЕ начинай с шаблонных фраз вроде 'В сердце', 'В центре', 'Расположен'.\n"
            "Не начинай с названия места.\n"
            "Ответ: только текст описания, без кавычек и пояснений."
        )

    for attempt in range(3):
        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_KEY}",
                    "Content-Type": "application/json",
                },
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
                print(f"  Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            text = resp.json()["choices"][0]["message"]["content"].strip()
            text = re.sub(r'^[""«]+|[""»]+$', "", text).strip()
            return text
        except Exception as e:
            print(f"  Groq error (attempt {attempt+1}): {e}", file=sys.stderr)
            time.sleep(3)

    return “”


def extract_places(js_content: str) -> list:
    """Extract (id, cityId, category, name, has_hardcoded_desc, travel_around) from data.js."""
    pattern = re.compile(
        r'\{\s*id:\s*(\d+),\s*cityId:\s*"([^"]+)",\s*category:\s*"([^"]+)"'
        r'.*?name:\s*["`]([^"`\n]+)["`]'
        r'(.*?)(?=\{|$)',
        re.DOTALL,
    )
    desc_pat      = re.compile(r'description:\s*["`]([^"`]{10,})["`]')
    travel_pat    = re.compile(r'travelAround:\s*true')
    results = []
    for m in pattern.finditer(js_content):
        block        = m.group(5)
        has_desc     = bool(desc_pat.search(block))
        travel_around = bool(travel_pat.search(block))
        results.append((m.group(1), m.group(2), m.group(3), m.group(4), has_desc, travel_around))
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
    message = f"Generate AI descriptions for {filled} places ({label})"

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


def is_english(text: str) -> bool:
    """Returns True if text is predominantly Latin (English) rather than Cyrillic (Russian)."""
    if not text or len(text) < 20:
        return False
    alpha = [c for c in text if c.isalpha()]
    if not alpha:
        return False
    latin    = sum(1 for c in alpha if ord(c) < 0x0400)
    cyrillic = sum(1 for c in alpha if 0x0400 <= ord(c) <= 0x04FF)
    return latin > cyrillic


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--city",         type=str, default="")
    parser.add_argument("--batch",        type=int, default=9999)
    parser.add_argument("--skip",         type=str, default="")
    parser.add_argument("--overwrite",    action="store_true",
                        help="Regenerate even if description already exists")
    parser.add_argument("--fix-language", action="store_true",
                        help="Regenerate only descriptions that are in English instead of Russian")
    parser.add_argument("--fix-template", action="store_true",
                        help="Regenerate descriptions that start with cliche phrases like 'В сердце', 'В центре'")
    args = parser.parse_args()

    if not GROQ_KEY:
        print("ERROR: GROQ_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    skip_ids = {s.strip() for s in args.skip.split(",") if s.strip()}

    desc_db = {}
    if os.path.exists(DESC_FILE):
        with open(DESC_FILE, encoding="utf-8") as f:
            desc_db = json.load(f)
        print(f"Loaded descriptions.json: {len(desc_db)} existing entries")

    with open(DATA_FILE, encoding="utf-8") as f:
        js = f.read()

    places = extract_places(js)
    if args.city:
        places = [p for p in places if p[1] == args.city]
    print(f"Places: {len(places)} ({'city=' + args.city if args.city else 'all cities'})")

    processed = skipped = 0

    for pid, city_id, category, name, has_hardcoded, travel_around in places:
        if pid in skip_ids:
            continue
        # Skip if hardcoded description in data.js
        if has_hardcoded:
            skipped += 1
            continue
        # Skip if already has a good description in JSON
        existing = desc_db.get(pid, "")
        if args.fix_language:
            # Only process entries that are in English
            if not is_english(existing):
                skipped += 1
                continue
        elif args.fix_template:
            # Only process entries that start with cliche location openers
            low = existing.lower()
            is_template = any(low.startswith(p) for p in (
                "в сердце", "в центре", "в самом сердце", "расположен ", "находится в ",
            ))
            if not is_template:
                skipped += 1
                continue
        elif not args.overwrite and existing and len(existing) > 40:
            skipped += 1
            continue
        if processed >= args.batch:
            print(f"Batch limit {args.batch} reached.")
            break

        tag = " [За городом]" if travel_around else ""
        print(f"[{pid}] {name}  ({city_id}/{category}){tag}")
        desc = groq_describe(name, category, city_id, travel_around=travel_around)
        desc_db[pid] = desc
        processed += 1

        if desc:
            print(f"    → {desc[:90]}...")
        else:
            print(f"    → (empty)")

        # Checkpoint every 50 places
        if processed % 50 == 0:
            with open(DESC_FILE, "w", encoding="utf-8") as f:
                json.dump(desc_db, f, ensure_ascii=False, indent=2)
            print(f"  Checkpoint: {processed} done")

        time.sleep(0.2)  # be gentle with API

    with open(DESC_FILE, "w", encoding="utf-8") as f:
        json.dump(desc_db, f, ensure_ascii=False, indent=2)

    filled = sum(1 for v in desc_db.values() if v)
    print(f"\nSummary: processed={processed}, skipped={skipped}")
    print(f"Total with descriptions: {filled}/{len(desc_db)}")

    if GITHUB_TOKEN and processed > 0:
        print("\nCommitting...")
        github_commit(desc_db, args.city, filled)
    elif processed == 0:
        print("Nothing new — skipping commit.")
    else:
        print("No GITHUB_TOKEN — skipping commit.")


if __name__ == "__main__":
    main()
