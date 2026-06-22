#!/usr/bin/env python3
"""Print non-secret prefixes from .env.vercel.check (no values logged)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

p = Path(__file__).resolve().parent.parent / ".env.vercel.check"
if not p.is_file():
    print("Run: vercel env pull .env.vercel.check --environment=production --yes")
    sys.exit(1)

for line in p.read_text(encoding="utf-8").splitlines():
    m = re.match(r"^([A-Z0-9_]+)=(.*)$", line.strip())
    if not m:
        continue
    k, v = m.group(1), m.group(2).strip().strip('"')
    if not v:
        print(f"{k}: (empty)")
    elif "SECRET" in k or "TOKEN" in k or "KEY" in k:
        print(f"{k}: {v[:14]}… ({'pk_live' if v.startswith('pk_live') else 'pk_test' if v.startswith('pk_test') else 'redacted'})")
    else:
        print(f"{k}: {v}")
