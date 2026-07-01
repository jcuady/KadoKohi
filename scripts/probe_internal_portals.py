#!/usr/bin/env python3
"""Non-destructive smoke probe for admin / staff / barista internal portals."""

from __future__ import annotations

import json
import re
import sys
import time
import uuid
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV = ROOT / ".env"
HELPERS = ROOT / "e2e" / "helpers.ts"

INTERNAL_EMAILS = {
    "admin": "admin@kadokohi.com",
    "staff": "staff@kadokohi.com",
    "barista": "barista@kadokohi.com",
    "customer": "customer@kadokohi.com",
}


def load_env() -> tuple[str, str, str]:
    if not ENV.exists():
        raise SystemExit(".env not found")
    text = ENV.read_text(encoding="utf-8")
    url = re.search(r'VITE_SUPABASE_URL="([^"]+)"', text)
    anon = re.search(r'VITE_SUPABASE_ANON_KEY="([^"]+)"', text)
    if not url or not anon:
        raise SystemExit("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing in .env")
    password = "KadoKohi2026!"
    if HELPERS.exists():
        helpers_text = HELPERS.read_text(encoding="utf-8")
        pwd_match = re.search(
            r"admin:\s*\{[^}]*password:\s*['\"]([^'\"]+)['\"]",
            helpers_text,
        )
        if pwd_match:
            password = pwd_match.group(1)
    return url.group(1).rstrip("/"), anon.group(1), password


