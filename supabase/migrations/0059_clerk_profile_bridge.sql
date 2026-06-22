-- Clerk auth bridge: map Clerk JWT sub → kk_profiles.id while preserving existing UUID FKs.

ALTER TABLE public.kk_profiles
  ADD COLUMN IF NOT EXISTS clerk_user_id text;

CREATE UNIQUE INDEX IF NOT EXISTS kk_profiles_clerk_user_id_key
  ON public.kk_profiles (clerk_user_id)
  WHERE clerk_user_id IS NOT NULL;

-- JWT subject: Clerk user id (user_…) or legacy Supabase auth uuid during cutover.
CREATE OR REPLACE FUNCTION public.kk_requesting_user_sub()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(trim(auth.jwt() ->> 'sub'), ''),
    auth.uid()::text
  );
$$;

CREATE OR REPLACE FUNCTION public.requesting_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.id FROM public.kk_profiles p WHERE p.clerk_user_id = public.kk_requesting_user_sub() LIMIT 1),
    (SELECT p.id FROM public.kk_profiles p WHERE p.id = auth.uid() LIMIT 1)
  );
$$;

CREATE OR REPLACE FUNCTION public.kk_requesting_actor_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.email::text
  FROM public.kk_profiles p
  WHERE p.id = public.requesting_profile_id()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.kk_current_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT role FROM public.kk_profiles WHERE id = public.requesting_profile_id();
$$;

CREATE OR REPLACE FUNCTION public.kk_current_branch()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT branch_id FROM public.kk_profiles WHERE id = public.requesting_profile_id();
$$;

-- Fallback profile row when webhook has not run yet (authenticated Clerk users only).
CREATE OR REPLACE FUNCTION public.kk_ensure_my_profile(p_name text DEFAULT NULL)
RETURNS public.kk_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub text := public.kk_requesting_user_sub();
  v_profile_id uuid := public.requesting_profile_id();
  v_email text := COALESCE(NULLIF(trim(auth.jwt() ->> 'email'), ''), '');
  v_name text;
  v_row public.kk_profiles;
BEGIN
  IF v_sub IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_name := COALESCE(
    NULLIF(trim(p_name), ''),
    NULLIF(trim(auth.jwt() -> 'user_metadata' ->> 'name'), ''),
    NULLIF(trim(auth.jwt() -> 'unsafe_metadata' ->> 'name'), ''),
    split_part(NULLIF(v_email, ''), '@', 1),
    'User'
  );

  IF v_profile_id IS NOT NULL THEN
    UPDATE public.kk_profiles
    SET
      clerk_user_id = COALESCE(clerk_user_id, v_sub),
      name = COALESCE(NULLIF(trim(p_name), ''), name),
      email = CASE WHEN v_email <> '' THEN v_email ELSE email END
    WHERE id = v_profile_id
    RETURNING * INTO v_row;
    RETURN v_row;
  END IF;

  INSERT INTO public.kk_profiles (id, clerk_user_id, email, name, role, loyalty_stamps)
  VALUES (gen_random_uuid(), v_sub, COALESCE(v_email, ''), v_name, 'customer', 0)
  ON CONFLICT (clerk_user_id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, public.kk_profiles.name),
    email = COALESCE(NULLIF(EXCLUDED.email, ''), public.kk_profiles.email)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.kk_requesting_user_sub() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.requesting_profile_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.kk_requesting_actor_email() TO authenticated, anon;

DROP TRIGGER IF EXISTS kk_on_auth_user_created ON auth.users;

-- ── kk_profiles RLS ──
DROP POLICY IF EXISTS kk_profiles_select_own ON public.kk_profiles;
DROP POLICY IF EXISTS kk_profiles_select_self_or_internal ON public.kk_profiles;
DROP POLICY IF EXISTS kk_profiles_update_own ON public.kk_profiles;
DROP POLICY IF EXISTS kk_profiles_update_self_or_admin ON public.kk_profiles;
DROP POLICY IF EXISTS kk_profiles_insert_self_or_admin ON public.kk_profiles;

CREATE POLICY kk_profiles_select_self_or_internal
  ON public.kk_profiles FOR SELECT TO authenticated
  USING (
    id = public.requesting_profile_id()
    OR public.kk_current_role() = 'admin'
    OR (
      public.kk_current_role() IN ('barista', 'staff')
      AND branch_id = public.kk_current_branch()
    )
  );

