"""Print kk_ensure_my_profile definition from production."""
from __future__ import annotations

import json
import pathlib
import re
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent


def load_env() -> dict[str, str]:
    out: dict[str, str] = {}
    for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
        m = re.match(r'^([A-Z0-9_]+)="([^"]*)"\s*$', line.strip())
        if m:
            out[m.group(1)] = m.group(2)
    return out


def main() -> None:
    env = load_env()
    token = env["SUPABASE_ACCESS_TOKEN"]
    ref = env.get("SUPABASE_PROJECT_ID", "idwtlujcdfnnndxmlaco")
    sql = (
        "SELECT pg_get_functiondef(p.oid) AS def FROM pg_proc p "
        "JOIN pg_namespace n ON n.oid = p.pronamespace "
        "WHERE n.nspname = 'public' AND p.proname = 'kk_ensure_my_profile';"
    )
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{ref}/database/query",
        data=json.dumps({"query": sql}).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    rows = json.loads(urllib.request.urlopen(req).read().decode())
    for row in rows:
        print(row.get("def", row))


if __name__ == "__main__":
    main()
