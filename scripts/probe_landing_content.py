#!/usr/bin/env python3
"""Verify landing CMS round-trip on kk_app_settings.landing_content (prod)."""
import json
import os
import sys
import urllib.error
import urllib.request

PROJECT = "idwtlujcdfnnndxmlaco"
BASE = f"https://{PROJECT}.supabase.co/rest/v1"


def env(name: str) -> str:
    v = os.environ.get(name, "").strip()
    if not v:
        print(f"Missing {name}", file=sys.stderr)
        sys.exit(1)
    return v


def rest(method: str, path: str, key: str, body=None):
    url = f"{BASE}/{path}"
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else None


def main():
    service = env("SUPABASE_SERVICE_ROLE_KEY")
    print(f"[1] Read landing_content from {PROJECT}")
    rows = rest("GET", "kk_app_settings?select=landing_content&id=eq.true", service)
    if not rows:
        print("  WARN: no settings row — publish from admin first")
        return
    lc = rows[0].get("landing_content")
    if not lc:
        print("  WARN: landing_content is null — only local seed in browser until first publish")
        return
    hero = (lc or {}).get("heroChrome") or {}
    headline = hero.get("mainHeadline") or hero.get("locationBadge") or "(missing heroChrome)"
    print(f"  OK row exists — hero headline sample: {str(headline)[:60]}…")

    marker = "__probe_landing_cms__"
    patch = {**lc, "heroChrome": {**hero, "locationBadge": marker}}
    print("[2] Patch locationBadge via service role")
    updated = rest(
        "PATCH",
        "kk_app_settings?id=eq.true",
        service,
        {"landing_content": patch},
    )
    got = (updated[0].get("landing_content") or {}).get("heroChrome", {}).get("locationBadge")
    assert got == marker, f"expected {marker}, got {got}"
    print("  OK write + read")

    print("[3] Restore original locationBadge")
    rest("PATCH", "kk_app_settings?id=eq.true", service, {"landing_content": lc})
    print("  OK restored")

    print(f"\nOK: landing_content JSONB read/write verified on {PROJECT}")


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()}", file=sys.stderr)
        sys.exit(1)