CREATE POLICY kk_profiles_update_self_or_admin
  ON public.kk_profiles FOR UPDATE TO authenticated
  USING (id = public.requesting_profile_id() OR public.kk_current_role() = 'admin')
  WITH CHECK (
    (
      id = public.requesting_profile_id()
      AND role = (SELECT p.role FROM public.kk_profiles p WHERE p.id = public.requesting_profile_id())
    )
    OR public.kk_current_role() = 'admin'
  );

CREATE POLICY kk_profiles_insert_self_or_admin
  ON public.kk_profiles FOR INSERT TO authenticated
  WITH CHECK (
    (id = public.requesting_profile_id() AND role = 'customer')
    OR public.kk_current_role() = 'admin'
  );

-- ── kk_orders ──
DROP POLICY IF EXISTS kk_orders_select_customer ON public.kk_orders;
DROP POLICY IF EXISTS kk_orders_select_customer_or_internal ON public.kk_orders;
DROP POLICY IF EXISTS kk_orders_update_customer_or_internal ON public.kk_orders;

CREATE POLICY kk_orders_select_customer
  ON public.kk_orders FOR SELECT TO authenticated
  USING (public.kk_current_role() = 'customer' AND customer_id = public.requesting_profile_id());

CREATE POLICY kk_orders_select_customer_or_internal
  ON public.kk_orders FOR SELECT TO authenticated
  USING (
    customer_id = public.requesting_profile_id()
    OR public.kk_current_role() = 'admin'
    OR (
      public.kk_current_role() IN ('barista', 'staff')
      AND branch_id = public.kk_current_branch()
    )
  );

CREATE POLICY kk_orders_update_customer_or_internal
  ON public.kk_orders FOR UPDATE TO authenticated
  USING (
    customer_id = public.requesting_profile_id()
    OR public.kk_current_role() = 'admin'
    OR (
      public.kk_current_role() IN ('barista', 'staff')
      AND branch_id = public.kk_current_branch()
    )
  )
  WITH CHECK (
    customer_id = public.requesting_profile_id()
    OR public.kk_current_role() = 'admin'
    OR (
      public.kk_current_role() IN ('barista', 'staff')
      AND branch_id = public.kk_current_branch()
    )
  );

-- ── kk_order_items ──
DROP POLICY IF EXISTS kk_order_items_select_by_parent_access ON public.kk_order_items;
CREATE POLICY kk_order_items_select_by_parent_access
  ON public.kk_order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kk_orders o
      WHERE o.id = kk_order_items.order_id
        AND (
          o.customer_id = public.requesting_profile_id()
          OR public.kk_current_role() = 'admin'
          OR (
            public.kk_current_role() IN ('barista', 'staff')
            AND o.branch_id = public.kk_current_branch()
          )
        )
    )
  );

-- ── kk_payment_transactions ──
DROP POLICY IF EXISTS kk_payments_select_customer_or_internal ON public.kk_payment_transactions;
DROP POLICY IF EXISTS kk_payments_insert_customer_or_internal ON public.kk_payment_transactions;

CREATE POLICY kk_payments_select_customer_or_internal
  ON public.kk_payment_transactions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kk_orders o
      WHERE o.id = kk_payment_transactions.order_id
        AND (
          o.customer_id = public.requesting_profile_id()
          OR public.kk_current_role() = 'admin'
          OR (
            public.kk_current_role() IN ('barista', 'staff')
            AND o.branch_id = public.kk_current_branch()
          )
        )
    )
  );

CREATE POLICY kk_payments_insert_customer_or_internal
  ON public.kk_payment_transactions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kk_orders o
      WHERE o.id = kk_payment_transactions.order_id
        AND (
          o.customer_id = public.requesting_profile_id()
          OR public.kk_current_role() = 'admin'
          OR (
            public.kk_current_role() IN ('barista', 'staff')
            AND o.branch_id = public.kk_current_branch()
          )
        )
    )
  );

-- ── kk_booth_bookings ──
DROP POLICY IF EXISTS kk_booth_bookings_select ON public.kk_booth_bookings;
DROP POLICY IF EXISTS kk_booth_bookings_customer_update ON public.kk_booth_bookings;

