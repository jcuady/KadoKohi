"""
End-to-end probe: admin upload + URL persist on idwtlujcdfnnndxmlaco.
Uses service role to verify kk_products.image round-trip (admin UI uses same storage + upsert).
"""
from __future__ import annotations

import base64
import json
import pathlib
import re
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
REF = "idwtlujcdfnnndxmlaco"
BASE = f"https://{REF}.supabase.co"
PROBE_ID = "_probe_menu_image_flow"
TEST_URL = (
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93"
    "?q=80&w=120&auto=format&fit=crop"
)
TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


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
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read()
        return json.loads(raw) if raw else []


def storage_upload(key: str, path: str, body: bytes) -> str:
    url = f"{BASE}/storage/v1/object/kado-menu-images/{path}"
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {key}",
            "apikey": key,
            "Content-Type": "image/png",
            "x-upsert": "true",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        json.loads(resp.read())
    return f"{BASE}/storage/v1/object/public/kado-menu-images/{path}"


def ensure_probe_row(key: str, category_id: str) -> None:
    rows = rest("GET", f"kk_products?id=eq.{PROBE_ID}&select=id", key)
    if rows:
        return
    rest(
        "POST",
        "kk_products",
        key,
        {
            "id": PROBE_ID,
            "category_id": category_id,
            "name": "Probe Menu Image",
            "base_price": 1,
            "temperature": "both",
            "visible": False,
            "in_stock": True,
            "sort_order": 9999,
            "sizes": [],
            "milks": [],
            "tags": [],
            "custom_fields": [],
        },
    )


def main() -> None:
    key = load_service_key()
    cats = rest("GET", "kk_menu_categories?select=id&limit=1", key)
    if not cats:
        print("ERR: no categories", file=sys.stderr)
        sys.exit(1)
    category_id = cats[0]["id"]
    ensure_probe_row(key, category_id)

    print("[1] URL path — patch kk_products.image with external link")
    updated = rest("PATCH", f"kk_products?id=eq.{PROBE_ID}", key, {"image": TEST_URL})
    image = updated[0]["image"] if updated else None
    if image != TEST_URL:
        print(f"ERR: URL persist failed: {image}", file=sys.stderr)
        sys.exit(1)
    print(f"  OK image={image[:60]}…")

    print("[2] Upload path — storage upload + patch kk_products.image")
    public_url = storage_upload(key, f"products/{PROBE_ID}.png", TINY_PNG)
    updated = rest("PATCH", f"kk_products?id=eq.{PROBE_ID}", key, {"image": public_url})
    image = updated[0]["image"] if updated else None
    if not image or "kado-menu-images" not in image:
        print(f"ERR: upload persist failed: {image}", file=sys.stderr)
        sys.exit(1)
    print(f"  OK image={image}")

    head = urllib.request.Request(image, method="HEAD")
    with urllib.request.urlopen(head, timeout=15) as resp:
        if resp.status != 200:
            print(f"ERR: public image HEAD {resp.status}", file=sys.stderr)
            sys.exit(1)
    print("  OK public image HTTP 200")

    print("[3] Clear path — image null")
    rest("PATCH", f"kk_products?id=eq.{PROBE_ID}", key, {"image": None})
    cleared = rest("GET", f"kk_products?id=eq.{PROBE_ID}&select=image", key)
    if cleared[0].get("image") is not None:
        print(f"ERR: clear failed: {cleared}", file=sys.stderr)
        sys.exit(1)
    print("  OK image cleared")

    print("\nOK: URL, upload, and clear paths verified on", REF)


if __name__ == "__main__":
    main()
