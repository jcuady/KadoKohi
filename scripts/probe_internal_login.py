#!/usr/bin/env python3
"""Probe kk-internal-login edge function (email + password, no verification code)."""

from __future__ import annotations

import json
import pathlib
import re
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
PROJECT_REF = "idwtlujcdfnnndxmlaco"


def load_env() -> dict[str, str]:
    out: dict[str, str] = {}
    path = ROOT / ".env"
    if path.is_file():
        for line in path.read_text(encoding="utf-8").splitlines():
            m = re.match(r'^([A-Z0-9_]+)="([^"]*)"\s*$', line.strip())
            if m:
                out[m.group(1)] = m.group(2)
    return out


def main() -> int:
    env = load_env()
    anon = env.get("VITE_SUPABASE_PUBLISHABLE_KEY", "").strip()
    if not anon:
        print("VITE_SUPABASE_PUBLISHABLE_KEY missing in .env")
        return 1

    url = f"https://{PROJECT_REF}.supabase.co/functions/v1/kk-internal-login"
    body = {
        "email": "admin@kadokohi.com",
        "password": "KadoKohi2026!",
        "expectedRole": "admin",
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={
            "Content-Type": "application/json",
            "apikey": anon,
            "Authorization": f"Bearer {anon}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as r:
            data = json.loads(r.read().decode())
        if data.get("ticket"):
            print("OK — ticket returned (no verification code step)")
            return 0
        print("Unexpected response:", data)
        return 1
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print("HTTP", e.code, body[:600])
        return 1


if __name__ == "__main__":
    sys.exit(main())
