#!/usr/bin/env python3
"""
Fetch descriptions from Wikipedia for landmark/attraction places.

Strategy:
  1. Search Russian Wikipedia first → get intro extract
  2. If not found → try English Wikipedia + translate via Groq AI
  3. Only processes cultural/nature categories (not cafes/restaurants)
  4. Commits updated descriptions.json to repo via GitHub API

Requires:
  GROQ_API_KEY   — for translating English Wikipedia extracts to Russian
  GITHUB_TOKEN   — for committing results
No paid API key needed — Wikipedia is free.
"""

import argparse
import base64
import json
import os
import re
import sys
import time

import requests

GROQ_KEY     = os.environ.get("GROQ_API_KEY", "")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GITHUB_REPO  = os.environ.get("GITHUB_REPOSITORY", "roozeeyan/locallens")
DESC_FILE    = "src/descriptions.json"
DATA_FILE    = "src/data.js"

WIKI_RU_SEARCH  = "https://ru.wikipedia.org/w/api.php"
WIKI_EN_SEARCH  = "https://en.wikipedia.org/w/api.php"
WIKI_RU_SUMMARY = "https://ru.wikipedia.org/api/rest_v1/page/summary/{}"
WIKI_EN_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/{}"

# Only search Wikipedia for these categories — cafes/bars/hotels have no articles
WIKI_CATEGORIES = {
    "Достопримечательности",
    "Исторические места",
    "Храмы",
    "Архитектура",
    "Музеи и галереи",
    "Арт галереи",
    "Смотровые точки",
    "Природа",
    "Пляжи",
}

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


def wiki_search_ru(name: str, city_id: str) -> str | None:
    """Search Russian Wikipedia, return page title of best match."""
    city = CITY_EN.get(city_id, "")
    query = f"{name} {city}".strip()
    try:
        resp = requests.get(
            WIKI_RU_SEARCH,
            params={"action": "query", "list": "search", "srsearch": query,
                    "srlimit": 3, "format": "json"},
            timeout=10,
            headers={"User-Agent": "LocalLensApp/1.0"},
        )
        results = resp.json().get("query", {}).get("search", [])
        return results[0]["title"] if results else None
    except Exception as e:
        print(f"  RU search error: {e}", file=sys.stderr)
        return None


def wiki_search_en(name: str, city_id: str) -> str | None:
    """Search English Wikipedia, return page title of best match."""
    city = CITY_EN.get(city_id, "")
    query = f"{name} {city}".strip()
    try:
        resp = requests.get(
            WIKI_EN_SEARCH,
            params={"action": "query", "list": "search", "srsearch": query,
                    "srlimit": 3, "format": "json"},
            timeout=10,
            headers={"User-Agent": "LocalLensApp/1.0"},
        )
        results = resp.json().get("query", {}).get("search", [])
        return results[0]["title"] if results else None
    except Exception as e:
        print(f"  EN search error: {e}", file=sys.stderr)
        return None


def wiki_extract_ru(title: str) -> str:
    """Get Russian Wikipedia intro extract for a page title."""
    try:
        resp = requests.get(
            WIKI_RU_SUMMARY.format(requests.utils.quote(title)),
            timeout=10,
            headers={"User-Agent": "LocalLensApp/1.0"},
        )
        if resp.status_code == 200:
            data = resp.json()
            extract = data.get("extract", "")
            # Take first 2 sentences
            sentences = re.split(r'(?<=[.!?])\s+', extract.strip())
            return " ".join(sentences[:2]).strip()
    except Exception as e:
        print(f"  RU extract error: {e}", file=sys.stderr)
    return ""


def wiki_extract_en(title: str) -> str:
    """Get English Wikipedia intro extract for a page title."""
    try:
        resp = requests.get(
            WIKI_EN_SUMMARY.format(requests.utils.quote(title)),
            timeout=10,
            headers={"User-Agent": "LocalLensApp/1.0"},
        )
        if resp.status_code == 200:
            data = resp.json()
            extract = data.get("extract", "")
            sentences = re.split(r'(?<=[.!?])\s+', extract.strip())
            return " ".join(sentences[:2]).strip()
    except Exception as e:
        print(f"  EN extract error: {e}", file=sys.stderr)
    return ""


