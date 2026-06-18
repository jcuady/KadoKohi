#!/usr/bin/env python3
"""Admin-authenticated CRUD smoke test for kk_branches (+ seeded tables)."""

from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV = ROOT / ".env"
HELPERS = ROOT / "e2e" / "helpers.ts"

TEST_BRANCH_ID = "branch_crud_probe"
TEST_SLUG = "crud-probe"
TEST_SLUG_UPDATED = "crud-probe-upd"


def load_env() -> tuple[str, str, str]:
    if not ENV.exists():
        raise SystemExit(".env not found — needed for Supabase URL and anon key")
    text = ENV.read_text(encoding="utf-8")
    url = re.search(r'VITE_SUPABASE_URL="([^"]+)"', text)
    anon = re.search(r'VITE_SUPABASE_ANON_KEY="([^"]+)"', text)
    if not url or not anon:
        raise SystemExit("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing in .env")
    password = "KadoKohi2026!"
    if HELPERS.exists():
        helpers_text = HELPERS.read_text(encoding="utf-8")
        pwd_match = re.search(
            r"admin:\s*\{[^}]*password:\s*['\"]([^'\"]+)['\"]",
            helpers_text,
        )
        if pwd_match:
            password = pwd_match.group(1)
    return url.group(1).rstrip("/"), anon.group(1), password


def admin_token(base_url: str, anon: str, password: str) -> str:
    body = json.dumps({"email": "admin@kadokohi.com", "password": password}).encode()
    req = urllib.request.Request(
        f"{base_url}/auth/v1/token?grant_type=password",
        data=body,
        headers={"apikey": anon, "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())["access_token"]


def rest(
    base_url: str,
    anon: str,
    token: str,
    method: str,
    path: str,
    body: dict | list | None = None,
) -> tuple[int, object]:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        f"{base_url}/rest/v1{path}",
        data=data,
        headers={
            "apikey": anon,
            "Authorization": f"Bearer {token}",
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


def cleanup(base_url: str, anon: str, token: str) -> None:
    rest(base_url, anon, token, "DELETE", f"/kk_tables?branch_id=eq.{TEST_BRANCH_ID}")
    rest(base_url, anon, token, "DELETE", f"/kk_branches?id=eq.{TEST_BRANCH_ID}")


def main() -> int:
    base_url, anon, password = load_env()
    token = admin_token(base_url, anon, password)
    failures: list[str] = []

    cleanup(base_url, anon, token)

    create_body = {
        "id": TEST_BRANCH_ID,
        "slug": TEST_SLUG,
        "name": "CRUD Probe Branch",
        "address": "Probe St",
        "city": "Test City",
        "status": "active",
        "hours": [],
    }
    status, created = rest(base_url, anon, token, "POST", "/kk_branches", create_body)
    if status not in (200, 201) or not created:
        failures.append(f"CREATE branch failed ({status}): {created}")
    else:
        print("OK CREATE:", created[0] if isinstance(created, list) else created)

    status, rows = rest(
        base_url,
        anon,
        token,
        "GET",
        f"/kk_branches?select=id,slug,status&id=eq.{TEST_BRANCH_ID}",
    )
    if status != 200 or not rows:
        failures.append(f"READ branch failed ({status}): {rows}")
    else:
        print("OK READ:", rows[0])

    status, updated = rest(
        base_url,
        anon,
        token,
        "PATCH",
        f"/kk_branches?id=eq.{TEST_BRANCH_ID}",
        {"name": "CRUD Probe Branch Updated", "slug": TEST_SLUG_UPDATED, "city": "Updated City"},
    )
    if status != 200 or not updated:
        failures.append(f"UPDATE branch failed ({status}): {updated}")
    else:
        row = updated[0] if isinstance(updated, list) else updated
        print("OK UPDATE:", row)
        if row.get("slug") != TEST_SLUG_UPDATED:
            failures.append("UPDATE slug mismatch")

    table_body = {
        "id": "tbl_crud_probe_01",
        "branch_id": TEST_BRANCH_ID,
        "code": "cru-t01",
        "label": "Probe Table 1",
        "qr_payload": "https://www.kadokohi.com/order/qr/cru-t01",
        "active": True,
    }
    status, table = rest(base_url, anon, token, "POST", "/kk_tables", table_body)
    if status not in (200, 201):
        failures.append(f"CREATE table failed ({status}): {table}")
    else:
        print("OK CREATE table:", table)

    status, tables = rest(
        base_url,
        anon,
        token,
        "GET",
        f"/kk_tables?select=id,code&branch_id=eq.{TEST_BRANCH_ID}",
    )
    if status != 200 or not tables:
        failures.append(f"READ tables failed ({status}): {tables}")
    else:
        print("OK READ tables:", tables)

    status, deleted_tables = rest(
        base_url,
        anon,
        token,
        "DELETE",
        f"/kk_tables?branch_id=eq.{TEST_BRANCH_ID}",
    )
    if status not in (200, 204):
        failures.append(f"DELETE tables failed ({status}): {deleted_tables}")
    else:
        print("OK DELETE tables")

    status, deleted = rest(
        base_url,
        anon,
        token,
        "DELETE",
        f"/kk_branches?id=eq.{TEST_BRANCH_ID}",
    )
    if status not in (200, 204):
        failures.append(f"DELETE branch failed ({status}): {deleted}")
    else:
        print("OK DELETE branch")

    status, gone = rest(
        base_url,
        anon,
        token,
        "GET",
        f"/kk_branches?select=id&id=eq.{TEST_BRANCH_ID}",
    )
    if status == 200 and gone:
        failures.append("Branch still exists after delete")
    else:
        print("OK VERIFY deleted")

    if failures:
        print("\nFAILED:")
        for f in failures:
            print(" -", f)
        cleanup(base_url, anon, token)
        return 1

    print("\nAll branch CRUD checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
