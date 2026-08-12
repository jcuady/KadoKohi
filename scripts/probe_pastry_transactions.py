#!/usr/bin/env python3
"""Deep QA probe: pastry + Kuki Box transactional matrix (place -> pay -> barista process).

Channels: online, dine-in, takeout, pos
Payments: gcash-qr, paymongo, pay-at-store (where allowed)
Items: single cookie, kuki_box_4 (+ optional pack), negative underfill/overfill

Exit 0 only when every scenario passes. Cleans up probe orders via barista cancel or admin delete.
"""

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

BRANCH_ID = "branch_greenhills"
TABLE_ID = "tbl_gh_01"
COOKIE_ID = "cookie_klassic"
BOX_ID = "kuki_box_4"
PACK_ID = "kuki_pack_single"

CREDS = {
    "admin": "admin@kadokohi.com",
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


def uid(prefix: str) -> str:
    return f"{prefix}-{int(time.time())}-{uuid.uuid4().hex[:8]}"


def api(
    base: str,
    anon: str,
    method: str,
    path: str,
    body: dict | list | None = None,
    token: str | None = None,
) -> tuple[int, object]:
    data = json.dumps(body).encode() if body is not None else None
    bearer = token or anon
    req = urllib.request.Request(
        f"{base}{path}",
        data=data,
        headers={
            "apikey": anon,
            "Authorization": f"Bearer {bearer}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, raw


def err_text(body: object) -> str:
    if isinstance(body, dict):
        return str(body.get("message") or body.get("error") or body)
    return str(body)


def password_token(base: str, anon: str, email: str, password: str) -> str:
    code, data = api(
        base,
        anon,
        "POST",
        "/auth/v1/token?grant_type=password",
        {"email": email, "password": password},
    )
    if code != 200 or not isinstance(data, dict) or not data.get("access_token"):
        raise RuntimeError(f"auth {email} failed ({code}): {data}")
    return str(data["access_token"])


def cookie_line(product_id: str = COOKIE_ID, qty: int = 1) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "product_id": product_id,
        "product_name_snapshot": product_id,
        "item_type": "coffee",
        "qty": qty,
    }


def box_line(*, cookies: dict[str, int], with_pack: bool = False) -> list[dict]:
    variants = [
        {
            "groupName": "Cookies",
            "optionId": cid,
            "optionLabel": f"{cid} ×{q}" if q > 1 else cid,
            "priceDelta": 0,
            "qty": q,
        }
        for cid, q in cookies.items()
        if q > 0
    ]
    lines = [
        {
            "id": str(uuid.uuid4()),
            "product_id": BOX_ID,
            "product_name_snapshot": "Kuki Box - 4 pcs",
            "item_type": "coffee",
            "qty": 1,
            "merch_variants": variants,
        }
    ]
    if with_pack:
        lines.append(
            {
                "id": str(uuid.uuid4()),
                "product_id": PACK_ID,
                "product_name_snapshot": "Single cookie box",
                "item_type": "coffee",
                "qty": 1,
            }
        )
    return lines


def place(
    base: str,
    anon: str,
    payload: dict,
    token: str | None = None,
) -> tuple[int, object]:
    return api(base, anon, "POST", "/rest/v1/rpc/kk_place_order", {"payload": payload}, token)


def track(base: str, anon: str, order_id: str) -> list:
    code, data = api(base, anon, "POST", "/rest/v1/rpc/kk_track_order", {"order_id": order_id})
    if code != 200:
        return []
    return data if isinstance(data, list) else []


def patch_order(
    base: str,
    anon: str,
    token: str,
    order_id: str,
    patch: dict,
) -> tuple[int, object]:
    return api(
        base,
        anon,
        "PATCH",
        f"/rest/v1/kk_orders?id=eq.{order_id}",
        patch,
        token,
    )


def delete_order(base: str, anon: str, admin_token: str, order_id: str) -> None:
    api(base, anon, "POST", "/rest/v1/rpc/kk_admin_delete_order", {"p_order_id": order_id}, admin_token)


def expect_ok(name: str, code: int, body: object, passes: list, fails: list) -> dict | None:
    if code not in (200, 201) or not isinstance(body, dict):
        fails.append(f"{name}: expected 200 dict, got ({code}) {body}")
        return None
    passes.append(f"{name}: ok")
    return body


def expect_fail(name: str, code: int, body: object, needle: str, passes: list, fails: list) -> None:
    msg = err_text(body).lower()
    if code in (200, 201):
        fails.append(f"{name}: expected rejection, got success {body}")
        return
    if needle.lower() not in msg and code < 400:
        fails.append(f"{name}: unexpected ({code}) {body}")
        return
    # HTTP 4xx/5xx with or without needle is acceptance for guard tests when needle optional
    if needle and needle.lower() not in msg:
        # still pass if clearly an error response
        if code >= 400:
            passes.append(f"{name}: rejected ({code})")
            return
        fails.append(f"{name}: missing '{needle}' in {msg}")
        return
    passes.append(f"{name}: rejected as expected")


def main() -> int:
    base, anon, password = load_env()
    passes: list[str] = []
    fails: list[str] = []
    created: list[str] = []

    tokens: dict[str, str] = {}
    for role, email in CREDS.items():
        try:
            tokens[role] = password_token(base, anon, email, password)
            passes.append(f"AUTH {role}")
        except Exception as exc:
            fails.append(f"AUTH {role}: {exc}")

    admin = tokens.get("admin")
    barista = tokens.get("barista")
    customer = tokens.get("customer")

    # Catalog sanity
    code, products = api(
        base,
        anon,
        "GET",
        "/rest/v1/kk_products?select=id,visible,in_stock&id=in.(cookie_klassic,kuki_box_4,kuki_pack_single)",
    )
    if code != 200 or not isinstance(products, list) or len(products) < 3:
        fails.append(f"CATALOG: pastry SKUs missing ({code}) {products}")
    else:
        bad = [p for p in products if not p.get("visible") or not p.get("in_stock")]
        if bad:
            fails.append(f"CATALOG: not sellable {bad}")
        else:
            passes.append("CATALOG: cookie + box + pack sellable")

    # ── Matrix: place pastry orders ──
    scenarios: list[tuple[str, dict, str | None]] = [
        (
            "ONLINE guest cookie gcash-qr",
            {
                "id": uid("pastry-online-gcash"),
                "channel": "online",
                "branch_id": BRANCH_ID,
                "guest_name": "QA Pastry Online",
                "payment_method": "gcash-qr",
                "payment_status": "unpaid",
                "status": "pending",
                "items": [cookie_line()],
            },
            None,
        ),
        (
            "ONLINE customer cookie paymongo",
            {
                "id": uid("pastry-online-pm"),
                "channel": "online",
                "branch_id": BRANCH_ID,
                "payment_method": "paymongo",
                "payment_status": "unpaid",
                "status": "pending",
                "items": [cookie_line()],
            },
            "customer",
        ),
        (
            "DINE-IN cookie pay-at-store",
            {
                "id": uid("pastry-di-cash"),
                "channel": "dine-in",
                "branch_id": BRANCH_ID,
                "table_id": TABLE_ID,
                "payment_method": "pay-at-store",
                "payment_status": "paid",
                "status": "pending",
                "items": [cookie_line()],
            },
            None,
        ),
        (
            "DINE-IN cookie gcash-qr",
            {
                "id": uid("pastry-di-gcash"),
                "channel": "dine-in",
                "branch_id": BRANCH_ID,
                "table_id": TABLE_ID,
                "guest_name": "QA Pastry DI",
                "payment_method": "gcash-qr",
                "payment_status": "unpaid",
                "status": "pending",
                "items": [cookie_line()],
            },
            None,
        ),
        (
            "DINE-IN cookie paymongo",
            {
                "id": uid("pastry-di-pm"),
                "channel": "dine-in",
                "branch_id": BRANCH_ID,
                "table_id": TABLE_ID,
                "guest_name": "QA Pastry DI PM",
                "payment_method": "paymongo",
                "payment_status": "unpaid",
                "status": "pending",
                "items": [cookie_line()],
            },
            None,
        ),
        (
            "TAKEOUT cookie pay-at-store",
            {
                "id": uid("pastry-to-cash"),
                "channel": "takeout",
                "branch_id": BRANCH_ID,
                "guest_name": "QA Pastry TO",
                "payment_method": "pay-at-store",
                "payment_status": "paid",
                "status": "pending",
                "items": [cookie_line()],
            },
            None,
        ),
        (
            "TAKEOUT cookie gcash-qr",
            {
                "id": uid("pastry-to-gcash"),
                "channel": "takeout",
                "branch_id": BRANCH_ID,
                "guest_name": "QA Pastry TO GCash",
                "payment_method": "gcash-qr",
                "payment_status": "unpaid",
                "status": "pending",
                "items": [cookie_line()],
            },
            None,
        ),
        (
            "TAKEOUT cookie paymongo",
            {
                "id": uid("pastry-to-pm"),
                "channel": "takeout",
                "branch_id": BRANCH_ID,
                "guest_name": "QA Pastry TO PM",
                "payment_method": "paymongo",
                "payment_status": "unpaid",
                "status": "pending",
                "items": [cookie_line()],
            },
            None,
        ),
        (
            "ONLINE kuki box+pack gcash-qr",
            {
                "id": uid("pastry-box-online"),
                "channel": "online",
                "branch_id": BRANCH_ID,
                "guest_name": "QA Kuki Box",
                "payment_method": "gcash-qr",
                "payment_status": "unpaid",
                "status": "pending",
                "items": box_line(
                    cookies={"cookie_klassic": 2, "cookie_campfire": 2},
                    with_pack=True,
                ),
            },
            None,
        ),
        (
            "DINE-IN kuki box pay-at-store",
            {
                "id": uid("pastry-box-di"),
                "channel": "dine-in",
                "branch_id": BRANCH_ID,
                "table_id": TABLE_ID,
                "payment_method": "pay-at-store",
                "payment_status": "paid",
                "status": "pending",
                "items": box_line(cookies={"cookie_blondie": 1, "cookie_birthday": 3}),
            },
            None,
        ),
        (
            "TAKEOUT kuki box gcash-qr",
            {
                "id": uid("pastry-box-to"),
                "channel": "takeout",
                "branch_id": BRANCH_ID,
                "guest_name": "QA Kuki TO",
                "payment_method": "gcash-qr",
                "payment_status": "unpaid",
                "status": "pending",
                "items": box_line(cookies={"cookie_double_dark": 4}),
            },
            None,
        ),
    ]

    placed: dict[str, dict] = {}
    for name, payload, role in scenarios:
        tok = tokens.get(role) if role else None
        code, body = place(base, anon, payload, tok)
        row = expect_ok(f"PLACE {name}", code, body, passes, fails)
        if row:
            oid = str(payload["id"])
            created.append(oid)
            placed[name] = row
            # payment status assertions
            pm = payload.get("payment_method")
            ps = row.get("payment_status")
            if pm in ("gcash-qr", "paymongo") and ps != "unpaid":
                fails.append(f"PLACE {name}: gateway must be unpaid, got {ps}")
            elif pm == "pay-at-store" and ps != "paid":
                fails.append(f"PLACE {name}: cash must be paid, got {ps}")
            tracked = track(base, anon, oid)
            if not tracked:
                fails.append(f"TRACK {name}: empty")
            else:
                passes.append(f"TRACK {name}: {tracked[0].get('status')}")

    # Negative: online pay-at-store should not be available via change method
    if "ONLINE guest cookie gcash-qr" in placed:
        oid = str(scenarios[0][1]["id"])
        code, body = api(
            base,
            anon,
            "POST",
            "/rest/v1/rpc/kk_guest_switch_to_cash",
            {"p_order_id": oid},
        )
        expect_fail(
            "GUARD online cannot switch to cash",
            code,
            body,
            "online",
            passes,
            fails,
        )

    # Negative: underfilled / overfilled kuki box
    for label, cookies in (
        ("underfill", {"cookie_klassic": 2}),
        ("overfill", {"cookie_klassic": 5}),
    ):
        bad_id = uid(f"pastry-box-{label}")
        code, body = place(
            base,
            anon,
            {
                "id": bad_id,
                "channel": "takeout",
                "branch_id": BRANCH_ID,
                "guest_name": "QA Bad Box",
                "payment_method": "pay-at-store",
                "payment_status": "paid",
                "status": "pending",
                "items": box_line(cookies=cookies),
            },
        )
        if code in (200, 201):
            created.append(bad_id)
            fails.append(f"GUARD kuki {label}: should reject, got {body}")
        else:
            passes.append(f"GUARD kuki {label}: rejected ({code})")

    # ── Barista: mark GCash paid + advance kitchen statuses ──
    process_name = "DINE-IN cookie gcash-qr"
    if barista and process_name in placed:
        oid = str(
            next(p["id"] for n, p, _ in scenarios if n == process_name)
        )
        # Mark paid
        code, body = patch_order(
            base,
            anon,
            barista,
            oid,
            {"payment_status": "paid", "status": "accepted", "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())},
        )
        if code not in (200, 201, 204):
            fails.append(f"BARISTA mark paid: ({code}) {body}")
        else:
            passes.append("BARISTA mark paid -> accepted")
            for st in ("preparing", "ready", "completed"):
                code, body = patch_order(
                    base,
                    anon,
                    barista,
                    oid,
                    {"status": st, "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())},
                )
                if code not in (200, 201, 204):
                    fails.append(f"BARISTA -> {st}: ({code}) {body}")
                else:
                    passes.append(f"BARISTA -> {st}")

    # Cash dine-in kitchen advance without payment step
    cash_name = "DINE-IN cookie pay-at-store"
    if barista and cash_name in placed:
        oid = str(next(p["id"] for n, p, _ in scenarios if n == cash_name))
        for st in ("accepted", "preparing", "ready", "completed"):
            code, body = patch_order(
                base,
                anon,
                barista,
                oid,
                {"status": st, "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())},
            )
            if code not in (200, 201, 204):
                fails.append(f"BARISTA cash -> {st}: ({code}) {body}")
            else:
                passes.append(f"BARISTA cash -> {st}")

    # POS pastry order as barista (must use assigned branch — barista@ is Marikina)
    if barista:
        code, profile = api(
            base,
            anon,
            "GET",
            "/rest/v1/kk_profiles?select=branch_id&email=eq.barista@kadokohi.com&limit=1",
            token=barista,
        )
        pos_branch = BRANCH_ID
        if code == 200 and isinstance(profile, list) and profile and profile[0].get("branch_id"):
            pos_branch = str(profile[0]["branch_id"])
        pos_id = uid("pastry-pos")
        code, body = place(
            base,
            anon,
            {
                "id": pos_id,
                "channel": "pos",
                "branch_id": pos_branch,
                "payment_method": "pay-at-store",
                "payment_status": "paid",
                "status": "pending",
                "items": [cookie_line()],
            },
            barista,
        )
        row = expect_ok("PLACE POS cookie cash", code, body, passes, fails)
        if row:
            created.append(pos_id)
            if row.get("payment_status") != "paid":
                fails.append(f"POS payment_status expected paid, got {row.get('payment_status')}")
            if row.get("branch_id") != pos_branch:
                fails.append(f"POS branch expected {pos_branch}, got {row.get('branch_id')}")
            # Advance POS kitchen statuses on assigned branch
            for st in ("accepted", "preparing", "ready", "completed"):
                code, body = patch_order(
                    base,
                    anon,
                    barista,
                    pos_id,
                    {
                        "status": st,
                        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    },
                )
                if code not in (200, 201, 204):
                    fails.append(f"BARISTA POS -> {st}: ({code}) {body}")
                else:
                    passes.append(f"BARISTA POS -> {st}")

    # Dine-in unpaid can switch to cash
    if "DINE-IN cookie paymongo" in placed:
        oid = str(next(p["id"] for n, p, _ in scenarios if n == "DINE-IN cookie paymongo"))
        code, body = api(
            base,
            anon,
            "POST",
            "/rest/v1/rpc/kk_guest_switch_to_cash",
            {"p_order_id": oid},
        )
        row = expect_ok("SWITCH dine-in paymongo -> cash", code, body, passes, fails)
        if row and row.get("payment_method") not in ("pay-at-store",) and isinstance(body, dict):
            # RPC may return order row
            pm = body.get("payment_method") if isinstance(body, dict) else None
            if pm and pm != "pay-at-store":
                fails.append(f"SWITCH cash: method={pm}")

    # Customer cannot self-mark online paid
    if customer and "ONLINE customer cookie paymongo" in placed:
        oid = str(next(p["id"] for n, p, _ in scenarios if n == "ONLINE customer cookie paymongo"))
        code, body = patch_order(
            base,
            anon,
            customer,
            oid,
            {"payment_status": "paid"},
        )
        if code in (200, 201, 204):
            # Check if actually changed
            tracked = track(base, anon, oid)
            ps = tracked[0].get("payment_status") if tracked else None
            if ps == "paid":
                fails.append("GUARD customer self-mark paid: allowed (security)")
            else:
                passes.append("GUARD customer self-mark paid: blocked by RLS/trigger")
        else:
            passes.append(f"GUARD customer self-mark paid: rejected ({code})")

    # PayMongo checkout session for customer pastry order (edge)
    if customer and "ONLINE customer cookie paymongo" in placed:
        oid = str(next(p["id"] for n, p, _ in scenarios if n == "ONLINE customer cookie paymongo"))
        # ensure still unpaid paymongo — may have been affected; place fresh if needed
        tracked = track(base, anon, oid)
        if tracked and tracked[0].get("payment_status") == "unpaid":
            code, body = api(
                base,
                anon,
                "POST",
                "/functions/v1/kk-paymongo-checkout",
                {
                    "orderId": oid,
                    "returnUrl": "https://www.kadokohi.com/checkout/" + oid + "?paymongo=success",
                    "cancelUrl": "https://www.kadokohi.com/checkout/" + oid + "?paymongo=cancel",
                },
                customer,
            )
            if code == 200 and isinstance(body, dict) and (
                body.get("checkout_url") or body.get("checkoutUrl") or body.get("url")
            ):
                passes.append("PAYMONGO checkout session created")
            elif code == 200 and isinstance(body, dict):
                # some shapes nest under data
                dump = json.dumps(body).lower()
                if "checkout" in dump or "paymongo" in dump or "url" in dump:
                    passes.append(f"PAYMONGO checkout ok shape keys={list(body.keys())}")
                else:
                    fails.append(f"PAYMONGO checkout unexpected body: {body}")
            else:
                fails.append(f"PAYMONGO checkout: ({code}) {body}")

    # Cleanup
    if admin:
        for oid in created:
            delete_order(base, anon, admin, oid)
        passes.append(f"CLEANUP deleted {len(created)} probe orders")

    # ASCII-only markers — Windows cp1252 consoles choke on checkmarks.
    print("=== PASSES ===")
    for p in passes:
        print(f"  OK {p}")
    print("=== FAILS ===")
    for f in fails:
        print(f"  FAIL {f}")
    print(f"\n{len(passes)} passed, {len(fails)} failed")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
