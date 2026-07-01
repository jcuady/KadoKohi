-- Atomic multi-scope admin reset RPC.
-- Replaces the row-by-row edge-function reset with a single transaction.
-- Scopes: 'all', 'transactional', 'orders', 'bookings', 'loyalty_activity', 'customers'.

CREATE OR REPLACE FUNCTION public.kk_admin_reset_data(
  p_scope          text,
  p_confirm_phrase text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expected_phrase text;
  v_result          jsonb := '{}'::jsonb;
  v_count           bigint;
BEGIN
  -- ── Guard: admin only ──
  IF public.kk_current_role() <> 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- ── Guard: phrase must match scope ──
  v_expected_phrase := CASE p_scope
    WHEN 'all'              THEN 'RESET ALL DATA'
    WHEN 'transactional'    THEN 'RESET TRANSACTIONAL DATA'
    WHEN 'orders'           THEN 'RESET ORDERS'
    WHEN 'bookings'         THEN 'RESET BOOKINGS'
    WHEN 'loyalty_activity' THEN 'RESET LOYALTY'
    WHEN 'customers'        THEN 'RESET CUSTOMERS'
    ELSE NULL
  END;

  IF v_expected_phrase IS NULL THEN
    RAISE EXCEPTION 'Unknown reset scope: %', p_scope;
  END IF;

  IF p_confirm_phrase IS DISTINCT FROM v_expected_phrase THEN
    RAISE EXCEPTION 'Confirmation phrase does not match. Type "%" to confirm.', v_expected_phrase;
  END IF;

  -- ══════════════════════════════════════════════════════════════════════
  -- Helper: count before delete so we can report what was removed.
  -- We build up v_result as we go.
  -- ══════════════════════════════════════════════════════════════════════

  -- ── 1. Order pipeline (scopes: all, transactional, orders, customers) ──
  IF p_scope IN ('all', 'transactional', 'orders', 'customers') THEN
    -- Unlink loyalty vouchers from orders first
    UPDATE kk_loyalty_vouchers SET redeemed_order_id = NULL
      WHERE redeemed_order_id IS NOT NULL;

    SELECT count(*) INTO v_count FROM kk_order_items;
    DELETE FROM kk_order_items;
    v_result := v_result || jsonb_build_object('kk_order_items', v_count);

    -- payment_transactions references orders
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'kk_payment_transactions'
    ) THEN
      SELECT count(*) INTO v_count FROM kk_payment_transactions;
      DELETE FROM kk_payment_transactions;
      v_result := v_result || jsonb_build_object('kk_payment_transactions', v_count);
    END IF;

    SELECT count(*) INTO v_count FROM kk_promo_claims;
    DELETE FROM kk_promo_claims;
    v_result := v_result || jsonb_build_object('kk_promo_claims', v_count);

    SELECT count(*) INTO v_count FROM kk_orders;
    DELETE FROM kk_orders;
    v_result := v_result || jsonb_build_object('kk_orders', v_count);
  END IF;

  -- ── 2. Booth bookings (scopes: all, transactional, bookings, customers) ──
  IF p_scope IN ('all', 'transactional', 'bookings', 'customers') THEN
    SELECT count(*) INTO v_count FROM kk_booth_bookings;
    DELETE FROM kk_booth_bookings;
    v_result := v_result || jsonb_build_object('kk_booth_bookings', v_count);
  END IF;

  -- ── 3. Event registrations (scopes: all, transactional, customers) ──
  IF p_scope IN ('all', 'transactional', 'customers') THEN
    SELECT count(*) INTO v_count FROM kk_event_registrations;
    DELETE FROM kk_event_registrations;
    v_result := v_result || jsonb_build_object('kk_event_registrations', v_count);
  END IF;

  -- ── 4. Event date blockouts (scopes: all, transactional, bookings) ──
  IF p_scope IN ('all', 'transactional', 'bookings') THEN
    SELECT count(*) INTO v_count FROM kk_event_date_blockouts;
    DELETE FROM kk_event_date_blockouts;
    v_result := v_result || jsonb_build_object('kk_event_date_blockouts', v_count);
  END IF;

  -- ── 5. Career applications (scopes: all, transactional) ──
  IF p_scope IN ('all', 'transactional') THEN
    SELECT count(*) INTO v_count FROM kk_career_applications;
    DELETE FROM kk_career_applications;
    v_result := v_result || jsonb_build_object('kk_career_applications', v_count);
  END IF;

  -- ── 6. Audit logs (scopes: all, transactional) ──
  IF p_scope IN ('all', 'transactional') THEN
    SELECT count(*) INTO v_count FROM kk_audit_logs;
    DELETE FROM kk_audit_logs;
    v_result := v_result || jsonb_build_object('kk_audit_logs', v_count);
  END IF;

  -- ── 7. Push subscriptions (scopes: all, transactional, customers) ──
  IF p_scope IN ('all', 'transactional', 'customers') THEN
    SELECT count(*) INTO v_count FROM kk_push_subscriptions;
    DELETE FROM kk_push_subscriptions;
    v_result := v_result || jsonb_build_object('kk_push_subscriptions', v_count);
  END IF;

  -- ── 8. Loyalty activity (scopes: all, transactional, loyalty_activity, customers) ──
  IF p_scope IN ('all', 'transactional', 'loyalty_activity', 'customers') THEN
    SELECT count(*) INTO v_count FROM kk_loyalty_vouchers;
    DELETE FROM kk_loyalty_vouchers;
    v_result := v_result || jsonb_build_object('kk_loyalty_vouchers', v_count);

    UPDATE kk_profiles SET loyalty_stamps = 0;
    v_result := v_result || jsonb_build_object('stamps_zeroed', true);
  END IF;

  -- ── 9. Promo codes (scopes: all — transactional only deletes claims above) ──
  IF p_scope = 'all' THEN
    SELECT count(*) INTO v_count FROM kk_promo_codes;
    DELETE FROM kk_promo_codes;
    v_result := v_result || jsonb_build_object('kk_promo_codes', v_count);
  END IF;

  -- ── 10. Non-admin profiles (scopes: all, transactional, customers) ──
  --   Auth user deletion must happen in the edge function (needs service role).
  --   Here we delete the profile rows; the edge fn handles auth.users afterward.
  IF p_scope IN ('all', 'transactional', 'customers') THEN
    SELECT count(*) INTO v_count FROM kk_profiles WHERE role <> 'admin';
    DELETE FROM kk_profiles WHERE role <> 'admin';
    v_result := v_result || jsonb_build_object('profiles_removed', v_count);

    -- Zero admin stamps + clear branch assignment
    UPDATE kk_profiles SET loyalty_stamps = 0, branch_id = NULL WHERE role = 'admin';
    v_result := v_result || jsonb_build_object('admin_stamps_zeroed', true);
  END IF;

  -- ── 11. Non-Marikina branches (scope: transactional) ──
  IF p_scope = 'transactional' THEN
    -- Tables referencing branches: delete non-Marikina tables first
    DELETE FROM kk_tables WHERE branch_id <> 'branch_marikina';

    SELECT count(*) INTO v_count FROM kk_branches WHERE id <> 'branch_marikina';
    DELETE FROM kk_branches WHERE id <> 'branch_marikina';
    v_result := v_result || jsonb_build_object('branches_removed', v_count);
  END IF;

  -- ── 12. Full catalog wipe (scope: all) ──
  IF p_scope = 'all' THEN
    SELECT count(*) INTO v_count FROM kk_tables;
    DELETE FROM kk_tables;
    v_result := v_result || jsonb_build_object('kk_tables', v_count);

    SELECT count(*) INTO v_count FROM kk_products;
    DELETE FROM kk_products;
    v_result := v_result || jsonb_build_object('kk_products', v_count);

    SELECT count(*) INTO v_count FROM kk_menu_categories;
    DELETE FROM kk_menu_categories;
    v_result := v_result || jsonb_build_object('kk_menu_categories', v_count);

    -- Merch catalog
    SELECT count(*) INTO v_count FROM kk_merch_products;
    DELETE FROM kk_merch_products;
    v_result := v_result || jsonb_build_object('kk_merch_products', v_count);

    SELECT count(*) INTO v_count FROM kk_merch_categories;
    DELETE FROM kk_merch_categories;
    v_result := v_result || jsonb_build_object('kk_merch_categories', v_count);

    -- Events + forms
    SELECT count(*) INTO v_count FROM kk_events;
    DELETE FROM kk_events;
    v_result := v_result || jsonb_build_object('kk_events', v_count);

    SELECT count(*) INTO v_count FROM kk_event_forms;
    DELETE FROM kk_event_forms;
    v_result := v_result || jsonb_build_object('kk_event_forms', v_count);

    -- Loyalty reward definitions
    SELECT count(*) INTO v_count FROM kk_loyalty_rewards;
    DELETE FROM kk_loyalty_rewards;
    v_result := v_result || jsonb_build_object('kk_loyalty_rewards', v_count);

    -- Blog
    SELECT count(*) INTO v_count FROM kk_blog_posts;
    DELETE FROM kk_blog_posts;
    v_result := v_result || jsonb_build_object('kk_blog_posts', v_count);

    -- Branches (all)
    SELECT count(*) INTO v_count FROM kk_branches;
    DELETE FROM kk_branches;
    v_result := v_result || jsonb_build_object('kk_branches', v_count);

    -- Reset kk_app_settings to bare defaults (all columns)
    UPDATE kk_app_settings SET
      tax_rate         = 0,
      gcash_qr_image   = NULL,
      order_hours      = '{}'::jsonb,
      landing_content  = NULL,
      home_sections    = NULL,
      booth_content    = NULL,
      booth_catalog    = NULL,
      matcha_content   = NULL,
      careers_content  = NULL;
    v_result := v_result || jsonb_build_object('settings_reset', true);
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'scope',   p_scope,
    'deleted', v_result
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.kk_admin_reset_data(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_admin_reset_data(text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
