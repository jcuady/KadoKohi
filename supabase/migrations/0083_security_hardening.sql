-- Close permissive order/payment INSERT paths; lock down internal RPCs; harden search_path.

-- ── 1. Remove zombie / permissive INSERT policies (orders must use kk_place_order) ──
DROP POLICY IF EXISTS orders_customer_insert ON public.kk_orders;
DROP POLICY IF EXISTS order_items_insert ON public.kk_order_items;
DROP POLICY IF EXISTS payments_insert ON public.kk_payment_transactions;

REVOKE INSERT ON TABLE public.kk_orders FROM anon, authenticated;
REVOKE INSERT ON TABLE public.kk_order_items FROM anon, authenticated;
REVOKE INSERT ON TABLE public.kk_payment_transactions FROM anon, authenticated;

-- ── 2. Internal-only RPCs: callable only via SECURITY DEFINER paths ──
REVOKE ALL ON FUNCTION public.increment_promo_uses(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_promo_uses(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_promo_uses(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.kk_write_audit(
  uuid, text, text, text, text, text, text, text, jsonb
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.kk_write_audit(
  uuid, text, text, text, text, text, text, text, jsonb
) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kk_write_audit(
  uuid, text, text, text, text, text, text, text, jsonb
) TO service_role;

REVOKE ALL ON FUNCTION public.kk_sync_merch_product_into_menu() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.kk_sync_merch_product_into_menu() FROM anon, authenticated;

-- ── 3. Pin search_path on helpers (advisor: function_search_path_mutable) ──
ALTER FUNCTION public.kk_jsonb_option_delta(jsonb, text) SET search_path = public;
ALTER FUNCTION public.kk_merch_variant_delta(jsonb) SET search_path = public;
ALTER FUNCTION public.kk_compute_unit_price(public.kk_products, text, text, jsonb) SET search_path = public;
ALTER FUNCTION public.kk_compute_promo_discount(public.kk_promo_codes, numeric, jsonb) SET search_path = public;
ALTER FUNCTION public.kk_compute_loyalty_discount(text, numeric, numeric, jsonb) SET search_path = public;
ALTER FUNCTION public.kk_event_date_local(timestamptz) SET search_path = public;
ALTER FUNCTION public.kk_product_has_tag(public.kk_products, text) SET search_path = public;
ALTER FUNCTION public.kk_is_mix_match_cookie(public.kk_products) SET search_path = public;
ALTER FUNCTION public.kk_requesting_user_sub() SET search_path = public;
ALTER FUNCTION public.kk_is_uuid_text(text) SET search_path = public;
ALTER FUNCTION public.kk_try_uuid_from_text(text) SET search_path = public;
ALTER FUNCTION public.kk_set_updated_at() SET search_path = public;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'kk_handle_new_auth_user'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    ALTER FUNCTION public.kk_handle_new_auth_user() SET search_path = public;
  END IF;
END $$;

-- ── 4. Drop duplicate audit index (keep kk_audit_logs_created_idx) ──
DROP INDEX IF EXISTS public.kk_audit_logs_created_at_idx;

-- ── 5. Hot-path FK indexes (advisor: unindexed_foreign_keys) ──
CREATE INDEX IF NOT EXISTS kk_orders_table_id_idx ON public.kk_orders (table_id);
CREATE INDEX IF NOT EXISTS kk_orders_staff_id_idx ON public.kk_orders (staff_id);
CREATE INDEX IF NOT EXISTS kk_orders_promo_code_id_idx ON public.kk_orders (promo_code_id);
CREATE INDEX IF NOT EXISTS kk_payment_transactions_order_id_idx ON public.kk_payment_transactions (order_id);