def password_token(base_url: str, anon: str, email: str, password: str) -> str:
    body = json.dumps({"email": email, "password": password}).encode()
    req = urllib.request.Request(
        f"{base_url}/auth/v1/token?grant_type=password",
        data=body,
        headers={"apikey": anon, "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())["access_token"]


def rpc(
    base_url: str,
    anon: str,
    token: str,
    fn: str,
    args: dict,
) -> tuple[int, object]:
    data = json.dumps(args).encode()
    req = urllib.request.Request(
        f"{base_url}/rest/v1/rpc/{fn}",
        data=data,
        headers={
            "apikey": anon,
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, raw


def rest(
    base_url: str,
    anon: str,
    token: str,
    method: str,
    path: str,
    body: dict | list | None = None,
) -> tuple[int, object]:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        f"{base_url}/rest/v1{path}",
        data=data,
        headers={
            "apikey": anon,
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, raw


def rpc_error_text(body: object) -> str:
    if isinstance(body, dict):
        return str(body.get("message") or body.get("error") or body)
    return str(body)


def unique_id(prefix: str) -> str:
    return f"{prefix}-{int(time.time())}-{uuid.uuid4().hex[:8]}"


def main() -> int:
    base_url, anon, password = load_env()
    failures: list[str] = []
    passes: list[str] = []

    tokens: dict[str, str] = {}
    for role, email in INTERNAL_EMAILS.items():
        try:
            tokens[role] = password_token(base_url, anon, email, password)
            passes.append(f"AUTH {role}: token ok")
        except Exception as exc:
            failures.append(f"AUTH {role}: {exc}")

    admin = tokens.get("admin")
    staff = tokens.get("staff")
    barista = tokens.get("barista")
    customer = tokens.get("customer")

    # ── Admin-only RPC guards ──
    admin_only_rpcs: list[tuple[str, dict]] = [
        ("kk_admin_delete_order", {"p_order_id": "probe-nonexistent"}),
        ("kk_admin_delete_table", {"p_table_id": "probe-nonexistent"}),
        (
            "kk_admin_reset_data",
            {"p_scope": "orders", "p_confirm_phrase": "WRONG PHRASE"},
        ),
    ]
    for role in ("staff", "barista"):
        token = tokens.get(role)
        if not token:
            continue
        for fn, args in admin_only_rpcs:
            code, body = rpc(base_url, anon, token, fn, args)
            msg = rpc_error_text(body).lower()
            if code == 200 and fn != "kk_admin_reset_data":
                failures.append(f"RPC GUARD {fn} as {role}: expected denial, got 200")
            elif "admin" in msg or code in (400, 401, 403, 404, 500):
                passes.append(f"RPC GUARD {fn} as {role}: denied ({code})")
            else:
                failures.append(f"RPC GUARD {fn} as {role}: unexpected ({code}) {body}")

    if admin:
        code, body = rpc(
            base_url,
            anon,
            admin,
            "kk_admin_reset_data",
            {"p_scope": "orders", "p_confirm_phrase": "WRONG PHRASE"},
        )
        msg = rpc_error_text(body).lower()
        if "confirmation phrase" in msg or "confirm" in msg:
            passes.append("RESET PHRASE GUARD: wrong phrase rejected")
        else:
            failures.append(f"RESET PHRASE GUARD: unexpected ({code}) {body}")

        code, body = rpc(base_url, anon, admin, "kk_admin_delete_order", {"p_order_id": "probe-missing"})
        msg = rpc_error_text(body).lower()
        if "not found" in msg or "invalid" in msg:
            passes.append("ADMIN DELETE ORDER: callable by admin (not found ok)")
        elif code == 200:
            passes.append("ADMIN DELETE ORDER: admin RPC reachable")
        else:
            failures.append(f"ADMIN DELETE ORDER as admin: ({code}) {body}")

    # ── Staff allowed: booth patch RPC ──
    if staff:
        code, body = rpc(
            base_url,
            anon,
            staff,
            "kk_admin_patch_booth_booking",
            {"payload": {"id": "probe-nonexistent", "status": "pending"}},
        )
        msg = rpc_error_text(body).lower()
        if "not found" in msg or "booking" in msg or code in (400, 404):
            passes.append("STAFF BOOTH PATCH RPC: reachable (booking not found ok)")
        elif code == 200:
            passes.append("STAFF BOOTH PATCH RPC: ok")
        else:
            failures.append(f"STAFF BOOTH PATCH RPC: ({code}) {body}")

    # ── Staff merch order status write ──
    probe_order_id: str | None = None
    if admin and staff and customer:
        status, branches = rest(
            base_url,
            anon,
            admin,
            "GET",
            "/kk_branches?select=id&status=eq.active&limit=1",
        )
        status, merch = rest(
            base_url,
            anon,
            admin,
            "GET",
            "/kk_merch_products?select=id&visible=eq.true&limit=1",
        )
        branch_id = branches[0]["id"] if status == 200 and branches else None
        product_id = merch[0]["id"] if status == 200 and merch else None
        if branch_id and product_id:
            probe_order_id = unique_id("probe-merch")
            place_payload = {
                "payload": {
                    "id": probe_order_id,
                    "channel": "merch",
                    "branch_id": branch_id,
                    "payment_method": "gcash-qr",
                    "payment_status": "unpaid",
                    "status": "pending",
                    "items": [
                        {
                            "id": unique_id("line"),
                            "product_id": product_id,
                            "qty": 1,
                            "item_type": "merch",
                            "merch_variants": [
                                {"groupName": "Size", "optionLabel": "M", "priceDelta": 0}
                            ],
                        }
                    ],
                }
            }
            code, body = rpc(base_url, anon, customer, "kk_place_order", place_payload)
            if code == 200:
                passes.append("MERCH ORDER: placed via customer token")
                patch_code, patch_body = rest(
                    base_url,
                    anon,
                    staff,
                    "PATCH",
                    f"/kk_orders?id=eq.{probe_order_id}",
                    {"payment_status": "paid", "status": "accepted"},
                )
                if patch_code == 200 and patch_body:
                    passes.append("STAFF MERCH STATUS: order advanced to accepted")
                else:
                    failures.append(
                        f"STAFF MERCH STATUS: PATCH failed ({patch_code}) {patch_body}"
                    )
            else:
                failures.append(f"MERCH ORDER place failed ({code}) {body}")
        else:
            passes.append("MERCH ORDER: skipped (no branch/merch seed)")

    # ── Barista POS order + status ──
    probe_pos_id: str | None = None
    if barista and admin:
        status, branches = rest(
            base_url,
            anon,
            admin,
            "GET",
            "/kk_branches?select=id&status=eq.active&limit=1",
        )
        status, products = rest(
            base_url,
            anon,
            admin,
            "GET",
            "/kk_products?select=id&visible=eq.true&limit=1",
        )
        branch_id = branches[0]["id"] if status == 200 and branches else None
        product_id = products[0]["id"] if status == 200 and products else None
        if branch_id and product_id:
            probe_pos_id = unique_id("probe-pos")
            place_payload = {
                "payload": {
                    "id": probe_pos_id,
                    "channel": "pos",
                    "branch_id": branch_id,
                    "payment_method": "pay-at-store",
                    "payment_status": "paid",
                    "status": "pending",
                    "items": [
                        {
                            "id": unique_id("line"),
                            "product_id": product_id,
                            "qty": 1,
                            "item_type": "coffee",
                        }
                    ],
                }
            }
            code, body = rpc(base_url, anon, barista, "kk_place_order", place_payload)
            if code == 200:
                passes.append("BARISTA POS: order placed")
                patch_code, patch_body = rest(
                    base_url,
                    anon,
                    barista,
                    "PATCH",
                    f"/kk_orders?id=eq.{probe_pos_id}",
                    {"status": "preparing"},
                )
                if patch_code == 200 and patch_body:
                    passes.append("BARISTA STATUS: order advanced to preparing")
                else:
                    failures.append(
                        f"BARISTA STATUS: PATCH failed ({patch_code}) {patch_body}"
                    )
            else:
                failures.append(f"BARISTA POS place failed ({code}) {body}")
        else:
            passes.append("BARISTA POS: skipped (no branch/product seed)")

    # ── Branch scope: staff Marikina should not see Greenhills-only rows via REST filter ──
    if staff:
        status, profile = rest(
            base_url,
            anon,
            staff,
            "GET",
            "/kk_profiles?select=branch_id&email=eq.staff@kadokohi.com",
        )
        staff_branch = profile[0]["branch_id"] if status == 200 and profile else None
        if staff_branch:
            status, all_orders = rest(
                base_url,
                anon,
                staff,
                "GET",
                "/kk_orders?select=id,branch_id&limit=50&order=created_at.desc",
            )
            if status == 200 and isinstance(all_orders, list):
                foreign = [o for o in all_orders if o.get("branch_id") != staff_branch]
                if foreign:
                    failures.append(
                        f"BRANCH SCOPE: staff sees {len(foreign)} orders outside {staff_branch}"
                    )
                else:
                    passes.append(f"BRANCH SCOPE: staff orders scoped to {staff_branch}")
            else:
                failures.append(f"BRANCH SCOPE: could not list orders ({status})")

    # ── Security: direct INSERT / internal RPC must be denied ──
    fake_order_id = unique_id("probe-direct-insert")
    code, body = rest(
        base_url,
        anon,
        anon,
        "POST",
        "/kk_orders",
        {
            "id": fake_order_id,
            "channel": "takeout",
            "status": "pending",
            "payment_status": "unpaid",
            "total": 1,
        },
    )
    if code in (401, 403, 404, 405):
        passes.append("SECURITY: direct kk_orders INSERT denied")
    else:
        failures.append(f"SECURITY: direct kk_orders INSERT not denied ({code}) {body}")

    code, body = rest(
        base_url,
        anon,
        anon,
        "POST",
        "/kk_payment_transactions",
        {
            "order_id": fake_order_id,
            "amount": 1,
            "method": "gcash",
            "status": "pending",
        },
    )
    if code in (401, 403, 404, 405):
        passes.append("SECURITY: direct payment_transactions INSERT denied")
    else:
        failures.append(
            f"SECURITY: direct payment_transactions INSERT not denied ({code}) {body}"
        )

    code, body = rpc(
        base_url,
        anon,
        anon,
        "increment_promo_uses",
        {"code_id": "00000000-0000-0000-0000-000000000001"},
    )
    if code in (401, 403, 404):
        passes.append("SECURITY: increment_promo_uses denied to anon")
    else:
        failures.append(f"SECURITY: increment_promo_uses callable by anon ({code}) {body}")

    if customer:
        code, body = rpc(
            base_url,
            anon,
            customer,
            "kk_write_audit",
            {
                "p_actor_id": None,
                "p_actor_email": "probe@evil.test",
                "p_actor_role": "admin",
                "p_action": "probe",
                "p_entity_type": "order",
            },
        )
        if code in (401, 403, 404):
            passes.append("SECURITY: kk_write_audit denied to authenticated")
        else:
            failures.append(
                f"SECURITY: kk_write_audit callable by customer ({code}) {body}"
            )

    # ── Cleanup probe orders ──
    if admin:
        for oid in (probe_order_id, probe_pos_id):
            if not oid:
                continue
            rpc(base_url, anon, admin, "kk_admin_delete_order", {"p_order_id": oid})

    print("=== Internal portal probe results ===\n")
    for p in passes:
        print(f"PASS  {p}")
    for f in failures:
        print(f"FAIL  {f}")

    if failures:
        print(f"\n{len(failures)} failure(s), {len(passes)} pass(es)")
        return 1
    print(f"\nAll {len(passes)} checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