CREATE POLICY kk_booth_bookings_select
  ON public.kk_booth_bookings FOR SELECT TO authenticated
  USING (
    customer_id = public.requesting_profile_id()
    OR public.kk_current_role() IN ('admin', 'barista', 'staff')
  );

CREATE POLICY kk_booth_bookings_customer_update
  ON public.kk_booth_bookings FOR UPDATE TO authenticated
  USING (customer_id = public.requesting_profile_id())
  WITH CHECK (customer_id = public.requesting_profile_id());

-- ── kk_promo_claims ──
DROP POLICY IF EXISTS kk_promo_claims_select ON public.kk_promo_claims;
DROP POLICY IF EXISTS kk_promo_claims_insert ON public.kk_promo_claims;

CREATE POLICY kk_promo_claims_select
  ON public.kk_promo_claims FOR SELECT TO authenticated
  USING (public.kk_current_role() = 'admin' OR customer_id = public.requesting_profile_id());

CREATE POLICY kk_promo_claims_insert
  ON public.kk_promo_claims FOR INSERT TO authenticated
  WITH CHECK (
    customer_id IS NULL
    OR customer_id = public.requesting_profile_id()
    OR public.kk_current_role() = 'admin'
  );

-- ── kk_push_subscriptions ──
DROP POLICY IF EXISTS kk_push_subscriptions_self ON public.kk_push_subscriptions;
CREATE POLICY kk_push_subscriptions_self
  ON public.kk_push_subscriptions FOR ALL TO authenticated
  USING (user_id = public.requesting_profile_id())
  WITH CHECK (user_id = public.requesting_profile_id());

-- ── kk_audit_logs ──
DROP POLICY IF EXISTS kk_audit_logs_insert_own ON public.kk_audit_logs;
DROP POLICY IF EXISTS kk_audit_logs_insert_self ON public.kk_audit_logs;

CREATE POLICY kk_audit_logs_insert_self
  ON public.kk_audit_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id = public.requesting_profile_id());

-- ── payment proof storage (folder = profile uuid) ──
DROP POLICY IF EXISTS kado_payment_proofs_select ON storage.objects;
DROP POLICY IF EXISTS kado_payment_proofs_insert ON storage.objects;
DROP POLICY IF EXISTS kado_payment_proofs_update ON storage.objects;

CREATE POLICY kado_payment_proofs_select
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'kado-payment-proofs'
    AND (
      (storage.foldername(name))[1] = public.requesting_profile_id()::text
      OR public.kk_current_role() IN ('admin', 'barista', 'staff')
    )
  );

CREATE POLICY kado_payment_proofs_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'kado-payment-proofs'
    AND (storage.foldername(name))[1] = public.requesting_profile_id()::text
  );

CREATE POLICY kado_payment_proofs_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'kado-payment-proofs'
    AND (
      (storage.foldername(name))[1] = public.requesting_profile_id()::text
      OR public.kk_current_role() IN ('admin', 'barista', 'staff')
    )
  )
  WITH CHECK (
    bucket_id = 'kado-payment-proofs'
    AND (
      (storage.foldername(name))[1] = public.requesting_profile_id()::text
      OR public.kk_current_role() IN ('admin', 'barista', 'staff')
    )
  );

-- Patch kk_place_order to resolve profile id from Clerk JWT.
DO $patch$
DECLARE
  v_def text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'kk_place_order'
    AND pg_get_function_arguments(p.oid) = 'payload jsonb';

  IF v_def IS NULL THEN
    RAISE EXCEPTION 'kk_place_order(jsonb) not found';
  END IF;

  v_def := replace(v_def, 'v_uid uuid := auth.uid();', 'v_uid uuid := public.requesting_profile_id();');
  v_def := replace(v_def, 'FROM auth.users u WHERE u.id = v_uid', 'FROM public.kk_profiles p WHERE p.id = v_uid');
  v_def := replace(v_def, 'u.email::text', 'p.email::text');
  EXECUTE v_def;
END $patch$;

