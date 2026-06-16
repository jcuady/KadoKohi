-- Revoke anon execute on staff/admin RPCs (functions still enforce kk_current_role internally).
REVOKE EXECUTE ON FUNCTION public.kk_admin_delete_order(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.kk_admin_delete_table(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.kk_admin_toggle_event_blockout(date, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.kk_set_product_in_stock(text, boolean) FROM anon;

DO $$
BEGIN
  IF to_regprocedure('public.kk_reset_operational_data()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.kk_reset_operational_data() FROM anon';
  END IF;
END $$;

-- Admin order board + guest tracking
CREATE INDEX IF NOT EXISTS kk_orders_created_at_idx ON public.kk_orders (created_at DESC);

-- Public menu + admin catalog
CREATE INDEX IF NOT EXISTS kk_products_category_visible_idx
  ON public.kk_products (category_id, visible)
  WHERE visible = true;

-- QR table lookup by branch + code
CREATE INDEX IF NOT EXISTS kk_tables_branch_code_active_idx
  ON public.kk_tables (branch_id, code)
  WHERE active = true;
