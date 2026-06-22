#!/usr/bin/env python3
"""Set team_password_hash for existing internal accounts (one-time after migration 0068)."""

from __future__ import annotations

import json
import pathlib
import re
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
PROJECT_REF = "idwtlujcdfnnndxmlaco"

INTERNAL_EMAILS = [
    "admin@kadokohi.com",
    "barista@kadokohi.com",
    "staff.flow.8facde69@kadokohi.com",
]

DEFAULT_PASSWORD = "KadoKohi2026!"


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
    try:
        import bcrypt  # type: ignore
    except ImportError:
        print("pip install bcrypt")
        return 1

    env = load_env()
    service = env.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not service:
        print("SUPABASE_SERVICE_ROLE_KEY missing in .env")
        return 1

    password = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_PASSWORD
    team_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=10)).decode()

    for email in INTERNAL_EMAILS:
        url = (
            f"https://{PROJECT_REF}.supabase.co/rest/v1/kk_profiles"
            f"?email=eq.{urllib.parse.quote(email)}"
        )
        body = json.dumps({"team_password_hash": team_hash}).encode()
        req = urllib.request.Request(
            url,
            data=body,
            headers={
                "apikey": service,
                "Authorization": f"Bearer {service}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
            method="PATCH",
        )
        try:
            with urllib.request.urlopen(req) as r:
                print(f"  OK {email} (HTTP {r.status})")
        except urllib.error.HTTPError as e:
            print(f"  FAIL {email} HTTP {e.code} {e.read().decode()[:200]}")
            return 1

    print(f"\nBackfilled team_password_hash for {len(INTERNAL_EMAILS)} accounts.")
    return 0


if __name__ == "__main__":
    import urllib.parse

    sys.exit(main())
