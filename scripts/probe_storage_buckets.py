#!/usr/bin/env python3
"""Smoke probe all active Kado Kohi storage buckets on production idwtlujcdfnnndxmlaco."""

from __future__ import annotations

import base64
import json
import pathlib
import re
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
REF = "idwtlujcdfnnndxmlaco"
BASE = f"https://{REF}.supabase.co"

TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)

# bucket → (probe path, expect public HEAD after upload)
PUBLIC_ADMIN_BUCKETS: dict[str, str] = {
    "kado-menu-images": "products/_probe_storage_menu.png",
    "kado-gcash-qr": "_probe_storage_gcash.png",
    "kado-blog-images": "covers/_probe_storage_blog.png",
    "kado-cms-images": "landing/_probe_storage_cms.png",
}

REQUIRED_BUCKETS = {
    "kado-menu-images": {"public": True, "limit": 5_242_880},
    "kado-gcash-qr": {"public": True, "limit": 2_097_152},
    "kado-blog-images": {"public": True, "limit": 5_242_880},
    "kado-cms-images": {"public": True, "limit": 5_242_880},
    "kado-payment-proofs": {"public": False, "limit": 5_242_880},
}


def load_env() -> dict[str, str]:
    env_path = ROOT / ".env"
    if not env_path.exists():
        print("ERR: .env not found", file=sys.stderr)
        sys.exit(1)
    text = env_path.read_text(encoding="utf-8")
    out: dict[str, str] = {}
    for key in ("SUPABASE_SERVICE_ROLE_KEY", "VITE_SUPABASE_ANON_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY"):
        m = re.search(rf'{key}="([^"]*)"', text)
        if m and m.group(1).strip():
            out[key] = m.group(1).strip()
    return out


def anon_key(env: dict[str, str]) -> str:
    return env.get("VITE_SUPABASE_ANON_KEY") or env.get("VITE_SUPABASE_PUBLISHABLE_KEY", "")


def admin_token(api_key: str) -> str:
    body = json.dumps({"email": "admin@kadokohi.com", "password": "KadoKohi2026!"}).encode()
    req = urllib.request.Request(
        f"{BASE}/auth/v1/token?grant_type=password",
        data=body,
        headers={"apikey": api_key, "Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    token = data.get("access_token")
    if not token:
        raise RuntimeError(f"Admin sign-in failed: {data}")
    return token


def storage_list_buckets(service_key: str) -> list[dict]:
    req = urllib.request.Request(
        f"{BASE}/storage/v1/bucket",
        headers={"apikey": service_key, "Authorization": f"Bearer {service_key}"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    return data if isinstance(data, list) else []


def storage_upload(token: str, api_key: str, bucket: str, path: str) -> dict:
    url = f"{BASE}/storage/v1/object/{bucket}/{path}"
    req = urllib.request.Request(
        url,
        data=TINY_PNG,
        headers={
            "Authorization": f"Bearer {token}",
            "apikey": api_key,
            "Content-Type": "image/png",
            "x-upsert": "true",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def public_head(url: str) -> int:
    req = urllib.request.Request(url, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code


def check(label: str, ok: bool, detail: str = "") -> bool:
    status = "PASS" if ok else "FAIL"
    suffix = f" — {detail}" if detail else ""
    print(f"{status}  {label}{suffix}")
    return ok


def main() -> int:
    env = load_env()
    service = env.get("SUPABASE_SERVICE_ROLE_KEY")
    anon = anon_key(env)
    if not service:
        print("ERR: SUPABASE_SERVICE_ROLE_KEY missing in .env", file=sys.stderr)
        return 1
    if not anon:
        print("ERR: VITE_SUPABASE_ANON_KEY missing in .env", file=sys.stderr)
        return 1

    results: list[bool] = []

    buckets = storage_list_buckets(service)
    found = {b["id"]: b for b in buckets if isinstance(b, dict) and "id" in b}

    for bucket_id, expected in REQUIRED_BUCKETS.items():
        row = found.get(bucket_id)
        if not row:
            results.append(check(f"BUCKET {bucket_id} exists", False, "missing"))
            continue
        ok = row.get("public") is expected["public"] and row.get("file_size_limit") == expected["limit"]
        results.append(
            check(
                f"BUCKET {bucket_id} config",
                ok,
                f"public={row.get('public')} limit={row.get('file_size_limit')}",
            )
        )

    admin_jwt = admin_token(anon)

    for bucket, path in PUBLIC_ADMIN_BUCKETS.items():
        try:
            storage_upload(admin_jwt, anon, bucket, path)
            public_url = f"{BASE}/storage/v1/object/public/{bucket}/{path}"
            head = public_head(public_url)
            results.append(check(f"UPLOAD+READ {bucket}", head == 200, f"HEAD HTTP {head}"))
        except Exception as exc:  # noqa: BLE001 — probe surfaces any upload/RLS failure
            results.append(check(f"UPLOAD+READ {bucket}", False, str(exc)))

    # Payment proofs: private bucket — service role upload; public URL must not be readable
    proof_path = "_probe_storage/service_role_proof.png"
    try:
        storage_upload(service, service, "kado-payment-proofs", proof_path)
        results.append(check("UPLOAD kado-payment-proofs (service role)", True))
        public_url = f"{BASE}/storage/v1/object/public/kado-payment-proofs/{proof_path}"
        anon_head = public_head(public_url)
        results.append(check("DENY public kado-payment-proofs", anon_head in (400, 401, 403, 404), f"HEAD HTTP {anon_head}"))
    except Exception as exc:  # noqa: BLE001
        results.append(check("UPLOAD kado-payment-proofs (service role)", False, str(exc)))

    # ponytail: public buckets must not allow anon object listing (URLs still work via public flag)
    for bucket in PUBLIC_ADMIN_BUCKETS:
        list_body = json.dumps({"prefix": "", "limit": 5, "offset": 0}).encode()
        req = urllib.request.Request(
            f"{BASE}/storage/v1/object/list/{bucket}",
            data=list_body,
            headers={
                "apikey": anon,
                "Authorization": f"Bearer {anon}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                listed = json.loads(resp.read())
            count = len(listed) if isinstance(listed, list) else -1
            results.append(check(f"DENY list {bucket}", count == 0, f"listed {count} objects"))
        except urllib.error.HTTPError as e:
            results.append(check(f"DENY list {bucket}", e.code in (400, 401, 403, 404), f"HTTP {e.code}"))
        except Exception as exc:  # noqa: BLE001
            results.append(check(f"DENY list {bucket}", False, str(exc)))

    passed = sum(1 for r in results if r)
    total = len(results)
    print(f"\n{passed}/{total} storage checks passed on {REF}.")
    return 0 if passed == total else 1


if __name__ == "__main__":
    raise SystemExit(main())
