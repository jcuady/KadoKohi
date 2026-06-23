"""Smoke-test kk_submit_career_application RPC + career_application email kind."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REF = "idwtlujcdfnnndxmlaco"
BASE = f"https://{REF}.supabase.co"


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    path = ROOT / ".env"
    if not path.exists():
        return env
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        env[key] = val.strip().strip('"')
    return env


def rpc(name: str, payload: dict, key: str) -> tuple[int, str]:
    body = json.dumps({"payload": payload}).encode()
    req = urllib.request.Request(
        f"{BASE}/rest/v1/rpc/{name}",
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "apikey": key,
            "Authorization": f"Bearer {key}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, resp.read().decode()
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode()


def invoke_contact(body: dict, key: str) -> tuple[int, str]:
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        f"{BASE}/functions/v1/kk-send-contact",
        data=data,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "apikey": key,
            "Authorization": f"Bearer {key}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, resp.read().decode()
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode()


def main() -> None:
    env = load_env()
    anon = env.get("VITE_SUPABASE_PUBLISHABLE_KEY") or env.get("VITE_SUPABASE_ANON_KEY") or ""
    if not anon:
        print("ERR: missing anon key", file=sys.stderr)
        sys.exit(1)

    app_id = f"probe_{uuid.uuid4().hex[:12]}"
    answers = {
        "f_name": "Career Probe",
        "f_phone": "9171234567",
        "f_email": f"career.probe.{uuid.uuid4().hex[:8]}@example.com",
        "f_availability": "Part-time",
        "f_why": "Automated smoke test for careers application flow.",
        "f_portfolio": "https://example.com/portfolio",
    }

    status, text = rpc(
        "kk_submit_career_application",
        {"id": app_id, "listing_id": "career_barista", "answers": answers},
        anon,
    )
    print("RPC_STATUS", status)
    print("RPC_BODY", text)
    if status != 200:
        sys.exit(1)

    email_status, email_text = invoke_contact(
        {
            "kind": "career_application",
            "email": answers["f_email"],
            "name": answers["f_name"],
            "listingTitle": "Barista",
            "phone": "+639171234567",
            "message": "Role: Barista\nPhone: +639171234567\n\nWhy: smoke test",
        },
        anon,
    )
    print("EMAIL_STATUS", email_status)
    print("EMAIL_BODY", email_text)
    if email_status not in (200, 503):
        sys.exit(1)

    print("OK careers smoke passed")


if __name__ == "__main__":
    main()
