#!/usr/bin/env python3
"""Probe Supabase REST/auth with keys from .env (no secrets printed)."""
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
env = (ROOT / ".env").read_text(encoding="utf-8")


def env_var(name: str) -> str:
    m = re.search(rf'^{name}="?([^"\n]+)"?', env, re.M)
    return (m.group(1) if m else "").strip()


def probe(label: str, key: str, url: str) -> None:
    if not key:
        print(f"{label}: (empty)")
        return
    print(f"{label}: prefix={key[:12]}… len={len(key)}")
    for cols in ("landing_content", "booth_content"):
        rest = f"{url}/rest/v1/kk_app_settings?select={cols}&id=eq.true"
        req = urllib.request.Request(
            rest,
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                body = r.read().decode()
                print(f"  REST {cols} {r.status}: {body[:160]}")
        except urllib.error.HTTPError as e:
            print(f"  REST {cols} {e.code}: {e.read().decode()[:200]}")
        except Exception as e:
            print(f"  REST {cols} {type(e).__name__}: {e}")

    auth_url = f"{url}/auth/v1/token?grant_type=password"
    body = json.dumps({"email": "probe@test.com", "password": "wrong"}).encode()
    req = urllib.request.Request(
        auth_url,
        data=body,
        headers={"apikey": key, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            print(f"  AUTH {r.status}")
    except urllib.error.HTTPError as e:
        print(f"  AUTH {e.code}: {e.read().decode()[:200]}")
    except Exception as e:
        print(f"  AUTH {type(e).__name__}: {e}")


def main() -> int:
    url = env_var("VITE_SUPABASE_URL")
    if not url:
        print("ERR: VITE_SUPABASE_URL missing", file=sys.stderr)
        return 1
    print(f"URL: {url}")
    probe("publishable", env_var("VITE_SUPABASE_PUBLISHABLE_KEY"), url)
    probe("anon", env_var("VITE_SUPABASE_ANON_KEY"), url)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