-- Patch audit RPCs that still read auth.users.
CREATE OR REPLACE FUNCTION public.kk_admin_delete_order(p_order_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.kk_orders%ROWTYPE;
  v_uid uuid := public.requesting_profile_id();
BEGIN
  IF public.kk_current_role() <> 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_order_id IS NULL OR length(trim(p_order_id)) = 0 OR length(p_order_id) > 64 THEN
    RAISE EXCEPTION 'Invalid order id';
  END IF;

  SELECT * INTO v_order FROM public.kk_orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or already deleted';
  END IF;

  DELETE FROM public.kk_promo_claims WHERE order_id = p_order_id;

  UPDATE public.kk_loyalty_vouchers
  SET redeemed_order_id = NULL
  WHERE redeemed_order_id = p_order_id;

  DELETE FROM public.kk_orders WHERE id = p_order_id;

  PERFORM public.kk_write_audit(
    v_uid,
    public.kk_requesting_actor_email(),
    'admin',
    'order.deleted',
    'order',
    p_order_id,
    v_order.branch_id,
    'Deleted ' || v_order.short_code,
    jsonb_build_object('channel', v_order.channel, 'status', v_order.status, 'total', v_order.total)
  );

  RETURN jsonb_build_object('ok', true, 'id', p_order_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.kk_submit_guest_payment_proof(
  p_order_id text,
  p_proof_data_url text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.kk_orders%ROWTYPE;
  v_proof text;
  v_uid uuid := public.requesting_profile_id();
BEGIN
  IF p_order_id IS NULL OR length(trim(p_order_id)) = 0 OR length(p_order_id) > 64 THEN
    RAISE EXCEPTION 'Invalid order id';
  END IF;

  v_proof := trim(p_proof_data_url);
  IF v_proof IS NULL OR length(v_proof) < 32 THEN
    RAISE EXCEPTION 'Proof image is required';
  END IF;

  IF v_proof LIKE 'data:image/%' THEN
    IF length(v_proof) > 1500000 THEN
      RAISE EXCEPTION 'Proof image is too large. Use a smaller screenshot or crop the receipt.';
    END IF;
  ELSIF v_proof LIKE 'proof-storage:guest/%' THEN
    IF length(v_proof) > 256 THEN
      RAISE EXCEPTION 'Invalid proof storage reference';
    END IF;
    IF v_proof NOT LIKE ('proof-storage:guest/' || p_order_id || '/%') THEN
      RAISE EXCEPTION 'Proof path does not match this order';
    END IF;
  ELSIF v_proof LIKE 'proof-storage:%' THEN
    IF length(v_proof) > 256 THEN
      RAISE EXCEPTION 'Invalid proof storage reference';
    END IF;
    IF v_proof NOT LIKE ('%/' || p_order_id || '-proof%') THEN
      RAISE EXCEPTION 'Proof path does not match this order';
    END IF;
  ELSIF v_proof LIKE 'https://%' THEN
    IF length(v_proof) > 2048 THEN
      RAISE EXCEPTION 'Invalid proof URL';
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid proof image format';
  END IF;

  SELECT * INTO v_order FROM public.kk_orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.channel NOT IN ('dine-in', 'takeout', 'online') THEN
    RAISE EXCEPTION 'Proof upload is not allowed for this order';
  END IF;

  IF v_order.payment_method IS DISTINCT FROM 'gcash-qr' THEN
    RAISE EXCEPTION 'Not a GCash order';
  END IF;

  IF v_order.payment_status NOT IN ('unpaid', 'proof_submitted') THEN
    RAISE EXCEPTION 'Payment already verified';
  END IF;

  UPDATE public.kk_orders
  SET
    payment_proof_image = v_proof,
    payment_proof_uploaded_at = now(),
    payment_status = 'proof_submitted',
    updated_at = now()
  WHERE id = p_order_id;

  PERFORM public.kk_write_audit(
    v_uid,
    public.kk_requesting_actor_email(),
    CASE WHEN v_uid IS NULL THEN 'guest' ELSE coalesce(public.kk_current_role(), 'customer') END,
    'order.proof_submitted',
    'order',
    p_order_id,
    v_order.branch_id,
    'Payment proof submitted for ' || v_order.short_code,
    jsonb_build_object('channel', v_order.channel, 'short_code', v_order.short_code)
  );

  RETURN jsonb_build_object(
    'id', p_order_id,
    'payment_status', 'proof_submitted',
    'updated_at', now()
  );
END;
$$;

NOTIFY pgrst, 'reload schema';
