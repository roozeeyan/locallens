#!/usr/bin/env python3
"""
Geocode all places via OpenStreetMap Nominatim (free, no API key).
Saves to src/coords.json and commits via GitHub Contents API.
Rate limit: 1 request/second (Nominatim policy).
~925 places ≈ 15 minutes total.
"""

import argparse
import base64
import json
import os
import re
import sys
import time

import requests

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GITHUB_REPO = os.environ.get("GITHUB_REPOSITORY", "roozeeyan/locallens")
COORDS_FILE = "src/coords.json"
DATA_FILE = "src/data.js"

CITY_EN = {
    "yerevan":   ("Yerevan", "Armenia"),
    "bangkok":   ("Bangkok", "Thailand"),
    "samui":     ("Ko Samui", "Thailand"),
    "phangan":   ("Ko Phangan", "Thailand"),
    "hoian":     ("Hoi An", "Vietnam"),
    "bali":      ("Bali", "Indonesia"),
    "danang":    ("Da Nang", "Vietnam"),
    "singapore": ("Singapore", "Singapore"),
}

# Bounding boxes [lat_min, lat_max, lng_min, lng_max] to validate returned coords
CITY_BBOX = {
    "yerevan":   (39.9,  40.35, 44.3,  44.75),
    "bangkok":   (13.4,  14.1,  100.2, 100.95),
    "samui":     (9.25,  9.65,  99.75, 100.1),
    "phangan":   (9.5,   10.1,  99.9,  100.15),
    "hoian":     (15.7,  16.1,  108.1, 108.55),
    "bali":      (-9.0,  -8.0,  114.3, 115.85),
    "danang":    (15.85, 16.2,  108.0, 108.45),
    "singapore": (1.15,  1.5,   103.55, 104.05),
}

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {"User-Agent": "LocalLens/1.0 (roozeeyan@gmail.com)"}


def nominatim_search(query: str) -> list:
    try:
        r = requests.get(
            NOMINATIM_URL,
            params={"q": query, "format": "json", "limit": 3},
            headers=HEADERS,
            timeout=10,
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"  Nominatim error: {e}", file=sys.stderr)
        return []


def in_bbox(lat: float, lng: float, city_id: str) -> bool:
    bbox = CITY_BBOX.get(city_id)
    if not bbox:
        return True
    lat_min, lat_max, lng_min, lng_max = bbox
    return lat_min <= lat <= lat_max and lng_min <= lng <= lng_max


def geocode(name: str, city_id: str) -> tuple:
    """Return (lat, lng) or (None, None) if not found within city bbox."""
    city, country = CITY_EN.get(city_id, (city_id, ""))

    for query in [
        f"{name}, {city}, {country}",
        f"{name} {city}",
    ]:
        results = nominatim_search(query)
        for r in results:
            try:
                lat = float(r["lat"])
                lng = float(r["lon"])
                if in_bbox(lat, lng, city_id):
                    return round(lat, 6), round(lng, 6)
            except (KeyError, ValueError):
                continue
        time.sleep(1.05)  # respect Nominatim rate limit between queries

    return None, None


def extract_places(js_content: str) -> list:
    """Extract (id, cityId, name) from data.js."""
    pattern = re.compile(
        r'\{\s*id:\s*(\d+),\s*cityId:\s*"([^"]+)".*?name:\s*["`]([^"`\n]+)["`]',
        re.DOTALL,
    )
    return [(m.group(1), m.group(2), m.group(3)) for m in pattern.finditer(js_content)]


def github_commit(coords_db: dict, city: str, filled: int) -> None:
    """Commit coords.json to the repo via GitHub Contents API."""
    api = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{COORDS_FILE}"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    content_b64 = base64.b64encode(
        json.dumps(coords_db, ensure_ascii=False, indent=2).encode("utf-8")
    ).decode("ascii")

    label = f"city={city}" if city else "all cities"
    message = f"Add real coordinates for {filled} places ({label})"

    for attempt in range(1, 4):
        resp = requests.get(api, headers=headers, timeout=30)
        sha = resp.json().get("sha", "") if resp.status_code == 200 else ""

        payload = {"message": message, "content": content_b64}
        if sha:
            payload["sha"] = sha

        put = requests.put(api, headers=headers, json=payload, timeout=90)
        if put.status_code in (200, 201):
            print(f"  coords.json committed. ({filled} places geocoded)")
            return
        if put.status_code == 409 and attempt < 3:
            print(f"  SHA conflict attempt {attempt}, retrying...")
            time.sleep(3)
            continue
        print(f"  GitHub API commit failed: {put.status_code} {put.text[:400]}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--city",    type=str, default="", help="Only process this cityId")
    parser.add_argument("--batch",   type=int, default=9999, help="Stop after N new places")
    parser.add_argument("--skip",    type=str, default="", help="Comma-separated IDs to skip")
    parser.add_argument("--overwrite", action="store_true", help="Re-geocode existing entries")
    args = parser.parse_args()

    skip_ids = {s.strip() for s in args.skip.split(",") if s.strip()}

    # Load existing coords
    if os.path.exists(COORDS_FILE):
        with open(COORDS_FILE, "r", encoding="utf-8") as f:
            coords_db: dict = json.load(f)
        print(f"Loaded coords.json: {len(coords_db)} existing entries")
    else:
        coords_db = {}

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        js = f.read()

    places = extract_places(js)
    if args.city:
        places = [p for p in places if p[1] == args.city]
    print(f"Places to process: {len(places)} ({'city=' + args.city if args.city else 'all cities'})")

    processed = 0
    skipped = 0

    for pid, city_id, name in places:
        already = pid in coords_db and coords_db[pid]
        if not args.overwrite and already:
            skipped += 1
            continue
        if pid in skip_ids:
            continue
        if processed >= args.batch:
            print(f"Batch limit {args.batch} reached.")
            break

        print(f"[{pid}] {name}  ({city_id})")
        lat, lng = geocode(name, city_id)

        if lat is not None:
            coords_db[pid] = {"lat": lat, "lng": lng}
            print(f"    → {lat}, {lng}")
        else:
            coords_db[pid] = None
            print(f"    → (not found in city bbox)")

        processed += 1

        # Checkpoint every 50 places
        if processed % 50 == 0:
            with open(COORDS_FILE, "w", encoding="utf-8") as f:
                json.dump(coords_db, f, ensure_ascii=False, indent=2)
            print(f"  Checkpoint: {processed} done")

        time.sleep(1.05)  # Nominatim rate limit

    # Final local save
    with open(COORDS_FILE, "w", encoding="utf-8") as f:
        json.dump(coords_db, f, ensure_ascii=False, indent=2)

    filled = sum(1 for v in coords_db.values() if v)
    print(f"\nSummary:")
    print(f"  Processed this run: {processed}")
    print(f"  Skipped (existing): {skipped}")
    print(f"  Total geocoded    : {filled} / {len(coords_db)}")

    if GITHUB_TOKEN and processed > 0:
        print("\nCommitting to repo via GitHub API...")
        github_commit(coords_db, args.city, filled)
    elif processed == 0:
        print("\nNothing new — skipping commit.")
    else:
        print("\nNo GITHUB_TOKEN — skipping commit.")


if __name__ == "__main__":
    main()
