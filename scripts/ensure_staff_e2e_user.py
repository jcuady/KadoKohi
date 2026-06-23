#!/usr/bin/env python3
"""Ensure staff@kadokohi.com exists for staff e2e (idempotent)."""

from __future__ import annotations

import json
import pathlib
import re
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
STAFF_EMAIL = "staff@kadokohi.com"
STAFF_PASSWORD = "KadoKohi2026!"
BRANCH_ID = "branch_marikina"


def load_env() -> dict[str, str]:
    out: dict[str, str] = {}
    path = ROOT / ".env"
    if not path.is_file():
        return out
    for line in path.read_text(encoding="utf-8").splitlines():
        m = re.match(r'^([A-Z0-9_]+)="([^"]*)"\s*$', line.strip())
        if m:
            out[m.group(1)] = m.group(2)
    return out


def post(url: str, headers: dict[str, str], body: dict) -> tuple[int, dict]:
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={**headers, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as res:
            raw = res.read().decode()
            return res.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            payload = json.loads(raw) if raw else {"error": raw}
        except json.JSONDecodeError:
            payload = {"error": raw}
        return e.code, payload


def main() -> int:
    env = load_env()
    base = env.get("VITE_SUPABASE_URL", "").rstrip("/")
    anon = env.get("VITE_SUPABASE_PUBLISHABLE_KEY") or env.get("VITE_SUPABASE_ANON_KEY", "")
    if not base or not anon:
        print("Missing VITE_SUPABASE_URL or anon key in .env", file=sys.stderr)
        return 1

    auth_headers = {"apikey": anon, "Authorization": f"Bearer {anon}"}
    status, staff_login = post(
        f"{base}/auth/v1/token?grant_type=password",
        auth_headers,
        {"email": STAFF_EMAIL, "password": STAFF_PASSWORD},
    )
    if status == 200 and staff_login.get("access_token"):
        print(f"OK — {STAFF_EMAIL} already signs in")
        return 0

    status, admin_login = post(
        f"{base}/auth/v1/token?grant_type=password",
        auth_headers,
        {"email": "admin@kadokohi.com", "password": STAFF_PASSWORD},
    )
    if status != 200 or not admin_login.get("access_token"):
        print("Admin login failed — cannot create staff test user", file=sys.stderr)
        print(admin_login, file=sys.stderr)
        return 1

    token = admin_login["access_token"]
    fn_headers = {"apikey": anon, "Authorization": f"Bearer {token}"}
    status, created = post(
        f"{base}/functions/v1/kk-admin-users",
        fn_headers,
        {
            "action": "create_user",
            "email": STAFF_EMAIL,
            "password": STAFF_PASSWORD,
            "name": "E2E Staff",
            "role": "staff",
            "branchId": BRANCH_ID,
        },
    )
    if status in (200, 201):
        print(f"Created {STAFF_EMAIL}")
        return 0
    if "already" in json.dumps(created).lower():
        print(f"Staff user exists but password may differ: {created}")
        return 1
    print(f"Create staff failed ({status}): {created}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
