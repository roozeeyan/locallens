#!/usr/bin/env python3
"""
Audit places for data quality issues:
- Descriptions falsely claiming a city-center location for out-of-city places
- Missing descriptions
- AI-generated descriptions mentioning wrong city
- Placeholder coordinates (all places in city with same lat/lng)

Outputs audit_report.json and optionally creates a GitHub Issue.
"""

import base64
import json
import os
import re
import sys
import requests

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GITHUB_REPO = os.environ.get("GITHUB_REPOSITORY", "roozeeyan/locallens")
DESC_FILE   = "src/descriptions.json"
COORDS_FILE = "src/coords.json"
DATA_FILE   = "src/data.js"
REPORT_FILE = "audit_report.json"

CITY_PLACEHOLDER_COORDS = {
    "yerevan":   (40.1872, 44.5152),
    "bangkok":   (13.7563, 100.5018),
    "samui":     (9.512,   100.0136),
    "phangan":   (9.7353,  100.0136),
    "hoian":     (15.8801, 108.338),
    "bali":      (-8.4095, 115.1889),
    "danang":    (16.0544, 108.2022),
    "singapore": (1.3521,  103.8198),
}

CITY_RU_NAMES = {
    "yerevan":   ["ереван", "yerevan"],
    "bangkok":   ["бангкок", "bangkok"],
    "samui":     ["самуи", "samui"],
    "phangan":   ["панган", "phangan"],
    "hoian":     ["хой ан", "hoi an", "hoian"],
    "bali":      ["бали", "bali"],
    "danang":    ["дананг", "da nang", "danang"],
    "singapore": ["сингапур", "singapore"],
}

WRONG_LOCATION_PATTERNS = [
    r"в сердце {city}",
    r"в центре {city}",
    r"в самом сердце {city}",
    r"{city} расположен",
    r"расположен в {city}",
    r"находится в {city}",
    r"в {city} находится",
    r"heart of {city}",
    r"center of {city}",
    r"в {city}.*(?:стиль|атмосфер|место)",
]


def extract_places(js_content: str) -> list:
    pattern = re.compile(
        r'\{\s*id:\s*(\d+),\s*cityId:\s*"([^"]+)",\s*category:\s*"([^"]+)"'
        r'.*?name:\s*["`]([^"`\n]+)["`]'
        r'(.*?)(?=\{|$)',
        re.DOTALL,
    )
    desc_pat   = re.compile(r'description:\s*["`]([^"`]{10,})["`]')
    travel_pat = re.compile(r'travelAround:\s*true')
    results = []
    for m in pattern.finditer(js_content):
        block = m.group(5)
        results.append({
            "id":           m.group(1),
            "cityId":       m.group(2),
            "category":     m.group(3),
            "name":         m.group(4),
            "hasHardcoded": bool(desc_pat.search(block)),
            "travelAround": bool(travel_pat.search(block)),
        })
    return results


def has_wrong_city_claim(desc: str, city_id: str, travel_around: bool) -> bool:
    """Returns True if description claims place is in a city when it's actually outside."""
    if not desc or not travel_around:
        return False
    lower = desc.lower()
    for name_variant in CITY_RU_NAMES.get(city_id, []):
        for pat_tmpl in WRONG_LOCATION_PATTERNS:
            pat = pat_tmpl.replace("{city}", re.escape(name_variant))
            if re.search(pat, lower):
                return True
    return False


def has_placeholder_coords(place_id: str, city_id: str, coords_db: dict) -> bool:
    coords = coords_db.get(place_id)
    if coords:
        return False  # Has real coords
    placeholder = CITY_PLACEHOLDER_COORDS.get(city_id)
    if not placeholder:
        return False
    return True  # Still using placeholder (no entry in coords.json)


def create_github_issue(title: str, body: str) -> None:
    api = f"https://api.github.com/repos/{GITHUB_REPO}/issues"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    resp = requests.post(api, headers=headers,
                         json={"title": title, "body": body, "labels": ["data-quality"]},
                         timeout=30)
    if resp.status_code == 201:
        print(f"  GitHub Issue created: {resp.json()['html_url']}")
    else:
        print(f"  Issue creation failed: {resp.status_code} {resp.text[:300]}", file=sys.stderr)


def main():
    with open(DATA_FILE, encoding="utf-8") as f:
        js = f.read()
    places = extract_places(js)

    desc_db   = json.load(open(DESC_FILE))   if os.path.exists(DESC_FILE)   else {}
    coords_db = json.load(open(COORDS_FILE)) if os.path.exists(COORDS_FILE) else {}

    issues = {
        "wrong_location_in_description": [],
        "missing_description":           [],
        "placeholder_coordinates":       [],
    }

    for p in places:
        pid          = p["id"]
        city_id      = p["cityId"]
        name         = p["name"]
        travel       = p["travelAround"]
        has_hardcoded = p["hasHardcoded"]
        desc         = desc_db.get(pid, "")

        # 1. Wrong city claim in description
        if has_wrong_city_claim(desc, city_id, travel):
            issues["wrong_location_in_description"].append({
                "id": pid, "name": name, "city": city_id,
                "description": desc[:200],
            })

        # 2. Missing description (no hardcoded, no json entry)
        if not has_hardcoded and (not desc or len(desc.strip()) < 30):
            issues["missing_description"].append({
                "id": pid, "name": name, "city": city_id, "category": p["category"]
            })

        # 3. Placeholder coordinates
        if has_placeholder_coords(pid, city_id, coords_db):
            issues["placeholder_coordinates"].append({
                "id": pid, "name": name, "city": city_id
            })

    # Save report
    report = {
        "summary": {k: len(v) for k, v in issues.items()},
        "issues": issues,
    }
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print("=== AUDIT REPORT ===")
    for key, items in issues.items():
        print(f"\n{key.upper()}: {len(items)} issues")
        for item in items[:5]:
            print(f"  [{item['id']}] {item['name']} ({item.get('city','')})")
        if len(items) > 5:
            print(f"  ... and {len(items)-5} more (see {REPORT_FILE})")

    total = sum(len(v) for v in issues.values())
    print(f"\nTotal issues found: {total}")
    print(f"Full report saved to: {REPORT_FILE}")

    # Create GitHub Issue if there are problems
    if GITHUB_TOKEN and (issues["wrong_location_in_description"] or issues["missing_description"]):
        lines = ["## Автоматический аудит данных LocalLens\n"]
        for key, items in issues.items():
            if not items:
                continue
            label = {
                "wrong_location_in_description": "❌ Неверная локация в описании",
                "missing_description":            "⚠️ Отсутствует описание",
                "placeholder_coordinates":        "📍 Координаты-заглушки",
            }.get(key, key)
            lines.append(f"\n### {label} ({len(items)} мест)\n")
            lines.append("| ID | Название | Город |\n|---|---|---|")
            for item in items[:20]:
                lines.append(f"| {item['id']} | {item['name']} | {item.get('city','')} |")
            if len(items) > 20:
                lines.append(f"\n_...и ещё {len(items)-20} мест_")
            if key == "wrong_location_in_description":
                lines.append("\n**Действие:** запустить `Generate AI Descriptions` с `overwrite=true` "
                             "для этих ID чтобы исправить описания.")

        body = "\n".join(lines)
        create_github_issue("🔍 Аудит данных: найдены проблемы с качеством", body)


if __name__ == "__main__":
    main()
