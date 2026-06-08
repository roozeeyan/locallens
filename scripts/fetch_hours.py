#!/usr/bin/env python3
"""
Fetch opening hours (and accurate coordinates) for all places via Serper Maps API.
Saves hours to src/hours.json and better coords to src/coords.json.
1 credit = 1 Serper Maps query (returns up to 10 matching places).
~925 places ≈ 925 credits.
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
HOURS_FILE = "src/hours.json"
COORDS_FILE = "src/coords.json"
DATA_FILE = "src/data.js"

CITY_EN = {
    "yerevan":   "Yerevan Armenia",
    "bangkok":   "Bangkok Thailand",
    "samui":     "Ko Samui Thailand",
    "phangan":   "Ko Phangan Thailand",
    "hoian":     "Hoi An Vietnam",
    "bali":      "Bali Indonesia",
    "danang":    "Da Nang Vietnam",
    "singapore": "Singapore",
}

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

DAY_MAP = {
    "Monday": "Mo", "Tuesday": "Tu", "Wednesday": "We",
    "Thursday": "Th", "Friday": "Fr", "Saturday": "Sa", "Sunday": "Su",
}


class CreditsExhausted(Exception):
    pass


def serper_maps(query: str) -> list:
    """1 credit. Returns list of place dicts from Serper Maps."""
    try:
        resp = requests.post(
            "https://google.serper.dev/maps",
            headers={"X-API-KEY": SERPER_KEY, "Content-Type": "application/json"},
            json={"q": query, "hl": "en", "num": 5},
            timeout=30,
        )
        if resp.status_code in (401, 402, 403):
            raise CreditsExhausted(f"HTTP {resp.status_code}: {resp.text[:200]}")
        resp.raise_for_status()
        data = resp.json()
        if "error" in data or data.get("statusCode", 200) >= 400:
            raise CreditsExhausted(f"Serper error: {str(data)[:200]}")
        return data.get("places", [])
    except CreditsExhausted:
        raise
    except Exception as e:
        print(f"  Serper error: {e}", file=sys.stderr)
        return []


def parse_ampm(s: str):
    """'10:00 AM' → '10:00', '10:00 PM' → '22:00'. Returns None on failure."""
    m = re.match(r"(\d+):(\d+)\s*(AM|PM)?", s.strip(), re.IGNORECASE)
    if not m:
        return None
    h, mins = int(m.group(1)), m.group(2)
    mer = (m.group(3) or "").upper()
    if mer == "PM" and h != 12:
        h += 12
    elif mer == "AM" and h == 12:
        h = 0
    return f"{h:02d}:{mins}"


def parse_hours_line(line: str):
    """
    'Monday: 10:00 AM – 10:00 PM' → ('Mo', {'o':'10:00','c':'22:00'})
    'Monday: Closed' → ('Mo', 'closed')
    Returns (day_key, value) or (None, None).
    """
    colon = line.find(":")
    if colon == -1:
        return None, None
    day_key = DAY_MAP.get(line[:colon].strip())
    if not day_key:
        return None, None
    time_part = line[colon + 1:].strip()
    if "closed" in time_part.lower():
        return day_key, "closed"
    dash = re.search(r"\s[–\-]\s", time_part)
    if not dash:
        return day_key, None
    o = parse_ampm(time_part[:dash.start()])
    c = parse_ampm(time_part[dash.end():])
    if o and c:
        return day_key, {"o": o, "c": c}
    return day_key, None


def in_bbox(lat: float, lng: float, city_id: str) -> bool:
    bbox = CITY_BBOX.get(city_id)
    if not bbox:
        return True
    lat_min, lat_max, lng_min, lng_max = bbox
    return lat_min <= lat <= lat_max and lng_min <= lng <= lng_max


def name_similarity(a: str, b: str) -> float:
    """Simple word overlap ratio."""
    wa = set(a.lower().split())
    wb = set(b.lower().split())
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / max(len(wa), len(wb))


def find_best_match(name: str, city_id: str, places: list):
    """Find the best matching place within city bbox."""
    best, best_score = None, 0.0
    for p in places:
        lat = p.get("latitude")
        lng = p.get("longitude")
        if lat is None or lng is None:
            continue
        if not in_bbox(float(lat), float(lng), city_id):
            continue
        score = name_similarity(name, p.get("title", ""))
        if score > best_score:
            best_score = score
            best = p
    # Accept if at least one word overlaps
    return best if best_score > 0.0 else None


def fetch_place(name: str, city_id: str):
    """Return (lat, lng, hours_dict) or (None, None, None)."""
    city = CITY_EN.get(city_id, city_id)
    places = serper_maps(f"{name} {city}")
    match = find_best_match(name, city_id, places)
    if not match:
        return None, None, None

    lat = match.get("latitude")
    lng = match.get("longitude")
    if lat:
        lat = round(float(lat), 6)
    if lng:
        lng = round(float(lng), 6)

    opening_hours = match.get("openingHours") or []
    hours = {}
    for line in opening_hours:
        dk, val = parse_hours_line(line)
        if dk and val is not None:
            hours[dk] = val

    return lat, lng, hours if hours else None


def extract_places(js_content: str) -> list:
    pattern = re.compile(
        r'\{\s*id:\s*(\d+),\s*cityId:\s*"([^"]+)".*?name:\s*["`]([^"`\n]+)["`]',
        re.DOTALL,
    )
    return [(m.group(1), m.group(2), m.group(3)) for m in pattern.finditer(js_content)]


def github_commit_file(path: str, data: dict, message: str) -> None:
    api = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{path}"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    content_b64 = base64.b64encode(
        json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
    ).decode("ascii")

    for attempt in range(1, 4):
        resp = requests.get(api, headers=headers, timeout=30)
        sha = resp.json().get("sha", "") if resp.status_code == 200 else ""
        payload = {"message": message, "content": content_b64}
        if sha:
            payload["sha"] = sha
        put = requests.put(api, headers=headers, json=payload, timeout=90)
        if put.status_code in (200, 201):
            print(f"  {path} committed.")
            return
        if put.status_code == 409 and attempt < 3:
            time.sleep(3)
            continue
        print(f"  GitHub commit failed for {path}: {put.status_code} {put.text[:300]}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--city",      type=str, default="")
    parser.add_argument("--batch",     type=int, default=9999)
    parser.add_argument("--skip",      type=str, default="")
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--no-coords", action="store_true", help="Don't update coords.json")
    args = parser.parse_args()

    if not SERPER_KEY:
        print("ERROR: SERPER_KEY not set", file=sys.stderr)
        sys.exit(1)

    skip_ids = {s.strip() for s in args.skip.split(",") if s.strip()}

    hours_db = json.load(open(HOURS_FILE)) if os.path.exists(HOURS_FILE) else {}
    coords_db = json.load(open(COORDS_FILE)) if os.path.exists(COORDS_FILE) else {}
    print(f"Loaded: {len(hours_db)} hours, {len(coords_db)} coords")

    with open(DATA_FILE) as f:
        js = f.read()
    places = extract_places(js)
    if args.city:
        places = [p for p in places if p[1] == args.city]
    print(f"Places: {len(places)} ({'city=' + args.city if args.city else 'all'})")

    processed = skipped = 0

    for pid, city_id, name in places:
        already_has_hours = pid in hours_db
        if not args.overwrite and already_has_hours:
            skipped += 1
            continue
        if pid in skip_ids:
            continue
        if processed >= args.batch:
            print(f"Batch limit {args.batch} reached.")
            break

        print(f"[{pid}] {name}  ({city_id})")
        try:
            lat, lng, hours = fetch_place(name, city_id)
        except CreditsExhausted as e:
            print(f"\n!! Serper credits exhausted: {e}")
            break

        hours_db[pid] = hours
        if not args.no_coords and lat is not None:
            coords_db[pid] = {"lat": lat, "lng": lng}

        hours_count = len(hours) if hours else 0
        print(f"    → coords: {lat},{lng}  hours: {hours_count} days")

        processed += 1

        if processed % 50 == 0:
            with open(HOURS_FILE, "w") as f:
                json.dump(hours_db, f, ensure_ascii=False, indent=2)
            if not args.no_coords:
                with open(COORDS_FILE, "w") as f:
                    json.dump(coords_db, f, ensure_ascii=False, indent=2)
            print(f"  Checkpoint: {processed} done")

        time.sleep(0.5)

    with open(HOURS_FILE, "w") as f:
        json.dump(hours_db, f, ensure_ascii=False, indent=2)
    if not args.no_coords:
        with open(COORDS_FILE, "w") as f:
            json.dump(coords_db, f, ensure_ascii=False, indent=2)

    hours_filled = sum(1 for v in hours_db.values() if v)
    coords_filled = sum(1 for v in coords_db.values() if v)
    print(f"\nSummary: processed={processed}, skipped={skipped}")
    print(f"  Hours: {hours_filled}/{len(hours_db)} with data")
    print(f"  Coords: {coords_filled}/{len(coords_db)} geocoded")

    if GITHUB_TOKEN and processed > 0:
        city_label = f"city={args.city}" if args.city else "all cities"
        github_commit_file(HOURS_FILE, hours_db, f"Add opening hours for {hours_filled} places ({city_label})")
        if not args.no_coords:
            github_commit_file(COORDS_FILE, coords_db, f"Add coordinates for {coords_filled} places ({city_label})")
    elif processed == 0:
        print("Nothing new — skipping commit.")
    else:
        print("No GITHUB_TOKEN — skipping commit.")


if __name__ == "__main__":
    main()
