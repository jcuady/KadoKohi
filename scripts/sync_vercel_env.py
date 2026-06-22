#!/usr/bin/env python3
"""Sync browser env vars from .env to Vercel project kado-kohi (production + preview)."""

from __future__ import annotations

import json
import pathlib
import re
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
TEAM_ID = "team_UeTymJ8OjbtqBq9pp8FIc6MS"
PROJECT_ID = "prj_QIHWnmD8YjzHakeEfm75lkZmd6xA"

VERCEL_KEYS = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_ANON_KEY",
    "VITE_SITE_URL",
    "VITE_CLERK_PUBLISHABLE_KEY",
    "VITE_VAPID_PUBLIC_KEY",
]


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


def vercel_token() -> str:
    token = load_env().get("VERCEL_TOKEN", "").strip()
    if token:
        return token
    auth_path = pathlib.Path.home() / ".vercel" / "auth.json"
    if auth_path.is_file():
        data = json.loads(auth_path.read_text(encoding="utf-8"))
        if isinstance(data, dict) and data.get("token"):
            return str(data["token"])
    print("Set VERCEL_TOKEN in .env or run `vercel login`", file=sys.stderr)
    sys.exit(1)


def api(method: str, path: str, body: object | None = None) -> object:
    token = vercel_token()
    url = f"https://api.vercel.com{path}"
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read().decode()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code} {e.read().decode()[:500]}", file=sys.stderr)
        raise


def list_env() -> list[dict]:
    res = api("GET", f"/v9/projects/{PROJECT_ID}/env?teamId={TEAM_ID}")
    return res.get("envs", []) if isinstance(res, dict) else []


def upsert_env(key: str, value: str, targets: list[str]) -> None:
    existing = [e for e in list_env() if e.get("key") == key]
    body = {
        "key": key,
        "value": value,
        "type": "encrypted",
        "target": targets,
    }
    if existing:
        env_id = existing[0]["id"]
        api("PATCH", f"/v9/projects/{PROJECT_ID}/env/{env_id}?teamId={TEAM_ID}", body)
        print(f"  updated {key}")
    else:
        api("POST", f"/v10/projects/{PROJECT_ID}/env?teamId={TEAM_ID}", body)
        print(f"  added {key}")


def main() -> int:
    env = load_env()
    missing = [k for k in VERCEL_KEYS if k not in ("VITE_SUPABASE_ANON_KEY", "VITE_VAPID_PUBLIC_KEY") and not env.get(k)]
    if missing:
        print(f"Missing in .env: {', '.join(missing)}", file=sys.stderr)
        return 1

    clerk = env.get("VITE_CLERK_PUBLISHABLE_KEY", "")
    if clerk.startswith("pk_test_"):
        print("WARN: VITE_CLERK_PUBLISHABLE_KEY is pk_test_ — use pk_live_ for Production Clerk instance", file=sys.stderr)
    elif not clerk.startswith("pk_live_"):
        print("WARN: VITE_CLERK_PUBLISHABLE_KEY does not look like a Clerk publishable key", file=sys.stderr)

    print(f"Syncing {len(VERCEL_KEYS)} vars to Vercel project kado-kohi …")
    targets = ["production", "preview"]
    for key in VERCEL_KEYS:
        val = env.get(key, "").strip()
        if not val and key in ("VITE_SUPABASE_ANON_KEY", "VITE_VAPID_PUBLIC_KEY"):
            continue
        if not val:
            print(f"  skip {key} (empty)")
            continue
        upsert_env(key, val, targets)

    upsert_env("VITE_SITE_URL", "https://www.kadokohi.com", targets)
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
