"""Seed example pastry: Cookie Latte (featured iced latte)."""
from __future__ import annotations

import json
import pathlib
import re
import sys
import urllib.request
import uuid

ROOT = pathlib.Path(__file__).resolve().parent.parent
REF = "idwtlujcdfnnndxmlaco"
BASE = f"https://{REF}.supabase.co"
PASTRIES_CATEGORY_ID = "96542660-85f9-40b0-9a20-f2607c8f773c"
PRODUCT_ID = "c8f3a1b2-6d4e-4f9a-b7c2-8e1d0f9a3b4c"
IMAGE_PATH = ROOT / "image.png"


def load_service_key() -> str:
    text = (ROOT / ".env").read_text(encoding="utf-8")
    m = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text)
    if not m or not m.group(1).strip():
        print("ERR: SUPABASE_SERVICE_ROLE_KEY missing in .env", file=sys.stderr)
        sys.exit(1)
    return m.group(1).strip()


def rest(method: str, path: str, key: str, body: dict | None = None) -> list | dict:
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
    with urllib.request.urlopen(req, timeout=60) as resp:
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


def main() -> None:
    if not IMAGE_PATH.is_file():
        print(f"ERR: image not found at {IMAGE_PATH}", file=sys.stderr)
        sys.exit(1)

    key = load_service_key()
    image_bytes = IMAGE_PATH.read_bytes()
    storage_path = f"products/{PRODUCT_ID}.png"
    public_url = storage_upload(key, storage_path, image_bytes, "image/png")
    print(f"Uploaded image -> {public_url}")

    existing = rest(
        "GET",
        f"kk_products?category_id=eq.{PASTRIES_CATEGORY_ID}&select=id,sort_order",
        key,
    )
    sort_order = len(existing) if isinstance(existing, list) else 0

    row = {
        "id": PRODUCT_ID,
        "category_id": PASTRIES_CATEGORY_ID,
        "branch_id": None,
        "name": "Cookie Latte",
        "description": (
            "Iced Kado Latte layered with muscovado brûlée and cookie bits — "
            "topped with cold foam and cookie crumble."
        ),
        "base_price": 220,
        "image": public_url,
        "temperature": "both",
        "sizes": [],
        "milks": [],
        "tags": ["featured", "featured-drink"],
        "custom_fields": [],
        "visible": True,
        "in_stock": True,
        "sort_order": 0,
    }

    saved = rest("POST", "kk_products", key, row)
    if not saved:
        saved = rest("PATCH", f"kk_products?id=eq.{PRODUCT_ID}", key, row)
    print("Upserted product:", json.dumps(saved[0] if isinstance(saved, list) else saved, indent=2))

    verified = rest(
        "GET",
        (
            "kk_products?"
            f"id=eq.{PRODUCT_ID}"
            "&select=id,name,description,base_price,image,visible,in_stock,sort_order,"
            "category_id,kk_menu_categories(name)"
        ),
        key,
    )
    print("\nQuery result:")
    print(json.dumps(verified, indent=2))

    head = urllib.request.Request(public_url, method="HEAD")
    with urllib.request.urlopen(head, timeout=30) as resp:
        print(f"\nPublic image HTTP {resp.status}")


if __name__ == "__main__":
    main()
