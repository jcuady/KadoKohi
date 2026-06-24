"""Smoke: two proposals on the same open day should both succeed after migration 0073."""
from __future__ import annotations

import json
import pathlib
import re
import sys
import uuid
import urllib.request
from datetime import datetime, timedelta, timezone

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = "https://idwtlujcdfnnndxmlaco.supabase.co"
MANILA = timezone(timedelta(hours=8))


def load_env() -> dict[str, str]:
    text = (ROOT / ".env").read_text(encoding="utf-8")
    out: dict[str, str] = {}
    for line in text.splitlines():
        m = re.match(r'^([A-Z0-9_]+)="([^"]*)"\s*$', line.strip())
        if m:
            out[m.group(1)] = m.group(2)
    return out


def rpc(anon: str, name: str, args: dict) -> tuple[int, str]:
    body = json.dumps(args).encode("utf-8")
    req = urllib.request.Request(
        f"{URL}/rest/v1/rpc/{name}",
        data=body,
        method="POST",
        headers={
            "apikey": anon,
            "Authorization": f"Bearer {anon}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.status, resp.read().decode("utf-8")
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode("utf-8")


def find_open_day(anon: str) -> str:
    for offset in range(2, 45):
        day = (datetime.now(MANILA) + timedelta(days=offset)).strftime("%Y-%m-%d")
        y, m = map(int, day.split("-")[:2])
        status, raw = rpc(anon, "kk_fetch_event_calendar", {"p_year": y, "p_month": m})
        if status >= 400:
            continue
        cal = json.loads(raw)
        if day not in cal.get("blockouts", []):
            return day
    raise RuntimeError("no open day found")


def place(anon: str, day: str, label: str) -> tuple[int, str]:
    bid = str(uuid.uuid4())
    payload = {
        "id": bid,
        "contact_name": f"QA {label}",
        "contact_email": f"qa+{bid[:8]}@example.com",
        "contact_phone": "9171234567",
        "event_name": f"QA {label}",
        "occasion": "birthday",
        "guest_count": 20,
        "event_date": f"{day}T00:00:00+08:00",
        "starts_at": f"{day}T14:00:00+08:00",
        "ends_at": f"{day}T18:00:00+08:00",
        "package_id": "event_proposal",
        "package_name_snapshot": "Event Proposal",
        "package_base_price_snapshot": 0,
        "selected_addons": [],
        "estimate_snapshot": {},
    }
    return rpc(anon, "kk_place_booth_booking", {"payload": payload})


def main() -> None:
    env = load_env()
    anon = env.get("VITE_SUPABASE_ANON_KEY") or env.get("VITE_SUPABASE_PUBLISHABLE_KEY", "")
    if not anon:
        print("anon key missing", file=sys.stderr)
        sys.exit(1)

    day = find_open_day(anon)
    s1, b1 = place(anon, day, "first")
    if s1 >= 400:
        print(f"first booking failed on {day}: {b1}", file=sys.stderr)
        sys.exit(1)
    s2, b2 = place(anon, day, "second")
    if s2 >= 400:
        if "already booked" in b2.lower():
            print(f"FAIL: policy not deployed on {day}: {b2}", file=sys.stderr)
            sys.exit(1)
        print(f"second booking failed: {b2}", file=sys.stderr)
        sys.exit(1)
    print(f"OK: two proposals accepted on {day}")


if __name__ == "__main__":
    main()
