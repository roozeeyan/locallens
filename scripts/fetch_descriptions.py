#!/usr/bin/env python3
"""
Fetch descriptions for all places using Serper search API.
Saves results to src/descriptions.json and commits via GitHub API.
1 credit = 1 search query.
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
DESC_FILE = "src/descriptions.json"
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

BUDGET = 2300


class CreditsExhausted(Exception):
    pass


def serper_search(query: str) -> dict:
    """1 credit. Returns Serper search result dict."""
    try:
        resp = requests.post(
            "https://google.serper.dev/search",
            headers={"X-API-KEY": SERPER_KEY, "Content-Type": "application/json"},
            json={"q": query, "hl": "ru", "num": 3},
            timeout=30,
        )
        if resp.status_code in (401, 402, 403):
            raise CreditsExhausted(f"HTTP {resp.status_code}: {resp.text[:200]}")
        resp.raise_for_status()
        data = resp.json()
        if "error" in data or data.get("statusCode", 200) >= 400:
            raise CreditsExhausted(f"Serper error: {str(data)[:200]}")
        return data
    except CreditsExhausted:
        raise
    except Exception as e:
        print(f"    Serper error: {e}", file=sys.stderr)
        return {}


# Domains that produce low-quality snippets (social media, review aggregators)
BAD_DOMAINS = (
    "instagram.com", "facebook.com", "twitter.com", "tiktok.com",
    "vk.com", "ok.ru", "t.me", "youtube.com",
    "tripadvisor.com", "foursquare.com", "yelp.com",
    "2gis.com", "zoon.ru", "yell.com", "mapquest.com",
)

# Phrases that indicate a non-descriptive snippet
BAD_PHRASES = (
    "followers", "following", " posts", " likes", " репост",
    "reviews of", "rated ", "ranked #", "unbiased reviews",
    "Tel. +", "E-mail.", "tel:", "mailto:",
    "добраться", "билеты на поезд", "booking.com",
    "Book a Table", "CapCut", "reels",
    "HGЯO",  # Wikipedia geo template artifact
)


def is_garbage(text: str, url: str = "") -> bool:
    """Return True if the snippet looks like a social media post, rating, or directory listing."""
    lower_url = url.lower()
    for domain in BAD_DOMAINS:
        if domain in lower_url:
            return True
    lower_text = text.lower()
    for phrase in BAD_PHRASES:
        if phrase.lower() in lower_text:
            return True
    # Emoji-heavy text typical of Instagram captions
    emoji_count = sum(1 for c in text if ord(c) > 0x2600)
    if emoji_count >= 3:
        return True
    return False


def best_organic(organic: list) -> str:
    """Return the best snippet from organic results, skipping garbage sources."""
    for result in organic[:5]:
        url = result.get("link", "")
        snippet = (result.get("snippet") or "").strip()
        if len(snippet) < 40:
            continue
        if is_garbage(snippet, url):
            continue
        return snippet
    return ""


def extract_description(data: dict) -> str:
    """
    Extract best description from Serper search result.
    Priority: knowledgeGraph description > answerBox snippet > best organic snippet.
    """
    # Knowledge graph (Google My Business / Wikipedia) — always high quality
    kg = data.get("knowledgeGraph", {})
    if kg.get("description"):
        return kg["description"].strip()

    # Answer box
    ab = data.get("answerBox", {})
    snippet = (ab.get("snippet") or ab.get("answer") or "").strip()
    if snippet and not is_garbage(snippet):
        return snippet

    # Best organic snippet (skip social media / review aggregators)
    return best_organic(data.get("organic", []))


def get_description(name: str, city_id: str) -> str:
    """Fetch description for a place. Returns empty string if nothing found."""
    city = CITY_EN.get(city_id, city_id)
    data = serper_search(f'"{name}" {city}')
    desc = extract_description(data)
    if not desc:
        # Fallback: search without quotes + "about" to target official sites
        time.sleep(0.3)
        data2 = serper_search(f"{name} {city} about")
        desc = extract_description(data2)
    return desc


def extract_places(js_content: str) -> list:
    """Extract (id, cityId, name) from data.js, skipping places with existing descriptions."""
    # Match id, cityId, name
    id_city = re.compile(
        r'\{\s*id:\s*(\d+),\s*cityId:\s*"([^"]+)"'
    )
    name_pat = re.compile(r'name:\s*["`]([^"`\n]+)["`]')
    desc_pat = re.compile(r'description:\s*["`]([^"`]{5,})["`]')

    results = []
    for block_match in re.finditer(
        r'\{\s*id:\s*\d+.*?(?=\{|$)',
        js_content,
        re.DOTALL,
    ):
        block = block_match.group(0)
        id_m = id_city.search(block)
        name_m = name_pat.search(block)
        desc_m = desc_pat.search(block)
        if id_m and name_m:
            pid = id_m.group(1)
            city_id = id_m.group(2)
            pname = name_m.group(1)
            has_desc = bool(desc_m)
            results.append((pid, city_id, pname, has_desc))
    return results


def github_commit(desc_db: dict, city: str, filled: int) -> None:
    """Commit descriptions.json to the repo via GitHub Contents API."""
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
    message = f"Add descriptions for {filled} places ({label})"

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
            print(f"  SHA conflict attempt {attempt}, retrying...")
            time.sleep(3)
            continue
        print(f"  GitHub API commit failed: {put.status_code} {put.text[:400]}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--city",   type=str, default="",
                        help="Only process this cityId, e.g. 'yerevan'")
    parser.add_argument("--batch",  type=int, default=9999,
                        help="Stop after this many new places")
    parser.add_argument("--skip",   type=str, default="",
                        help="Comma-separated place IDs to skip")
    parser.add_argument("--overwrite", action="store_true",
                        help="Re-fetch even if description already exists in JSON")
    args = parser.parse_args()

    if not SERPER_KEY:
        print("ERROR: SERPER_KEY not set", file=sys.stderr)
        sys.exit(1)

    skip_ids = {s.strip() for s in args.skip.split(",") if s.strip()}

    # Load existing descriptions
    if os.path.exists(DESC_FILE):
        with open(DESC_FILE, "r", encoding="utf-8") as f:
            desc_db: dict = json.load(f)
        print(f"Loaded descriptions.json: {len(desc_db)} existing entries")
    else:
        desc_db = {}

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        js = f.read()

    places = extract_places(js)
    if args.city:
        places = [p for p in places if p[1] == args.city]
    print(f"Places to process: {len(places)} ({'city=' + args.city if args.city else 'all cities'})")

    queries_used = 0
    processed = 0
    skipped_existing = 0

    for pid, city_id, name, has_hardcoded_desc in places:
        # Skip if already has description (hardcoded OR in json)
        already_in_json = pid in desc_db and desc_db[pid]
        if not args.overwrite and (has_hardcoded_desc or already_in_json):
            skipped_existing += 1
            continue
        if pid in skip_ids:
            print(f"  Skipping {pid} (in skip list)")
            continue
        if processed >= args.batch:
            print(f"Batch limit {args.batch} reached.")
            break
        if queries_used + 1 > BUDGET:
            print(f"Budget limit ({BUDGET} queries) reached.")
            break

        print(f"[{pid}] {name}  ({city_id})")
        try:
            desc = get_description(name, city_id)
        except CreditsExhausted as e:
            print(f"\n!! Serper credits exhausted: {e}")
            print("   Progress saved. Re-run with a fresh SERPER_KEY to continue.")
            break

        desc_db[pid] = desc
        queries_used += 1  # minimum 1 per place (2 if fallback used)
        processed += 1

        if desc:
            print(f"    → {desc[:80]}...")
        else:
            print(f"    → (no description found)")

        # Checkpoint every 20 places
        if processed % 20 == 0:
            with open(DESC_FILE, "w", encoding="utf-8") as f:
                json.dump(desc_db, f, ensure_ascii=False, indent=2)
            print(f"  Checkpoint: {processed} done, {queries_used} queries used")

        time.sleep(0.5)

    # Final local save
    with open(DESC_FILE, "w", encoding="utf-8") as f:
        json.dump(desc_db, f, ensure_ascii=False, indent=2)

    filled = sum(1 for v in desc_db.values() if v)
    print(f"\nSummary:")
    print(f"  Processed this run : {processed}")
    print(f"  Skipped (existing) : {skipped_existing}")
    print(f"  Total in JSON      : {len(desc_db)} ({filled} with text)")
    print(f"  Serper queries used: {queries_used}")

    if GITHUB_TOKEN and processed > 0:
        print("\nCommitting to repo via GitHub API...")
        github_commit(desc_db, args.city, filled)
    elif processed == 0:
        print("\nNothing new processed — skipping commit.")
    else:
        print("\nNo GITHUB_TOKEN — skipping commit.")


if __name__ == "__main__":
    main()
