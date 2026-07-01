#!/usr/bin/env python3
"""Non-destructive smoke probe for admin CMS surfaces (landing, blog, careers, booth)."""

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

MARKER = "__probe_admin_cms__"


def load_env() -> tuple[str, str, str, str | None]:
    if not ENV.exists():
        raise SystemExit(".env not found")
    text = ENV.read_text(encoding="utf-8")
    url = re.search(r'VITE_SUPABASE_URL="([^"]+)"', text)
    anon = re.search(r'VITE_SUPABASE_ANON_KEY="([^"]+)"', text)
    service = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text)
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
    return url.group(1).rstrip("/"), anon.group(1), password, service.group(1) if service else None


def password_token(base_url: str, anon: str, email: str, password: str) -> str:
    body = json.dumps({"email": email, "password": password}).encode()
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
    body=None,
    *,
    prefer: str | None = None,
) -> tuple[int, object]:
    data = None if body is None else json.dumps(body).encode()
    headers = {
        "apikey": anon,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    req = urllib.request.Request(f"{base_url}/rest/v1/{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = raw
        return e.code, parsed


def check(label: str, ok: bool, detail: str = "") -> bool:
    status = "PASS" if ok else "FAIL"
    suffix = f" — {detail}" if detail else ""
    print(f"{status}  {label}{suffix}")
    return ok


def jsonb_roundtrip(
    base_url: str,
    anon: str,
    service: str,
    column: str,
    marker_key: str,
) -> bool:
    status, rows = rest(
        base_url,
        anon,
        service,
        "GET",
        f"kk_app_settings?select={column}&id=eq.true",
    )
    if status != 200 or not isinstance(rows, list) or not rows:
        return check(f"JSONB {column} read", False, f"HTTP {status}")
    payload = rows[0].get(column) or {}
    if not isinstance(payload, dict):
        payload = {}
    patched = {**payload, marker_key: MARKER}
    status, _ = rest(
        base_url,
        anon,
        service,
        "PATCH",
        "kk_app_settings?id=eq.true",
        {column: patched},
        prefer="return=minimal",
    )
    if status not in (200, 204):
        return check(f"JSONB {column} write", False, f"HTTP {status}")
    status, rows = rest(
        base_url,
        anon,
        service,
        "GET",
        f"kk_app_settings?select={column}&id=eq.true",
    )
    got = (rows[0].get(column) or {}).get(marker_key) if isinstance(rows, list) and rows else None
    if got != MARKER:
        return check(f"JSONB {column} round-trip", False, f"got {got!r}")
    rest(
        base_url,
        anon,
        service,
        "PATCH",
        "kk_app_settings?id=eq.true",
        {column: payload},
        prefer="return=minimal",
    )
    return check(f"JSONB {column} round-trip", True)


def main() -> int:
    base_url, anon, password, service = load_env()
    if not service:
        print("WARN: SUPABASE_SERVICE_ROLE_KEY missing — JSONB probes need service role", file=sys.stderr)
        return 1

    admin_token = password_token(base_url, anon, "admin@kadokohi.com", password)
    staff_token = password_token(base_url, anon, "staff@kadokohi.com", password)

    results: list[bool] = []

    status, posts = rest(base_url, anon, admin_token, "GET", "kk_blog_posts?select=id,slug&limit=1")
    results.append(check("BLOG admin read", status == 200 and isinstance(posts, list)))

    probe_slug = "probe-admin-cms-e2e"
    probe_id = "00000000-0000-4000-8000-0000000000c5"
    blog_row = {
        "id": probe_id,
        "slug": probe_slug,
        "title": MARKER,
        "excerpt": "probe",
        "category": "Probe",
        "published_at": "2026-01-01T00:00:00Z",
        "read_minutes": 1,
        "image_url": None,
        "image_alt": "",
        "body": ["probe"],
        "visible": False,
        "sort_order": 9999,
    }
    status, _ = rest(
        base_url,
        anon,
        admin_token,
        "POST",
        "kk_blog_posts",
        blog_row,
        prefer="return=minimal",
    )
    results.append(check("BLOG admin upsert", status in (200, 201, 204), f"HTTP {status}"))

    status, _ = rest(
        base_url,
        anon,
        staff_token,
        "POST",
        "kk_blog_posts",
        {**blog_row, "id": "00000000-0000-4000-8000-0000000000c6", "slug": "probe-staff-denied"},
        prefer="return=minimal",
    )
    results.append(check("BLOG staff write denied", status in (401, 403), f"HTTP {status}"))

    status, _ = rest(base_url, anon, admin_token, "DELETE", f"kk_blog_posts?id=eq.{probe_id}")
    results.append(check("BLOG admin delete probe row", status in (200, 204), f"HTTP {status}"))

    results.append(jsonb_roundtrip(base_url, anon, service, "careers_content", "probeMarker"))
    results.append(jsonb_roundtrip(base_url, anon, service, "booth_content", "probeMarker"))
    results.append(jsonb_roundtrip(base_url, anon, service, "landing_content", "probeMarker"))
    results.append(jsonb_roundtrip(base_url, anon, service, "pastries_content", "probeMarker"))

    passed = sum(1 for r in results if r)
    total = len(results)
    print(f"\n{passed}/{total} CMS checks passed.")
    return 0 if passed == total else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()}", file=sys.stderr)
        raise SystemExit(1) from e
