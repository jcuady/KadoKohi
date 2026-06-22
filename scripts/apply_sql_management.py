"""Apply SQL to Supabase project via Management API (uses SUPABASE_ACCESS_TOKEN in .env)."""
from __future__ import annotations

import json
import os
import pathlib
import re
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent


def load_env() -> dict[str, str]:
    text = (ROOT / ".env").read_text(encoding="utf-8")
    out: dict[str, str] = {}
    for line in text.splitlines():
        m = re.match(r'^([A-Z0-9_]+)="([^"]*)"\s*$', line.strip())
        if m:
            out[m.group(1)] = m.group(2)
    return out


def main() -> None:
    if len(sys.argv) < 3:
        print("usage: apply_sql_management.py <project-ref> <sql-file>", file=sys.stderr)
        sys.exit(1)

    project_ref = sys.argv[1]
    sql_path = pathlib.Path(sys.argv[2])
    sql = sql_path.read_text(encoding="utf-8")

    env = load_env()
    token = os.environ.get("SUPABASE_ACCESS_TOKEN", "").strip() or env.get("SUPABASE_ACCESS_TOKEN", "").strip()
    if not token:
        print("SUPABASE_ACCESS_TOKEN missing in env or .env", file=sys.stderr)
        sys.exit(1)

    url = f"https://api.supabase.com/v1/projects/{project_ref}/database/query"
    body = json.dumps({"query": sql}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "kado-kohi-sql-apply/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            raw = resp.read().decode("utf-8")
            print(raw[:2000] if len(raw) > 2000 else raw)
    except urllib.error.HTTPError as err:
        print(err.read().decode("utf-8", errors="replace"), file=sys.stderr)
        sys.exit(err.code)


if __name__ == "__main__":
    main()
