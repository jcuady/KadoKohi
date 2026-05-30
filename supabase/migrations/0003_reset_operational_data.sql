-- Admin-only operational reset: clears transactional data and non-admin users.
-- Preserves kk_app_settings (store hours, tax, GCash QR, contact info), menu, branches, tables, promo code definitions.
-- Callable only when the shop is outside online order hours (same 10-min cutoff as checkout).

CREATE OR REPLACE FUNCTION public.kk_reset_operational_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hours jsonb;
  v_open text;
  v_close text;
  v_open_min int;
  v_close_min int;
  v_last_order_min int;
  v_now_min int;
  v_manila timestamptz;
  v_deleted_users int := 0;
BEGIN
  SELECT order_hours INTO v_hours
  FROM public.kk_app_settings
  WHERE id = true
  LIMIT 1;

  v_open := COALESCE(v_hours->>'defaultOpenTime', '07:00');
  v_close := COALESCE(v_hours->>'defaultCloseTime', '23:00');

  v_open_min := (
    split_part(v_open, ':', 1)::int * 60 + split_part(v_open, ':', 2)::int
  );
  v_close_min := (
    split_part(v_close, ':', 1)::int * 60 + split_part(v_close, ':', 2)::int
  );
  v_last_order_min := v_close_min - 10;

  v_manila := timezone('Asia/Manila', now());
  v_now_min := EXTRACT(HOUR FROM v_manila)::int * 60 + EXTRACT(MINUTE FROM v_manila)::int;

  IF v_open_min >= v_close_min OR v_last_order_min < v_open_min THEN
    RAISE EXCEPTION 'STORE_HOURS_INVALID';
  END IF;

  IF v_now_min >= v_open_min AND v_now_min <= v_last_order_min THEN
    RAISE EXCEPTION 'STORE_OPEN';
  END IF;

  DELETE FROM public.kk_order_items;
  DELETE FROM public.kk_orders;

  IF to_regclass('public.kk_payment_transactions') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.kk_payment_transactions';
  END IF;

  IF to_regclass('public.kk_promo_claims') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.kk_promo_claims';
  END IF;

  IF to_regclass('public.kk_promo_codes') IS NOT NULL THEN
    EXECUTE 'UPDATE public.kk_promo_codes SET uses_count = 0 WHERE uses_count IS NOT NULL';
  END IF;

  DELETE FROM public.kk_audit_logs;

  IF to_regclass('public.kk_push_subscriptions') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.kk_push_subscriptions';
  END IF;

  SELECT count(*)::int INTO v_deleted_users
  FROM public.kk_profiles
  WHERE role IS DISTINCT FROM 'admin';

  DELETE FROM public.kk_profiles
  WHERE role IS DISTINCT FROM 'admin';

  RETURN jsonb_build_object(
    'ok', true,
    'deletedProfiles', v_deleted_users,
    'preserved', jsonb_build_array(
      'admin accounts',
      'store settings & hours',
      'menu',
      'branches',
      'tables & QR',
      'voucher definitions'
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.kk_reset_operational_data() FROM PUBLIC;
