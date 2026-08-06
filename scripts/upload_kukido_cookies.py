"""
Upload Kukidō cookie WebPs to kado-menu-images and set each cookie to ₱100.
Uses production project idwtlujcdfnnndxmlaco + SUPABASE_SERVICE_ROLE_KEY from .env.
"""
from __future__ import annotations

import json
import pathlib
import re
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ROOT / "public" / "kukido"
REF = "idwtlujcdfnnndxmlaco"
BASE = f"https://{REF}.supabase.co"

# Stable SQL IDs from migrations (prod currently uses these)
COOKIES = [
    ("cookie_klassic", "klassic.webp", "Klassic Cookie"),
    ("cookie_campfire", "campfire.webp", "Campfire"),
    ("cookie_double_dark", "double-dark.webp", "Double Dark"),
    ("cookie_birthday", "birthday-bake.webp", "Birthday Bake"),
    ("cookie_blondie", "blondie.webp", "Blondie"),
    ("cookie_white_walnut", "white-chocolate-walnut.webp", "White Chocolate Walnut"),
]

BOXES = [
    ("kuki_box_4", 400, 4, "Kuki Box — 4 pcs"),
    ("kuki_box_5", 500, 5, "Kuki Box — 5 pcs"),
    ("kuki_box_6", 540, 6, "Kuki Box — 6 pcs"),
    ("kuki_box_10", 900, 10, "Kuki Box — 10 pcs"),
]


def load_service_key() -> str:
    text = (ROOT / ".env").read_text(encoding="utf-8")
    m = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text)
    if not m or not m.group(1).strip():
        print("ERR: SUPABASE_SERVICE_ROLE_KEY missing in .env", file=sys.stderr)
        sys.exit(1)
    return m.group(1).strip()


def rest(method: str, path: str, key: str, body: dict | list | None = None) -> list | dict:
    url = f"{BASE}/rest/v1/{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else []
    except urllib.error.HTTPError as e:
        print(e.read().decode()[:500], file=sys.stderr)
        raise


def upload_webp(key: str, object_path: str, file_path: pathlib.Path) -> str:
    url = f"{BASE}/storage/v1/object/kado-menu-images/{object_path}"
    body = file_path.read_bytes()
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "image/webp",
            "x-upsert": "true",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        resp.read()
    return f"{BASE}/storage/v1/object/public/kado-menu-images/{object_path}"


def main() -> None:
    key = load_service_key()
    cat = rest(
        "GET",
        "kk_menu_categories?id=eq.cat_pastries&select=id&limit=1",
        key,
    )
    if not cat:
        cat = rest(
            "GET",
            "kk_menu_categories?name=eq.Pastries&select=id&order=id&limit=1",
            key,
        )
    if not cat:
        print("ERR: Pastries category missing", file=sys.stderr)
        sys.exit(1)
    category_id = cat[0]["id"]
    print("Pastries category:", category_id)

    for pid, filename, name in COOKIES:
        asset = ASSETS / filename
        if not asset.is_file():
            print(f"ERR: missing {asset}", file=sys.stderr)
            sys.exit(1)
        public_url = upload_webp(key, f"products/{pid}.webp", asset)
        patched = rest(
            "PATCH",
            f"kk_products?id=eq.{pid}",
            key,
            {
                "name": name,
                "base_price": 100,
                "image": public_url,
                "description": (
                    "Handcrafted kukidō cookie — Mix & Match with tagged Kado Kohi drinks, "
                    "or build a Kuki Box from 4 pcs."
                ),
                "tags": ["mix-match", "cookie", "kukido"],
                "visible": True,
                "in_stock": True,
            },
        )
        print(f"Updated {pid}: {name} @ 100 -> {public_url[-48:]} rows={len(patched) if isinstance(patched, list) else patched}")

    # Hide Cookie Latte from pastry grid (collab focus is cookies + boxes)
    rest(
        "PATCH",
        "kk_products?id=eq.pastry_kukilatte",
        key,
        {"visible": False},
    )
    print("Hid pastry_kukilatte")

    plate = ASSETS / "collab-plate.webp"
    plate_url = upload_webp(key, "products/kuki_box.webp", plate) if plate.is_file() else None

    for box_id, price, pcs, label in BOXES:
        row = {
            "id": box_id,
            "category_id": category_id,
            "name": label,
            "description": (
                f"Build a {pcs}-piece kukidō cookie box. Choose any mix of flavors. "
                "Cookies are ₱90 each in 6-pc and 10-pc boxes."
                if pcs >= 6
                else f"Build a {pcs}-piece kukidō cookie box. Choose any mix of flavors."
            ),
            "base_price": price,
            "image": plate_url,
            "temperature": "both",
            "sizes": [],
            "milks": [],
            "tags": ["kuki-box", "kukido", "cookie-box"],
            "custom_fields": [],
    "visible": True,  # orderable via place_order; FE hides from pastry grid
            "in_stock": True,
            "sort_order": 90 + pcs,
        }
        # upsert via POST Prefer resolution + merge-duplicates
        url = f"{BASE}/rest/v1/kk_products?on_conflict=id"
        data = json.dumps(row).encode()
        req = urllib.request.Request(
            url,
            data=data,
            method="POST",
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=representation",
            },
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            print(f"Upserted {box_id} @ {price}:", resp.status)

    # Packaging add-ons (optional)
    for pack_id, price, label in [
        ("kuki_pack_single", 10, "Single cookie box (+₱10)"),
        ("kuki_pack_big", 25, "Big box packaging (+₱25)"),
    ]:
        row = {
            "id": pack_id,
            "category_id": category_id,
            "name": label,
            "description": "Optional kukidō packaging upgrade.",
            "base_price": price,
            "image": plate_url,
            "temperature": "both",
            "sizes": [],
            "milks": [],
            "tags": ["kuki-pack", "kukido"],
            "custom_fields": [],
            "visible": True,
        }
        url = f"{BASE}/rest/v1/kk_products?on_conflict=id"
        data = json.dumps(row).encode()
        req = urllib.request.Request(
            url,
            data=data,
            method="POST",
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=representation",
            },
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            print(f"Upserted {pack_id}:", resp.status)

    verified = rest(
        "GET",
        "kk_products?id=like.cookie_*&select=id,name,base_price,image,visible&order=name",
        key,
    )
    print("\nCookies:")
    print(json.dumps(verified, indent=2))


if __name__ == "__main__":
    main()
