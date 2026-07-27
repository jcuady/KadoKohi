"""Deploy PayMongo edge functions to Kado prod (idwtlujcdfnnndxmlaco)."""
from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REF = "idwtlujcdfnnndxmlaco"


def load_token() -> str:
    text = (ROOT / ".env").read_text(encoding="utf-8")
    m = re.search(r'^SUPABASE_ACCESS_TOKEN="([^"]+)"', text, re.M)
    if not m:
        raise SystemExit("SUPABASE_ACCESS_TOKEN missing in .env")
    return m.group(1)


def main() -> None:
    os.environ["SUPABASE_ACCESS_TOKEN"] = load_token()
    cmd = [
        "npx",
        "supabase",
        "functions",
        "deploy",
        "kk-paymongo-webhook",
        "kk-paymongo-verify",
        "--project-ref",
        REF,
    ]
    raise SystemExit(subprocess.call(cmd, cwd=str(ROOT), shell=True))


if __name__ == "__main__":
    main()
