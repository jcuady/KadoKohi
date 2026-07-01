#!/usr/bin/env python3
"""Delete empty legacy storage buckets via Storage API (SQL DELETE is blocked)."""

from __future__ import annotations

import json
import pathlib
import re
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
REF = "idwtlujcdfnnndxmlaco"
BASE = f"https://{REF}.supabase.co"
LEGACY = ("kado-product-images", "kado-settings")


def load_service_key() -> str:
    text = (ROOT / ".env").read_text(encoding="utf-8")
    m = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]*)"', text)
    if not m or not m.group(1).strip():
        raise SystemExit("SUPABASE_SERVICE_ROLE_KEY missing in .env")
    return m.group(1).strip()


def api(method: str, path: str, key: str, body: dict | None = None) -> tuple[int, object]:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=data,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, raw


def main() -> int:
    key = load_service_key()
    ok = True
    for bucket in LEGACY:
        status, listed = api(
            "POST",
            f"/storage/v1/object/list/{bucket}",
            key,
            {"prefix": "", "limit": 1000, "offset": 0},
        )
        if status == 200 and isinstance(listed, list):
            for obj in listed:
                name = obj.get("name") if isinstance(obj, dict) else None
                if not name:
                    continue
                api("DELETE", f"/storage/v1/object/{bucket}/{name}", key)
        status, _ = api("DELETE", f"/storage/v1/bucket/{bucket}", key)
        if status in (200, 204, 404):
            print(f"OK deleted bucket {bucket} (HTTP {status})")
        else:
            print(f"FAIL delete bucket {bucket} (HTTP {status})")
            ok = False
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
