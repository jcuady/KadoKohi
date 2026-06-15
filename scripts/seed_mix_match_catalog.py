"""
Seed full Kukidō Mix & Match catalog on production.
- Removes stale pastry rows
- Inserts 6 poster cookies + Kado Kukilatte with prices
- Tags mix-match drinks
- Uploads images from Mix&Match/
"""
from __future__ import annotations

import json
import mimetypes
import pathlib
import re
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ROOT / "Mix&Match"
REF = "idwtlujcdfnnndxmlaco"
BASE = f"https://{REF}.supabase.co"
PASTRIES_CATEGORY_ID = "96542660-85f9-40b0-9a20-f2607c8f773c"

KUKILATTE_ID = "c8f3a1b2-6d4e-4f9a-b7c2-8e1d0f9a3b4c"

COOKIES = [
    ("b1000001-0001-4000-8000-000000000001", "Klassic Kuki", 98, 10),
    ("b1000001-0001-4000-8000-000000000002", "Campfire", 108, 11),
    ("b1000001-0001-4000-8000-000000000003", "Double Dark", 118, 12),
    ("b1000001-0001-4000-8000-000000000004", "Birthday Bake", 118, 13),
    ("b1000001-0001-4000-8000-000000000005", "Blondie", 105, 14),
    ("b1000001-0001-4000-8000-000000000006", "White Chocolate Walnut", 115, 15),
]

MIX_MATCH_DRINKS = [
    "prod_kado_latte",
    "prod_ube_shio",
    "prod_nori_salted",
    "prod_yuzu_amerikado",
    "prod_matcha_oat",
    "prod_matcha_straw",
    "prod_hojicha_oat",
]

STALE_PASTRY_IDS = [
    "d4e5f6a7-8b9c-4d0e-1f2a-3b4c5d6e7f80",  # Red Velvet Cookie
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
    with urllib.request.urlopen(req, timeout=120) as resp:
        raw = resp.read()
        return json.loads(raw) if raw else []


def storage_upload(key: str, path: str, body: bytes, content_type: str) -> str:
    url = f"{BASE}/storage/v1/object/kado-menu-images/{path}"
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {key}",
            "apikey": key,
            "Content-Type": content_type,
            "x-upsert": "true",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        json.loads(resp.read())
    return f"{BASE}/storage/v1/object/public/kado-menu-images/{path}"


def upsert_product(key: str, row: dict) -> None:
    pid = row["id"]
    try:
        rest("POST", "kk_products", key, row)
    except urllib.error.HTTPError as err:
        if err.code == 409:
            rest("PATCH", f"kk_products?id=eq.{pid}", key, row)
        else:
            raise


def upload_file(key: str, product_id: str, file_path: pathlib.Path) -> str:
    content_type = mimetypes.guess_type(file_path.name)[0] or "image/jpeg"
    ext = file_path.suffix.lower().lstrip(".") or "jpg"
    safe_ext = ext if ext in {"png", "jpg", "jpeg", "webp"} else "jpg"
    return storage_upload(key, f"products/{product_id}.{safe_ext}", file_path.read_bytes(), content_type)


def main() -> None:
    key = load_service_key()

    for stale_id in STALE_PASTRY_IDS:
        rest("DELETE", f"kk_products?id=eq.{stale_id}", key)
        print(f"Deleted stale product {stale_id}")

    cookie_image = ASSETS / "kukido2.jpg"
    kukilatte_image = ASSETS / "image.png"
    if not kukilatte_image.is_file():
        kukilatte_image = ROOT / "image.png"

    kukilatte_url = upload_file(key, KUKILATTE_ID, kukilatte_image)
    print(f"Kukilatte image -> {kukilatte_url}")

    kukilatte_row = {
        "id": KUKILATTE_ID,
        "category_id": PASTRIES_CATEGORY_ID,
        "name": "Kado Kukilatte",
        "description": (
            "Kukidō x Kado Kohi takeover exclusive. Iced Kado Latte layered with muscovado brûlée "
            "and Klassic cookie bits — topped with cold foam and Kukidō handcrafted cookie crumble. "
            "Layers: Kado Latte · Muscovado Brûlée · Klassic Cookie Bits."
        ),
        "base_price": 220,
        "image": kukilatte_url,
        "temperature": "both",
        "sizes": [],
        "milks": [],
        "tags": ["collab", "takeover", "exclusive", "kukilatte", "featured"],
        "custom_fields": [],
        "visible": True,
        "in_stock": True,
        "sort_order": 0,
    }
    upsert_product(key, kukilatte_row)
    print("Upserted Kado Kukilatte")

    cookie_img_url = None
    if cookie_image.is_file():
        cookie_img_url = upload_file(key, "mix-match-cookie-shared", cookie_image)

    for pid, name, price, order in COOKIES:
        row = {
            "id": pid,
            "category_id": PASTRIES_CATEGORY_ID,
            "name": name,
            "description": f"Kukidō handcrafted cookie — part of the Mix & Match bundle with any Kado Kohi drink.",
            "base_price": price,
            "image": cookie_img_url,
            "temperature": "both",
            "sizes": [],
            "milks": [],
            "tags": ["mix-match", "cookie"],
            "custom_fields": [],
            "visible": True,
            "in_stock": True,
            "sort_order": order,
        }
        upsert_product(key, row)
        print(f"Upserted cookie: {name} @ {price}")

    for drink_id in MIX_MATCH_DRINKS:
        rows = rest("GET", f"kk_products?id=eq.{drink_id}&select=id,tags", key)
        if not rows:
            print(f"WARN: drink {drink_id} not found")
            continue
        tags = rows[0].get("tags") or []
        if "mix-match" not in tags:
            tags = [*tags, "mix-match"]
            rest("PATCH", f"kk_products?id=eq.{drink_id}", key, {"tags": tags})
            print(f"Tagged drink {drink_id}")

    verified = rest(
        "GET",
        (
            "kk_products?category_id=eq."
            f"{PASTRIES_CATEGORY_ID}"
            "&select=id,name,base_price,tags,sort_order,visible,in_stock,image"
            "&order=sort_order"
        ),
        key,
    )
    print("\nPastries catalog:")
    print(json.dumps(verified, indent=2))

    drinks = rest(
        "GET",
        "kk_products?tags=cs.%7Bmix-match%7D&select=id,name,base_price,tags&order=name",
        key,
    )
    print("\nMix-match drinks:")
    print(json.dumps(drinks, indent=2))


if __name__ == "__main__":
    main()
