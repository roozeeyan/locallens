#!/usr/bin/env python3
"""
Fetch photos for all places in data.js using Serper image search API.
Saves results to src/photos.json.

Usage:
    python scripts/fetch_photos.py [--batch N] [--skip id1,id2,...]
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
GITHUB_REPO = os.environ.get("GITHUB_REPOSITORY", "roozeeyan/locallens")
PHOTOS_FILE = "src/photos.json"
PHOTOS_API_PATH = "src/photos.json"
DATA_FILE = "src/data.js"

CITY_EN = {
    "yerevan": "Yerevan Armenia",
    "bangkok": "Bangkok Thailand",
    "samui": "Koh Samui Thailand",
    "phangan": "Koh Phangan Thailand",
    "hoian": "Hoi An Vietnam",
    "bali": "Bali Indonesia",
    "danang": "Da Nang Vietnam",
    "singapore": "Singapore",
}

FOOD_CATS = {"Кафе и рестораны", "Кофе и чай", "Бары", "Фудмаркеты"}

BUDGET = 2300  # Leave 200 credit buffer from 2500 free credits


class CreditsExhausted(Exception):
    """Raised when Serper reports the free credit balance is used up."""


def serper_images(query: str, n: int = 8) -> list:
    """Query Serper image search and return list of image URLs."""
    try:
        resp = requests.post(
            "https://google.serper.dev/images",
            headers={"X-API-KEY": SERPER_KEY, "Content-Type": "application/json"},
            json={"q": query, "num": n},
            timeout=30,
        )
        # 402 Payment Required / 403 = credits exhausted on free plan
        if resp.status_code in (401, 402, 403):
            raise CreditsExhausted(f"HTTP {resp.status_code}: {resp.text[:200]}")
        resp.raise_for_status()
        items = resp.json().get("images", [])
        urls = [img["imageUrl"] for img in items if img.get("imageUrl")]
        return urls[:n]
    except CreditsExhausted:
        raise
    except Exception as e:
        print(f"    Serper error: {e}", file=sys.stderr)
        return []


def get_photos(name: str, city_id: str, category: str, max_photos: int = 10) -> list:
    """Fetch up to max_photos for a place.
    Food/bar categories: 2 queries (atmosphere + food) = 2 credits, richer mix.
    All others: 1 query = 1 credit, up to 10 photos.
    """
    city = CITY_EN.get(city_id, city_id)

    # Primary search
    primary = serper_images(f'"{name}" {city}', 10)
    if not primary:
        primary = serper_images(f"{name} {city}", 10)

    if category in FOOD_CATS:
        # Second query for food/dishes
        food = serper_images(f'"{name}" {city} food menu', 10)
        if not food:
            food = serper_images(f"{name} {city} food", 10)
        half = max_photos // 2
        photos = primary[:half] + food[:max_photos - half]
    else:
        photos = primary[:max_photos]

    return photos[:max_photos]


def extract_places(js_content: str) -> list:
    """
    Extract place entries from data.js.
    Returns list of (id, city_id, category, name) tuples.
    """
    # Match place object openings — works for both " and ` names
    pattern = re.compile(
        r'\{\s*id:\s*(\d+),\s*cityId:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*name:\s*["`]([^"`]+)["`]'
    )
    return pattern.findall(js_content)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch", type=int, default=9999)
    parser.add_argument("--skip", type=str, default="")
    parser.add_argument("--city", type=str, default="",
                        help="Process only places with this cityId (e.g. 'yerevan')")
    parser.add_argument("--max_photos", type=int, default=6,
                        help="Max photos per place (4 = 1 query each; 6-7 = 2 queries for food)")
    args = parser.parse_args()

    if not SERPER_KEY:
        print("ERROR: SERPER_KEY environment variable not set", file=sys.stderr)
        sys.exit(1)

    skip_ids = set(s.strip() for s in args.skip.split(",") if s.strip())

    # Load existing photos to allow incremental runs
    if os.path.exists(PHOTOS_FILE):
        with open(PHOTOS_FILE, "r") as f:
            photos_db: dict = json.load(f)
        print(f"Loaded existing photos.json ({len(photos_db)} entries)")
    else:
        photos_db = {}

    # Parse places from data.js
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        js = f.read()

    places = extract_places(js)
    if args.city:
        places = [(pid, cid, cat, name) for pid, cid, cat, name in places if cid == args.city]
        print(f"Found {len(places)} places in data.js for city '{args.city}'")

    queries_used = 0
    processed = 0
    skipped_existing = 0

    for pid, city_id, category, name in places:
        # Skip if already fetched or in skip list
        if pid in photos_db:
            skipped_existing += 1
            continue
        if pid in skip_ids:
            print(f"  Skipping ID {pid} (in skip list)")
            continue
        if processed >= args.batch:
            print(f"Batch limit of {args.batch} reached, stopping.")
            break

        # Estimate queries needed for budget check
        needed = 2 if category in FOOD_CATS else 1
        if queries_used + needed > BUDGET:
            print(f"Budget limit ({BUDGET}) reached after {queries_used} queries. Stopping.")
            break

        print(f"[{pid}] {name} ({city_id} / {category})")
        try:
            photos = get_photos(name, city_id, category, args.max_photos)
        except CreditsExhausted as e:
            print(f"\n!! Serper credits exhausted: {e}")
            print("   Saving progress and stopping cleanly. Re-run later with a "
                  "fresh key to continue — already-done places are skipped.")
            break
        photos_db[pid] = photos
        queries_used += needed
        processed += 1

        # Save progress every 20 places
        if processed % 20 == 0:
            with open(PHOTOS_FILE, "w", encoding="utf-8") as f:
                json.dump(photos_db, f, ensure_ascii=False, indent=2)
            print(f"  Progress saved ({processed} processed, {queries_used} queries used)")

        # Polite rate limit: ~2 req/sec max
        time.sleep(0.5)

    # Final local save
    with open(PHOTOS_FILE, "w", encoding="utf-8") as f:
        json.dump(photos_db, f, ensure_ascii=False, indent=2)

    filled = sum(1 for v in photos_db.values() if v)
    print(f"\nDone.")
    print(f"  Places processed this run: {processed}")
    print(f"  Already existed (skipped): {skipped_existing}")
    print(f"  Total in photos.json: {len(photos_db)} ({filled} with photos)")
    print(f"  Serper queries used this run: {queries_used}")

    # Push directly via GitHub API — no git, no conflicts
    if GITHUB_TOKEN and processed > 0:
        print("\nPushing photos.json via GitHub API...")
        api = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{PHOTOS_API_PATH}"
        headers = {"Authorization": f"token {GITHUB_TOKEN}", "Accept": "application/vnd.github+json"}

        # Get current file SHA (needed for update)
        resp = requests.get(api, headers=headers, timeout=30)
        sha = resp.json().get("sha", "") if resp.status_code == 200 else ""

        content = base64.b64encode(
            json.dumps(photos_db, ensure_ascii=False, indent=2).encode()
        ).decode()

        payload = {
            "message": f"Add photos for {filled} places ({args.city or 'all'} city)",
            "content": content,
        }
        if sha:
            payload["sha"] = sha

        put = requests.put(api, headers=headers, json=payload, timeout=60)
        if put.status_code in (200, 201):
            print(f"  photos.json committed to repo successfully.")
        else:
            print(f"  GitHub API push failed: {put.status_code} {put.text[:300]}", file=sys.stderr)
            sys.exit(1)
    else:
        print("\nSkipping GitHub API push (no token or nothing processed).")


if __name__ == "__main__":
    main()
