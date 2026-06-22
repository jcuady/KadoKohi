#!/usr/bin/env python3
"""One-time cutover: link auth.users rows to Clerk users and populate kk_profiles.clerk_user_id.

Requires env:
  CLERK_SECRET_KEY
  SUPABASE_URL (or VITE_SUPABASE_URL)
  SUPABASE_SERVICE_ROLE_KEY

Usage:
  python scripts/migrate_users_to_clerk.py --dry-run
  python scripts/migrate_users_to_clerk.py --apply
"""

from __future__ import annotations

import argparse
import os
import sys
import uuid

import requests

def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    path = os.path.join(os.getcwd(), ".env")
    if os.path.isfile(path):
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    for k, v in os.environ.items():
        env.setdefault(k, v)
    return env


def clerk_create_user(secret: str, email: str, password: str, name: str, role: str, branch_id: str | None) -> str:
    payload = {
        "email_address": [email],
        "password": password,
        "first_name": name.split(" ")[0] if name else email.split("@")[0],
        "skip_password_checks": True,
        "public_metadata": {"role": role, "branchId": branch_id},
        "unsafe_metadata": {"name": name, "role": role},
    }
    res = requests.post(
        "https://api.clerk.com/v1/users",
        headers={"Authorization": f"Bearer {secret}", "Content-Type": "application/json"},
        json=payload,
        timeout=60,
    )
    if res.status_code >= 400:
        raise RuntimeError(f"Clerk create failed for {email}: {res.status_code} {res.text}")
    return res.json()["id"]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--default-password", default="KadoKohi2026!")
    args = parser.parse_args()
    if args.dry_run == args.apply:
        print("Pass exactly one of --dry-run or --apply", file=sys.stderr)
        return 2

    env = load_env()
    clerk_secret = env.get("CLERK_SECRET_KEY")
    supabase_url = env.get("SUPABASE_URL") or env.get("VITE_SUPABASE_URL")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY")
    if not clerk_secret or not supabase_url or not service_key:
        print("Missing CLERK_SECRET_KEY, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY", file=sys.stderr)
        return 2

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }

    profiles = requests.get(
        f"{supabase_url}/rest/v1/kk_profiles?select=id,email,name,role,branch_id,clerk_user_id",
        headers=headers,
        timeout=60,
    ).json()

    pending = [p for p in profiles if not p.get("clerk_user_id")]
    print(f"Profiles without clerk_user_id: {len(pending)}")

    for p in pending:
        email = (p.get("email") or "").strip().lower()
        if not email:
            print(f"skip {p['id']}: no email")
            continue
        name = p.get("name") or email.split("@")[0]
        role = p.get("role") or "customer"
        branch_id = p.get("branch_id")
        print(f"{'[dry-run]' if args.dry_run else '[apply]'} {email} ({role})")
        if args.dry_run:
            continue
        clerk_id = clerk_create_user(clerk_secret, email, args.default_password, name, role, branch_id)
        patch = requests.patch(
            f"{supabase_url}/rest/v1/kk_profiles?id=eq.{p['id']}",
            headers={**headers, "Prefer": "return=minimal"},
            json={"clerk_user_id": clerk_id},
            timeout=60,
        )
        if patch.status_code >= 400:
            print(f"  profile patch failed: {patch.text}", file=sys.stderr)
            return 1

    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
