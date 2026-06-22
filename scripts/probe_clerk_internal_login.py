#!/usr/bin/env python3
"""Verify Clerk internal accounts exist and kk-admin-users is deployed."""

from __future__ import annotations

import json
import pathlib
import re
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
PROJECT_REF = "idwtlujcdfnnndxmlaco"

INTERNAL = [
    ("admin", "admin@kadokohi.com", "user_3FUFCh4jJsEMiPM5g3ukXsVgYdN"),
    ("barista", "barista@kadokohi.com", "user_3FUFBWJ5u2g0dFU9dnQO4VINUxp"),
    ("staff", "staff.flow.8facde69@kadokohi.com", "user_3FUFB94mJ5GaCjdxT050MZFCMDi"),
]


def load_env() -> dict[str, str]:
    out: dict[str, str] = {}
    path = ROOT / ".env"
    if path.is_file():
        for line in path.read_text(encoding="utf-8").splitlines():
            m = re.match(r'^([A-Z0-9_]+)="([^"]*)"\s*$', line.strip())
            if m:
                out[m.group(1)] = m.group(2)
    return out


def clerk_get(secret: str, path: str) -> dict:
    req = urllib.request.Request(
        f"https://api.clerk.com/v1{path}",
        headers={"Authorization": f"Bearer {secret}"},
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())


def clerk_post(secret: str, path: str, body: dict) -> dict:
    req = urllib.request.Request(
        f"https://api.clerk.com/v1{path}",
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {secret}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())


def main() -> int:
    env = load_env()
    secret = env.get("CLERK_SECRET_KEY", "").strip()
    if not secret:
        print("CLERK_SECRET_KEY missing in .env")
        return 1

    print("=== Internal portal accounts (Clerk) ===\n")
    ok = True
    for role, email, clerk_id in INTERNAL:
        try:
            user = clerk_get(secret, f"/users/{clerk_id}")
            primary = user.get("email_addresses", [{}])[0].get("email_address", "?")
            verified = user.get("has_verified_email_address", False)
            print(f"  {role:7} {email:35} clerk_ok verified={verified} primary={primary}")
            token = clerk_post(secret, "/sign_in_tokens", {"user_id": clerk_id})
            if not token.get("token"):
                print(f"    WARN: sign_in_token missing for {email}")
                ok = False
        except urllib.error.HTTPError as e:
            print(f"  {role:7} {email:35} FAIL HTTP {e.code}")
            ok = False

    fn_url = f"https://{PROJECT_REF}.supabase.co/functions/v1/kk-admin-users"
    try:
        req = urllib.request.Request(fn_url, data=b"{}", method="POST")
        with urllib.request.urlopen(req) as r:
            pass
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        if e.code == 403 and "Admin role required" in body:
            print(f"\nkk-admin-users: deployed (403 without admin JWT — expected)")
        else:
            print(f"\nkk-admin-users: HTTP {e.code} {body[:120]}")
            ok = False

    print("\nPassword for e2e/staging accounts: KadoKohi2026! (see e2e/helpers.ts)")
    print("Portal: /management-portal — pick the tab matching your role before sign-in.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
