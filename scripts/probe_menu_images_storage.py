"""Probe kado-menu-images bucket on production idwtlujcdfnnndxmlaco."""
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

# 1x1 PNG
TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


def load_env() -> dict[str, str]:
    env_path = ROOT / ".env"
    if not env_path.exists():
        print("ERR: .env not found", file=sys.stderr)
        sys.exit(1)
    text = env_path.read_text(encoding="utf-8")
    out: dict[str, str] = {}
    for key in ("SUPABASE_SERVICE_ROLE_KEY", "VITE_SUPABASE_ANON_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY"):
        m = re.search(rf'{key}="([^"]*)"', text)
        if m and m.group(1).strip():
            out[key] = m.group(1).strip()
    return out


def anon_key(env: dict[str, str]) -> str:
    return env.get("VITE_SUPABASE_ANON_KEY") or env.get("VITE_SUPABASE_PUBLISHABLE_KEY", "")


def admin_access_token(api_key: str) -> str:
    """E2E seed admin — same as e2e/helpers.ts CREDS.admin."""
    url = f"{BASE}/auth/v1/token?grant_type=password"
    body = json.dumps({"email": "admin@kadokohi.com", "password": "KadoKohi2026!"}).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "apikey": api_key,
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    token = data.get("access_token")
    if not token:
        raise RuntimeError(f"Admin sign-in failed: {data}")
    return token


def storage_upload(token: str, api_key: str, path: str, body: bytes, content_type: str) -> dict:
    url = f"{BASE}/storage/v1/object/kado-menu-images/{path}"
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "apikey": api_key,
            "Content-Type": content_type,
            "x-upsert": "true",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def public_head(url: str) -> int:
    req = urllib.request.Request(url, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code


def main() -> None:
    env = load_env()
    key = anon_key(env)
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY")

    if service_key:
        path = "products/_probe_menu_image.png"
        print(f"[service_role] Uploading probe image to {REF} …")
        result = storage_upload(service_key, service_key, path, TINY_PNG, "image/png")
        print(f"  upload: {result}")
        public_url = f"{BASE}/storage/v1/object/public/kado-menu-images/{path}"
        status = public_head(public_url)
        print(f"  public HEAD: HTTP {status}")
        if status != 200:
            print("ERR: public read failed", file=sys.stderr)
            sys.exit(1)
    else:
        print("SKIP service_role test: SUPABASE_SERVICE_ROLE_KEY not in .env")

    if not key:
        print("SKIP admin RLS test: no anon/publishable key in .env")
        return

    print(f"[admin JWT] Sign in + upload (RLS policy) …")
    admin_token = admin_access_token(key)
    admin_path = "products/_probe_admin_rls.png"
    result = storage_upload(admin_token, key, admin_path, TINY_PNG, "image/png")
    print(f"  upload: {result}")
    admin_public = f"{BASE}/storage/v1/object/public/kado-menu-images/{admin_path}"
    status = public_head(admin_public)
    print(f"  public HEAD: HTTP {status}")
    if status != 200:
        print("ERR: admin upload or public read failed", file=sys.stderr)
        sys.exit(1)
    print("OK: admin RLS upload + public read verified")


if __name__ == "__main__":
    main()
