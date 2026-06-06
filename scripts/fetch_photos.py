#!/usr/bin/env python3
"""
Fetch photos for all places in data.js using Serper image search API.
Saves results to src/photos.json and commits via GitHub API (no git push).
"""

import argparse
import base64
import json
import os
import re
import sys
import time

import requests

SERPER_KEY = os.environ.get("SERPER_KEY", "")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
# GITHUB_REPOSITORY is auto-set by GitHub Actions to "owner/repo"
GITHUB_REPO = os.environ.get("GITHUB_REPOSITORY", "roozeeyan/locallens")
PHOTOS_FILE = "src/photos.json"
DATA_FILE = "src/data.js"

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

FOOD_CATS = {"Кафе и рестораны", "Кофе и чай", "Бары", "Фудмаркеты"}
BUDGET = 2300  # leave 200-credit buffer from 2500 free credits


class CreditsExhausted(Exception):
    pass


def serper_images(query: str, n: int = 10) -> list:
    """One Serper image search = 1 credit. Returns up to n image URLs."""
    try:
        resp = requests.post(
            "https://google.serper.dev/images",
            headers={"X-API-KEY": SERPER_KEY, "Content-Type": "application/json"},
            json={"q": query, "num": n},
            timeout=30,
        )
        # Credits exhausted
        if resp.status_code in (401, 402, 403):
            raise CreditsExhausted(f"HTTP {resp.status_code}: {resp.text[:200]}")
        resp.raise_for_status()
        data = resp.json()
        # Serper sometimes returns 200 with an error body
        if "error" in data or data.get("statusCode", 200) >= 400:
            raise CreditsExhausted(f"Serper error body: {str(data)[:200]}")
        items = data.get("images", [])
        return [img["imageUrl"] for img in items if img.get("imageUrl")][:n]
    except CreditsExhausted:
        raise
    except Exception as e:
        print(f"    Serper error: {e}", file=sys.stderr)
        return []


def get_photos(name: str, city_id: str, category: str, max_photos: int = 10) -> list:
    """
    Fetch up to max_photos for a place.
    Food categories: 2 queries (atmosphere + food/menu) → richer mix.
    All others: 1 query.
    """
    city = CITY_EN.get(city_id, city_id)

    # Primary search (with quotes for precision, fallback without)
    primary = serper_images(f'"{name}" {city}', 10)
    if not primary:
        primary = serper_images(f"{name} {city}", 10)

    if category in FOOD_CATS:
        # Small pause between back-to-back queries to avoid rate limits
        time.sleep(0.3)
        food = serper_images(f'"{name}" {city} food menu', 10)
        if not food:
            food = serper_images(f"{name} {city} food", 10)
        half = max_photos // 2
        return (primary[:half] + food[:max_photos - half])[:max_photos]

    return primary[:max_photos]


def extract_places(js_content: str) -> list:
    """
    Extract (id, cityId, category, name) from data.js.
    Handles both backtick and double-quote name delimiters.
    """
    pattern = re.compile(
        r'\{\s*id:\s*(\d+),\s*cityId:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*name:\s*["`]([^"`\n]+)["`]'
    )
    return pattern.findall(js_content)


