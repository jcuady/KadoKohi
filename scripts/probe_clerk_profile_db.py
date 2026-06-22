"""Verify kk_profiles clerk_user_id constraint on Kado production."""
from __future__ import annotations

import json
import pathlib
import re
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
REF = "idwtlujcdfnnndxmlaco"


def load_env() -> dict[str, str]:
    out: dict[str, str] = {}
    for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
        m = re.match(r'^([A-Z0-9_]+)="([^"]*)"\s*$', line.strip())
        if m:
            out[m.group(1)] = m.group(2)
    return out


def query(sql: str) -> list[dict]:
    env = load_env()
    token = env["SUPABASE_ACCESS_TOKEN"]
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{REF}/database/query",
        data=json.dumps({"query": sql}).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    return json.loads(urllib.request.urlopen(req).read().decode())


def main() -> None:
    constraints = query(
        "SELECT conname, pg_get_constraintdef(oid) AS def "
        "FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid "
        "WHERE t.relname = 'kk_profiles' ORDER BY conname;"
    )
    print("Constraints on kk_profiles:")
    for row in constraints:
        print(f"  - {row['conname']}: {row['def']}")

    triggers = query(
        "SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.kk_profiles'::regclass AND NOT tgisinternal;"
    )
    print("Triggers:", [t["tgname"] for t in triggers])

    joax = query(
        "SELECT email, clerk_user_id, role FROM kk_profiles "
        "WHERE email ILIKE '%joax%' OR email ILIKE '%pogi%';"
    )
    print("Joax-related profiles:", joax)


if __name__ == "__main__":
    main()
