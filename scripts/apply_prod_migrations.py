"""
Apply missing Supabase migrations to the production project (idwtlujcdfnnndxmlaco)
via the Management API. Run with: python scripts/apply_prod_migrations.py
"""
import json, urllib.request, urllib.error, pathlib, sys

TOKEN = "sbp_a961f11da4e69108b619801ef1a90a948582d28a"
REF   = "idwtlujcdfnnndxmlaco"
API   = f"https://api.supabase.com/v1/projects/{REF}/database/query"

ROOT  = pathlib.Path(__file__).resolve().parent.parent / "supabase" / "migrations"

MIGRATIONS = [
    "0021_menu_v2_catalog.sql",
    "0022_cleanup_legacy_menu.sql",
    "0023_ensure_menu_catalog_rpc.sql",
    "0024_ensure_default_tables.sql",
    "0025_qr_payment_guest_proof.sql",
    "0026_gcash_qr_storage_and_settings.sql",
    "0027_guest_proof_size_and_storage.sql",
    "0028_product_in_stock.sql",
    "0028b_place_order_in_stock.sql",
]


def run_sql(name: str, sql: str) -> None:
    body = json.dumps({"query": sql}).encode()
    req  = urllib.request.Request(
        API,
        data    = body,
        headers = {
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type":  "application/json",
            "User-Agent":    "supabase-py/2.0",
        },
        method = "POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
            print(f"  OK  {name}: {result}")
    except urllib.error.HTTPError as e:
        body_bytes = e.read()
        print(f"  ERR {name}: HTTP {e.code} — {body_bytes.decode()}", file=sys.stderr)
        sys.exit(1)


def main() -> None:
    print(f"Target: {API}\n")
    for fname in MIGRATIONS:
        path = ROOT / fname
        if not path.exists():
            # Try Windows-style path separator variant
            for p in ROOT.parent.glob(f"migrations/{fname}"):
                path = p
                break
        if not path.exists():
            print(f"  SKIP {fname} (file not found)")
            continue
        sql = path.read_text(encoding="utf-8")
        print(f"  Applying {fname} …")
        run_sql(fname, sql)
    print("\nAll done.")


if __name__ == "__main__":
    main()
