#!/usr/bin/env python3
"""Quick health check for Clerk + Supabase auth bridge on Kado Kohi production."""

from __future__ import annotations

import os
import pathlib
import re
import sys
import urllib.request
import json

PROJECT_REF = "idwtlujcdfnnndxmlaco"
ROOT = pathlib.Path(__file__).resolve().parent.parent


def load_env() -> dict[str, str]:
    out: dict[str, str] = {}
    path = ROOT / ".env"
    if path.is_file():
        for line in path.read_text(encoding="utf-8").splitlines():
            m = re.match(r'^([A-Z0-9_]+)="([^"]*)"\s*$', line.strip())
            if m:
                out[m.group(1)] = m.group(2)
    for k, v in os.environ.items():
        out.setdefault(k, v)
    return out


def main() -> int:
    env = load_env()
    url = env.get("VITE_SUPABASE_URL") or f"https://{PROJECT_REF}.supabase.co"
    service = env.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    clerk_pub = env.get("VITE_CLERK_PUBLISHABLE_KEY", "").strip()

    print("=== Clerk auth cutover checklist ===\n")
    print(f"Supabase URL: {url}")
    print(f"VITE_CLERK_PUBLISHABLE_KEY: {'set' if clerk_pub and 'xxxx' not in clerk_pub else 'MISSING'}")
    print(f"CLERK_SECRET_KEY: {'set' if env.get('CLERK_SECRET_KEY') else 'MISSING (edge functions)'}")
    print(f"CLERK_WEBHOOK_SECRET: {'set' if env.get('CLERK_WEBHOOK_SECRET') else 'MISSING (webhook)'}")

    if not service:
        print("\nCannot query profiles without SUPABASE_SERVICE_ROLE_KEY in .env")
        return 1

    req = urllib.request.Request(
        f"{url}/rest/v1/kk_profiles?select=id,email,clerk_user_id,role",
        headers={"apikey": service, "Authorization": f"Bearer {service}"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        profiles = json.loads(resp.read().decode())

    total = len(profiles)
    linked = sum(1 for p in profiles if p.get("clerk_user_id"))
    print(f"\nkk_profiles: {total} total, {linked} with clerk_user_id")
    if linked < total:
        print("  -> Run: python scripts/migrate_users_to_clerk.py --dry-run then --apply")

    print("\nEdge functions (deploy via Supabase dashboard or CLI):")
    for fn in ("kk-clerk-webhook", "kk-admin-users", "kk-send-push"):
        print(f"  - {fn}")

    print("\nClerk Dashboard:")
    print("  - Integrations -> Supabase (native third-party auth — session token, not JWT template)")
    print("  - Webhooks -> user.created / user.updated / user.deleted")
    print("  - Emails -> Verification code: scripts/clerk-email-verification-code.html")
    print("  - Redirect URLs: http://127.0.0.1:5174/auth/* and https://www.kadokohi.com/auth/*")

    print("\nSupabase Dashboard:")
    print("  - Auth -> Third-party: Clerk ENABLED")
    print("  - Edge Function secrets: CLERK_SECRET_KEY, CLERK_WEBHOOK_SECRET")

    return 0 if clerk_pub else 1


if __name__ == "__main__":
    raise SystemExit(main())