def groq_translate(text: str, name: str) -> str:
    """Translate English Wikipedia extract to Russian via Groq."""
    if not GROQ_KEY or not text:
        return ""
    prompt = (
        f'Переведи на русский и сократи до 1-2 предложений это описание места "{name}":\n'
        f'"{text}"\n'
        "Убери лишние даты и цифры, оставь суть. "
        "Ответ: только текст перевода, без кавычек."
    )
    for attempt in range(3):
        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"},
                json={"model": "llama-3.3-70b-versatile", "max_tokens": 150, "temperature": 0.3,
                      "messages": [{"role": "user", "content": prompt}]},
                timeout=30,
            )
            if resp.status_code == 429:
                wait = int(resp.headers.get("retry-after", 10))
                time.sleep(wait)
                continue
            resp.raise_for_status()
            text_out = resp.json()["choices"][0]["message"]["content"].strip()
            return re.sub(r'^[""«]+|[""»]+$', "", text_out).strip()
        except Exception as e:
            print(f"  Groq error (attempt {attempt + 1}): {e}", file=sys.stderr)
            time.sleep(3)
    return ""


def is_relevant_match(place_name: str, wiki_title: str) -> bool:
    """Basic sanity check — wiki title should share words with place name."""
    name_words = set(re.sub(r'[^\w\s]', '', place_name.lower()).split())
    title_words = set(re.sub(r'[^\w\s]', '', wiki_title.lower()).split())
    # Remove common stop words
    stop = {"the", "a", "an", "of", "в", "на", "и", "по", "у", "за"}
    name_words -= stop
    title_words -= stop
    if not name_words:
        return True
    return bool(name_words & title_words)


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
    message = f"Enrich descriptions from Wikipedia ({filled} places, {label})"

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
    parser.add_argument("--batch",     type=int, default=9999)
    parser.add_argument("--overwrite", action="store_true",
                        help="Re-fetch even if description already exists")
    parser.add_argument("--skip",      type=str, default="")
    args = parser.parse_args()

    skip_ids = {s.strip() for s in args.skip.split(",") if s.strip()}

    with open(DESC_FILE, "r", encoding="utf-8") as f:
        desc_db: dict = json.load(f)
    print(f"Loaded descriptions.json: {len(desc_db)} existing entries")

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        js = f.read()
    places = extract_places(js)
    if args.city:
        places = [p for p in places if p[1] == args.city]

    wiki_places = [p for p in places if p[2] in WIKI_CATEGORIES]
    print(f"Places in wiki categories: {len(wiki_places)} (of {len(places)} total)")

    processed = 0
    enriched  = 0
    skipped   = 0

    for pid, city_id, category, name, has_hardcoded in wiki_places:
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

        print(f"[{pid}] {name}  ({city_id} / {category})")

        # Try Russian Wikipedia first
        ru_title = wiki_search_ru(name, city_id)
        time.sleep(0.3)

        if ru_title and is_relevant_match(name, ru_title):
            extract = wiki_extract_ru(ru_title)
            time.sleep(0.2)
            if extract and len(extract) > 40:
                desc_db[pid] = extract
                enriched += 1
                print(f"  → RU wiki: '{ru_title}'")
                processed += 1
                continue

        # Try English Wikipedia + translate
        en_title = wiki_search_en(name, city_id)
        time.sleep(0.3)

        if en_title and is_relevant_match(name, en_title):
            en_extract = wiki_extract_en(en_title)
            time.sleep(0.2)
            if en_extract and len(en_extract) > 40 and GROQ_KEY:
                translated = groq_translate(en_extract, name)
                if translated:
                    desc_db[pid] = translated
                    enriched += 1
                    print(f"  → EN wiki translated: '{en_title}'")
                    processed += 1
                    continue

        print(f"  → not found in Wikipedia")
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
    print(f"  Enriched from Wiki  : {enriched}")
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
