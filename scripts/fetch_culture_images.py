#!/usr/bin/env python3
"""
Fetch Wikipedia images for culture.json inventors.
Updates personImg and inventionImg fields using Wikimedia Commons API.
"""

import base64
import json
import os
import sys
import time

import requests

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GITHUB_REPO  = os.environ.get("GITHUB_REPOSITORY", "roozeeyan/locallens")
CULTURE_FILE = "src/culture.json"

WIKI_API = "https://en.wikipedia.org/w/api.php"
HEADERS  = {"User-Agent": "LocalLensApp/1.0 (roozeeyan@gmail.com)"}

# Wikipedia page titles for each person and invention
WIKI_LOOKUPS = {
    "yerevan": [
        {
            "invention": "Цветное телевидение",
            "person_wiki": "Hovannes Adamian",
            "invention_wiki": "Color television",
        },
        {
            "invention": "ПЭТ-сканирование",
            "person_wiki": "Michael Ter-Pogossian",
            "invention_wiki": "Positron emission tomography",
        },
        {
            "invention": "Банкомат",
            "person_wiki": "Luther George Simjian",
            "invention_wiki": "Automated teller machine",
        },
        {
            "invention": "Автоматическая КПП",
            "person_wiki": "Oscar H. Banker",
            "invention_wiki": "Automatic transmission",
        },
        {
            "invention": "Кислородная маска А-14",
            "person_wiki": "Arthur Bulbulian",
            "invention_wiki": "Oxygen mask",
        },
        {
            "invention": "Ассистивные технологии",
            "person_wiki": "Emik Avagyan",
            "invention_wiki": "Assistive technology",
        },
        {
            "invention": "МРТ-сканер",
            "person_wiki": "Raymond Damadian",
            "invention_wiki": "Magnetic resonance imaging",
        },
        {
            "invention": "Смеситель Delta",
            "person_wiki": "Alex Manoogian",
            "invention_wiki": "Delta Faucet Company",
        },
    ]
}


def get_wiki_image(page_title: str, size: int = 400) -> str:
    """Return thumbnail URL for a Wikipedia page, or empty string."""
    try:
        resp = requests.get(
            WIKI_API,
            params={
                "action": "query",
                "titles": page_title,
                "prop": "pageimages",
                "pithumbsize": size,
                "format": "json",
            },
            headers=HEADERS,
            timeout=10,
        )
        pages = resp.json().get("query", {}).get("pages", {})
        for page in pages.values():
            thumb = page.get("thumbnail", {}).get("source", "")
            if thumb:
                return thumb
    except Exception as e:
        print(f"  Wiki image error for '{page_title}': {e}", file=sys.stderr)
    return ""


def github_commit(data: dict) -> None:
    api = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{CULTURE_FILE}"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    content_b64 = base64.b64encode(
        json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
    ).decode("ascii")

    resp = requests.get(api, headers=headers, timeout=30)
    sha = resp.json().get("sha", "") if resp.status_code == 200 else ""
    payload = {"message": "Add Wikipedia images to culture.json", "content": content_b64}
    if sha:
        payload["sha"] = sha
    put = requests.put(api, headers=headers, json=payload, timeout=60)
    if put.status_code in (200, 201):
        print("culture.json committed.")
    else:
        print(f"Commit failed: {put.status_code} {put.text[:300]}", file=sys.stderr)
        sys.exit(1)


def main():
    with open(CULTURE_FILE, encoding="utf-8") as f:
        data = json.load(f)

    for city_id, lookups in WIKI_LOOKUPS.items():
        city_data = data.get(city_id, {})
        facts = city_data.get("facts", [])

        for lookup in lookups:
            # Find matching fact by invention name
            fact = next((f for f in facts if f["invention"] == lookup["invention"]), None)
            if not fact:
                print(f"  Fact not found: {lookup['invention']}")
                continue

            print(f"[{lookup['invention']}]")

            # Person image
            if not fact.get("personImg"):
                img = get_wiki_image(lookup["person_wiki"])
                fact["personImg"] = img
                print(f"  person  → {img[:60] if img else 'not found'}")
                time.sleep(0.3)

            # Invention image
            if not fact.get("inventionImg"):
                img = get_wiki_image(lookup["invention_wiki"])
                fact["inventionImg"] = img
                print(f"  invention → {img[:60] if img else 'not found'}")
                time.sleep(0.3)

    with open(CULTURE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("\nSaved culture.json locally.")

    if GITHUB_TOKEN:
        github_commit(data)
    else:
        print("No GITHUB_TOKEN — skipping commit.")


if __name__ == "__main__":
    main()
