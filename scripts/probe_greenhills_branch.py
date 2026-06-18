#!/usr/bin/env python3
"""Smoke-test Greenhills branch: public reads + kk_place_order for dine-in, takeout, online."""

from __future__ import annotations

import json
import os
import sys
import uuid
import urllib.error
import urllib.request

SUPABASE_URL = os.environ.get(
    "VITE_SUPABASE_URL", "https://idwtlujcdfnnndxmlaco.supabase.co"
).rstrip("/")
ANON_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY") or os.environ.get(
    "SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkd3RsdWpjZGZubm5keG1sYWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMDcwMDYsImV4cCI6MjA5NTY4MzAwNn0.wV6gpTlZn9VZUIbPhLLdqHDJqNsqmzwdndhLyKhvWys",
)

BRANCH_ID = "branch_greenhills"
TABLE_ID = "tbl_gh_01"
TABLE_CODE = "gre-t01"
PRODUCT_ID = "prod_matcha_oat"


def api(method: str, path: str, body: dict | None = None) -> tuple[int, object]:
    url = f"{SUPABASE_URL}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
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
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = raw
        return e.code, parsed


def rest_get(table: str, query: str) -> list:
    status, data = api("GET", f"/rest/v1/{table}?{query}")
    if status != 200:
        raise RuntimeError(f"GET {table} failed ({status}): {data}")
    return data or []


def rpc(name: str, args: dict) -> object:
    status, data = api("POST", f"/rest/v1/rpc/{name}", args)
    if status not in (200, 201):
        raise RuntimeError(f"RPC {name} failed ({status}): {data}")
    return data


def item_line() -> dict:
    return {
        "id": str(uuid.uuid4()),
        "product_id": PRODUCT_ID,
        "product_name_snapshot": "Matcha Oat Latte",
        "item_type": "coffee",
        "qty": 1,
    }


def place(channel: str, *, table_id: str | None = None, guest_name: str | None = None) -> dict:
    payload = {
        "id": str(uuid.uuid4()),
        "channel": channel,
        "branch_id": BRANCH_ID,
        "table_id": table_id,
        "guest_name": guest_name,
        "payment_method": "gcash-qr",
        "payment_status": "unpaid",
        "status": "pending",
        "items": [item_line()],
    }
    return rpc("kk_place_order", {"payload": payload})


def main() -> int:
    failures: list[str] = []

    branches = rest_get("kk_branches", "select=id,slug,status&slug=eq.greenhills")
    if not branches:
        failures.append("Greenhills branch not found in kk_branches")
    elif branches[0].get("status") != "active":
        failures.append(f"Greenhills status is {branches[0].get('status')}, expected active")
    else:
        print("OK branch:", branches[0])

    tables = rest_get(
        "kk_tables",
        f"select=id,code,branch_id,active&code=eq.{TABLE_CODE}",
    )
    if not tables:
        failures.append(f"Table {TABLE_CODE} not found")
    elif tables[0].get("branch_id") != BRANCH_ID:
        failures.append("Table branch_id mismatch")
    else:
        print("OK table:", tables[0])

    scenarios = [
        ("dine-in", lambda: place("dine-in", table_id=TABLE_ID)),
        ("takeout", lambda: place("takeout", guest_name="Greenhills Test Guest")),
        ("online", lambda: place("online", guest_name="Greenhills Online Test")),
    ]

    for label, fn in scenarios:
        try:
            result = fn()
            order_id = result.get("id") if isinstance(result, dict) else None
            short = result.get("short_code") if isinstance(result, dict) else None
            print(f"OK order {label}:", short or order_id, result)
            if order_id:
                tracked = rpc("kk_track_order", {"order_id": order_id})
                print(f"  track {label}:", tracked)
        except Exception as exc:  # noqa: BLE001
            failures.append(f"{label}: {exc}")

    if failures:
        print("\nFAILED:")
        for f in failures:
            print(" -", f)
        return 1

    print("\nAll Greenhills branch checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
