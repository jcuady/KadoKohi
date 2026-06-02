from pathlib import Path

src = Path("supabase/migrations/0017_voucher_branch_scope.sql").read_text(encoding="utf-8")
start = src.index("CREATE OR REPLACE FUNCTION public.kk_place_order")
end = src.index("REVOKE ALL ON FUNCTION public.kk_place_order", start)
fn = src[start:end]
old = """    WHERE id = nullif(trim(v_item->>'product_id'), '')
      AND visible = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % is not available', v_item->>'product_id';"""
new = """    WHERE id = nullif(trim(v_item->>'product_id'), '')
      AND visible = true
      AND coalesce(in_stock, true) = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % is not available or out of stock', v_item->>'product_id';"""
if old not in fn:
    raise SystemExit("pattern not found in kk_place_order")
fn = fn.replace(old, new)
out = Path("supabase/migrations/0028b_place_order_in_stock.sql")
out.write_text("-- Enforce in_stock on kk_place_order\n\n" + fn, encoding="utf-8")
print("wrote", out)
