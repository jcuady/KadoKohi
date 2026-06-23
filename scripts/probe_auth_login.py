#!/usr/bin/env python3
"""Probe Supabase password grant for test accounts."""
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
env: dict[str, str] = {}
for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
    m = re.match(r"^([A-Z0-9_]+)=(.*)$", line.strip())
    if m:
        val = m.group(2).strip().strip('"').strip("'")
        env[m.group(1)] = val

url = env["VITE_SUPABASE_URL"] + "/auth/v1/token?grant_type=password"
key = env["VITE_SUPABASE_ANON_KEY"]
accounts = [
    ("admin@kadokohi.com", "KadoKohi2026!"),
    ("barista@kadokohi.com", "KadoKohi2026!"),
    ("customer@kadokohi.com", "KadoKohi2026!"),
]

for email, password in accounts:
    body = json.dumps({"email": email, "password": password}).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={"apikey": key, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as r:
            data = json.loads(r.read())
            print(f"{email}: OK (token {data.get('access_token', '')[:16]}...)")
    except urllib.error.HTTPError as e:
        print(f"{email}: FAIL {e.code} {e.read().decode()[:400]}")