def github_commit(photos_db: dict, city: str, filled: int) -> None:
    """Commit photos.json to the repo via GitHub Contents API. No git needed."""
    api = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{PHOTOS_FILE}"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    content_b64 = base64.b64encode(
        json.dumps(photos_db, ensure_ascii=False, indent=2).encode("utf-8")
    ).decode("ascii")

    label = f"city={city}" if city else "all cities"
    message = f"Add photos for {filled} places ({label})"

    # Retry up to 3 times to handle rare SHA conflicts (409 Conflict)
    for attempt in range(1, 4):
        resp = requests.get(api, headers=headers, timeout=30)
        if resp.status_code == 200:
            sha = resp.json().get("sha", "")
        elif resp.status_code == 404:
            sha = ""  # file doesn't exist yet — create it
        else:
            print(f"  GET failed: {resp.status_code} {resp.text[:200]}", file=sys.stderr)
            sys.exit(1)

        payload = {"message": message, "content": content_b64}
        if sha:
            payload["sha"] = sha

        put = requests.put(api, headers=headers, json=payload, timeout=90)
        if put.status_code in (200, 201):
            print(f"  photos.json committed to repo. ({filled} places with photos)")
            return
        if put.status_code == 409 and attempt < 3:
            print(f"  SHA conflict on attempt {attempt}, retrying...")
            time.sleep(3)
            continue
        print(f"  GitHub API commit failed: {put.status_code} {put.text[:400]}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--city",       type=str, default="",
                        help="Only process this cityId, e.g. 'yerevan'")
    parser.add_argument("--max_photos", type=int, default=10,
                        help="Max photos per place (default 10)")
    parser.add_argument("--batch",      type=int, default=9999,
                        help="Stop after processing this many new places")
    parser.add_argument("--skip",       type=str, default="",
                        help="Comma-separated place IDs to skip")
    args = parser.parse_args()

    if not SERPER_KEY:
        print("ERROR: SERPER_KEY not set", file=sys.stderr)
        sys.exit(1)

    skip_ids = {s.strip() for s in args.skip.split(",") if s.strip()}

    # Load existing data (allows incremental runs)
    if os.path.exists(PHOTOS_FILE):
        with open(PHOTOS_FILE, "r", encoding="utf-8") as f:
            photos_db: dict = json.load(f)
        print(f"Loaded photos.json: {len(photos_db)} existing entries")
    else:
        photos_db = {}

    # Parse places
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        js = f.read()

    places = extract_places(js)
    if args.city:
        places = [p for p in places if p[1] == args.city]
    print(f"Places to process: {len(places)} ({'city=' + args.city if args.city else 'all cities'})")

    queries_used = 0
    processed = 0
    skipped_existing = 0

    for pid, city_id, category, name in places:
        if pid in photos_db:
            skipped_existing += 1
            continue
        if pid in skip_ids:
            print(f"  Skipping {pid} (in skip list)")
            continue
        if processed >= args.batch:
            print(f"Batch limit {args.batch} reached.")
            break

        needed = 2 if category in FOOD_CATS else 1
        if queries_used + needed > BUDGET:
            print(f"Budget limit ({BUDGET} queries) reached.")
            break

        print(f"[{pid}] {name}  ({city_id} / {category})")
        try:
            photos = get_photos(name, city_id, category, args.max_photos)
        except CreditsExhausted as e:
            print(f"\n!! Serper credits exhausted: {e}")
            print("   Progress saved. Re-run with a fresh SERPER_KEY to continue.")
            break

        photos_db[pid] = photos
        queries_used += needed
        processed += 1

        # Save locally every 20 places (safety net)
        if processed % 20 == 0:
            with open(PHOTOS_FILE, "w", encoding="utf-8") as f:
                json.dump(photos_db, f, ensure_ascii=False, indent=2)
            print(f"  Checkpoint: {processed} done, {queries_used} queries used")

        time.sleep(0.5)  # ~2 req/sec

    # Final local save
    with open(PHOTOS_FILE, "w", encoding="utf-8") as f:
        json.dump(photos_db, f, ensure_ascii=False, indent=2)

    filled = sum(1 for v in photos_db.values() if v)
    print(f"\nSummary:")
    print(f"  Processed this run : {processed}")
    print(f"  Skipped (existing) : {skipped_existing}")
    print(f"  Total in JSON      : {len(photos_db)} ({filled} with photos)")
    print(f"  Serper queries used: {queries_used}")

    if GITHUB_TOKEN and processed > 0:
        print("\nCommitting to repo via GitHub API...")
        github_commit(photos_db, args.city, filled)
    elif processed == 0:
        print("\nNothing new processed — skipping commit.")
    else:
        print("\nNo GITHUB_TOKEN — skipping commit (run locally?).")


if __name__ == "__main__":
    main()
