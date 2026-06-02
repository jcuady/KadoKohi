-- Promo + loyalty vouchers: universal (branch_id NULL) or per-branch scope.

DO $$
BEGIN
  ALTER TABLE public.kk_promo_codes ADD COLUMN IF NOT EXISTS branch_id text;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.kk_loyalty_rewards (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  stamps_required int NOT NULL DEFAULT 1 CHECK (stamps_required > 0),
  type text NOT NULL CHECK (type IN ('free_drink', 'discount_percent', 'discount_fixed', 'free_merch', 'custom')),
  value numeric,
  active boolean NOT NULL DEFAULT true,
  branch_id text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kk_loyalty_vouchers (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES public.kk_profiles(id) ON DELETE CASCADE,
  reward_id text NOT NULL REFERENCES public.kk_loyalty_rewards(id) ON DELETE RESTRICT,
  reward_name_snapshot text NOT NULL,
  reward_type text NOT NULL,
  reward_value numeric,
  stamps_spent int NOT NULL DEFAULT 0,
  branch_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
  expires_at timestamptz,
  redeemed_at timestamptz,
  redeemed_order_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kk_loyalty_vouchers_customer ON public.kk_loyalty_vouchers(customer_id);
CREATE INDEX IF NOT EXISTS idx_kk_loyalty_vouchers_code ON public.kk_loyalty_vouchers(code);

INSERT INTO public.kk_loyalty_rewards (id, name, description, stamps_required, type, value, active, branch_id)
VALUES
  (
    'reward_free_drink',
    'Free Drink',
    'Redeem any drink on the menu — on us.',
    10,
    'free_drink',
    NULL,
    true,
    NULL
  ),
  (
    'reward_merch_10',
    '10% Off Merch',
    'Get 10% off any single merch item.',
    5,
    'discount_percent',
    10,
    true,
    NULL
  )
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.kk_compute_loyalty_discount(
  p_type text,
  p_value numeric,
  p_subtotal numeric,
  p_lines jsonb
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_discount numeric := 0;
  v_cheapest numeric;
BEGIN
  IF p_type = 'discount_percent' AND coalesce(p_value, 0) > 0 THEN
    RETURN least(floor((p_subtotal * p_value) / 100), p_subtotal);
  ELSIF p_type = 'discount_fixed' AND coalesce(p_value, 0) > 0 THEN
    RETURN least(p_value, p_subtotal);
  ELSIF p_type = 'free_drink' THEN
    SELECT min((l->>'unit_price')::numeric)
    INTO v_cheapest
    FROM jsonb_array_elements(p_lines) AS l
    WHERE coalesce(l->>'item_type', 'coffee') <> 'merch';
    IF v_cheapest IS NULL THEN RETURN 0; END IF;
    RETURN least(v_cheapest, p_subtotal);
  ELSIF p_type = 'free_merch' THEN
    SELECT min((l->>'line_total')::numeric)
    INTO v_cheapest
    FROM jsonb_array_elements(p_lines) AS l
    WHERE coalesce(l->>'item_type', 'coffee') = 'merch';
    IF v_cheapest IS NULL THEN RETURN 0; END IF;
    RETURN least(v_cheapest, p_subtotal);
  ELSIF p_type = 'custom' AND coalesce(p_value, 0) > 0 THEN
    RETURN least(p_value, p_subtotal);
  END IF;
  RETURN 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.kk_claim_loyalty_reward(p_reward_id text)
RETURNS public.kk_loyalty_vouchers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_reward public.kk_loyalty_rewards%ROWTYPE;
  v_profile public.kk_profiles%ROWTYPE;
  v_stamps int;
  v_id text;
  v_code text;
  v_attempt int;
  v_row public.kk_loyalty_vouchers%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in required to claim rewards';
  END IF;

  SELECT * INTO v_profile FROM public.kk_profiles WHERE id = v_uid;
  IF NOT FOUND OR v_profile.role <> 'customer' THEN
    RAISE EXCEPTION 'Only customer accounts can claim rewards';
  END IF;

  SELECT * INTO v_reward
  FROM public.kk_loyalty_rewards
  WHERE id = p_reward_id AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reward is not available';
  END IF;

  v_stamps := coalesce(v_profile.loyalty_stamps, 0);
  IF v_stamps < v_reward.stamps_required THEN
    RAISE EXCEPTION 'Not enough stamps for this reward';
  END IF;

  UPDATE public.kk_profiles
  SET loyalty_stamps = v_stamps - v_reward.stamps_required
  WHERE id = v_uid;

  v_id := gen_random_uuid()::text;
  FOR v_attempt IN 1..12 LOOP
    v_code := 'KK-VCH-' || floor(1000 + random() * 9000)::text;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.kk_loyalty_vouchers WHERE code = v_code);
  END LOOP;

  INSERT INTO public.kk_loyalty_vouchers (
    id, code, customer_id, reward_id,
    reward_name_snapshot, reward_type, reward_value, stamps_spent,
    branch_id, status, expires_at, created_at
  ) VALUES (
    v_id,
    v_code,
    v_uid,
    v_reward.id,
    v_reward.name,
    v_reward.type,
    v_reward.value,
    v_reward.stamps_required,
    v_reward.branch_id,
    'active',
    now() + interval '90 days',
    now()
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.kk_claim_loyalty_reward(text) TO authenticated;

ALTER TABLE public.kk_loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kk_loyalty_vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kk_loyalty_rewards_select ON public.kk_loyalty_rewards;
CREATE POLICY kk_loyalty_rewards_select
  ON public.kk_loyalty_rewards FOR SELECT
  TO authenticated, anon
  USING (active = true OR public.kk_current_role() = 'admin');

DROP POLICY IF EXISTS kk_loyalty_rewards_admin ON public.kk_loyalty_rewards;
CREATE POLICY kk_loyalty_rewards_admin
  ON public.kk_loyalty_rewards FOR ALL
  TO authenticated
  USING (public.kk_current_role() = 'admin')
  WITH CHECK (public.kk_current_role() = 'admin');

DROP POLICY IF EXISTS kk_loyalty_vouchers_select_own ON public.kk_loyalty_vouchers;
CREATE POLICY kk_loyalty_vouchers_select_own
  ON public.kk_loyalty_vouchers FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid() OR public.kk_current_role() IN ('admin', 'barista', 'staff'));

-- kk_place_order (updated loyalty voucher validation + redeem)

CREATE OR REPLACE FUNCTION public.kk_place_order(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_branch_id text;
  v_channel text;
  v_customer_id uuid;
  v_staff_id uuid;
  v_guest_name text;
  v_table_id text;
  v_order_id text;
  v_short_code text;
  v_payment_method text;
  v_payment_status text;
  v_status text;
  v_tax_rate numeric;
  v_subtotal numeric := 0;
  v_modifiers numeric := 0;
  v_discount numeric := 0;
  v_promo_discount numeric := 0;
  v_loyalty_discount numeric := 0;
  v_taxable numeric;
  v_tax numeric;
  v_total numeric;
  v_item jsonb;
  v_product public.kk_products%ROWTYPE;
  v_unit numeric;
  v_base numeric;
  v_qty int;
  v_line_total numeric;
  v_lines jsonb := '[]'::jsonb;
  v_promo_code text;
  v_promo_row public.kk_promo_codes%ROWTYPE;
  v_promo_id text;
  v_voucher_id text;
  v_voucher_row public.kk_loyalty_vouchers%ROWTYPE;
  v_now timestamptz := now();
  v_item_count int := 0;
  v_uid uuid := auth.uid();
  v_attempt int;
BEGIN
  IF payload IS NULL OR jsonb_typeof(payload) <> 'object' THEN
    RAISE EXCEPTION 'Invalid order payload';
  END IF;

  v_order_id := nullif(trim(payload->>'id'), '');
  IF v_order_id IS NULL OR length(v_order_id) > 64 THEN
    RAISE EXCEPTION 'Invalid order id';
  END IF;

  v_channel := nullif(trim(payload->>'channel'), '');
  IF v_channel IS NULL THEN
    RAISE EXCEPTION 'channel is required';
  END IF;

  v_branch_id := nullif(trim(payload->>'branch_id'), '');
  IF v_branch_id IS NULL THEN
    RAISE EXCEPTION 'branch_id is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.kk_branches b
    WHERE b.id = v_branch_id AND b.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Branch is not active';
  END IF;

  v_role := public.kk_current_role();

  IF v_role IN ('admin', 'barista', 'staff') THEN
    IF v_channel <> 'pos' THEN
      RAISE EXCEPTION 'Staff may only place POS orders';
    END IF;
    IF v_role <> 'admin' AND v_branch_id IS DISTINCT FROM public.kk_current_branch() THEN
      RAISE EXCEPTION 'Order branch does not match your assignment';
    END IF;
    v_staff_id := v_uid;
    v_customer_id := NULL;
  ELSE
    IF v_channel NOT IN ('online', 'dine-in', 'takeout', 'merch') THEN
      RAISE EXCEPTION 'Invalid channel for guest order';
    END IF;
    v_staff_id := NULL;
    IF v_uid IS NOT NULL AND v_role = 'customer' THEN
      v_customer_id := v_uid;
    ELSE
      v_customer_id := NULL;
      IF v_uid IS NOT NULL AND v_role IS DISTINCT FROM 'customer' THEN
        RAISE EXCEPTION 'Only customer accounts may place guest-channel orders';
      END IF;
    END IF;
  END IF;

  v_table_id := nullif(trim(payload->>'table_id'), '');
  v_guest_name := nullif(trim(payload->>'guest_name'), '');

  IF v_channel = 'dine-in' THEN
    IF v_table_id IS NULL THEN
      RAISE EXCEPTION 'table_id is required for dine-in';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.kk_tables t
      WHERE t.id = v_table_id AND t.branch_id = v_branch_id AND t.active = true
    ) THEN
      RAISE EXCEPTION 'Table is invalid or inactive';
    END IF;
    IF v_guest_name IS NULL AND v_customer_id IS NULL THEN
      SELECT t.label INTO v_guest_name
      FROM public.kk_tables t
      WHERE t.id = v_table_id;
    END IF;
  END IF;

  IF v_channel = 'takeout' AND v_customer_id IS NULL THEN
    IF v_guest_name IS NULL OR length(v_guest_name) > 80 THEN
      RAISE EXCEPTION 'Guest name is required (max 80 characters)';
    END IF;
  END IF;

  IF payload->'items' IS NULL OR jsonb_typeof(payload->'items') <> 'array' THEN
    RAISE EXCEPTION 'items array is required';
  END IF;

  v_item_count := jsonb_array_length(payload->'items');
  IF v_item_count < 1 OR v_item_count > 50 THEN
    RAISE EXCEPTION 'Order must have between 1 and 50 items';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(payload->'items')
  LOOP
    v_qty := (v_item->>'qty')::int;
    IF v_qty IS NULL OR v_qty < 1 OR v_qty > 20 THEN
      RAISE EXCEPTION 'Each item qty must be between 1 and 20';
    END IF;

    SELECT * INTO v_product
    FROM public.kk_products
    WHERE id = nullif(trim(v_item->>'product_id'), '')
      AND visible = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % is not available', v_item->>'product_id';
    END IF;

    IF v_product.branch_id IS NOT NULL AND v_product.branch_id <> v_branch_id THEN
      RAISE EXCEPTION 'Product is not available at this branch';
    END IF;

    v_base := v_product.base_price;
    v_unit := public.kk_compute_unit_price(
      v_product,
      nullif(trim(v_item->>'milk_id'), ''),
      nullif(trim(v_item->>'size_id'), ''),
      coalesce(v_item->'merch_variants', '[]'::jsonb)
    );

    v_line_total := round(v_unit * v_qty, 2);
    v_subtotal := v_subtotal + round(v_base * v_qty, 2);
    v_modifiers := v_modifiers + round((v_unit - v_base) * v_qty, 2);

    v_lines := v_lines || jsonb_build_array(
      jsonb_build_object(
        'id', coalesce(nullif(trim(v_item->>'id'), ''), gen_random_uuid()::text),
        'product_id', v_product.id,
        'product_name_snapshot', v_product.name,
        'item_type', coalesce(nullif(trim(v_item->>'item_type'), ''), 'coffee'),
        'milk_id', nullif(trim(v_item->>'milk_id'), ''),
        'size_id', nullif(trim(v_item->>'size_id'), ''),
        'milk_label_snapshot', nullif(trim(v_item->>'milk_label_snapshot'), ''),
        'size_label_snapshot', nullif(trim(v_item->>'size_label_snapshot'), ''),
        'temperature', nullif(trim(v_item->>'temperature'), ''),
        'merch_variants', coalesce(v_item->'merch_variants', '[]'::jsonb),
        'notes', left(nullif(trim(v_item->>'notes'), ''), 500),
        'unit_price', v_unit,
        'qty', v_qty,
        'line_total', v_line_total
      )
    );
  END LOOP;

  v_promo_code := upper(nullif(trim(payload->>'promo_code'), ''));
  v_loyalty_discount := coalesce((payload->>'loyalty_discount_total')::numeric, 0);

  IF v_promo_code IS NOT NULL AND v_loyalty_discount > 0 THEN
    RAISE EXCEPTION 'Apply either a promo code or a loyalty voucher, not both';
  END IF;

  v_voucher_id := nullif(trim(payload->>'loyalty_voucher_id'), '');

  IF v_voucher_id IS NOT NULL THEN
    IF v_customer_id IS NULL OR v_customer_id <> v_uid THEN
      RAISE EXCEPTION 'Loyalty voucher requires a signed-in customer';
    END IF;

    SELECT * INTO v_voucher_row
    FROM public.kk_loyalty_vouchers
    WHERE id = v_voucher_id AND customer_id = v_customer_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Loyalty voucher not found';
    END IF;
    IF v_voucher_row.status <> 'active' THEN
      RAISE EXCEPTION 'Loyalty voucher is not active';
    END IF;
    IF v_voucher_row.expires_at IS NOT NULL AND v_voucher_row.expires_at < v_now THEN
      RAISE EXCEPTION 'Loyalty voucher has expired';
    END IF;
    IF v_voucher_row.branch_id IS NOT NULL AND v_voucher_row.branch_id <> v_branch_id THEN
      RAISE EXCEPTION 'Loyalty voucher is not valid for this branch';
    END IF;

    v_loyalty_discount := public.kk_compute_loyalty_discount(
      v_voucher_row.reward_type,
      v_voucher_row.reward_value,
      v_subtotal + v_modifiers,
      v_lines
    );
    IF v_loyalty_discount <= 0 THEN
      RAISE EXCEPTION 'Loyalty voucher cannot be applied to this cart';
    END IF;
    v_discount := v_loyalty_discount;
  ELSIF coalesce((payload->>'loyalty_discount_total')::numeric, 0) > 0 THEN
    RAISE EXCEPTION 'Invalid loyalty voucher';
  END IF;

  IF v_promo_code IS NOT NULL THEN
    SELECT * INTO v_promo_row
    FROM public.kk_promo_codes
    WHERE upper(code) = v_promo_code AND active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Promo code is not valid';
    END IF;

    IF v_promo_row.starts_at IS NOT NULL AND v_promo_row.starts_at > v_now THEN
      RAISE EXCEPTION 'Promo code is not active yet';
    END IF;
    IF v_promo_row.expires_at IS NOT NULL AND v_promo_row.expires_at < v_now THEN
      RAISE EXCEPTION 'Promo code has expired';
    END IF;
    IF v_promo_row.max_uses IS NOT NULL AND v_promo_row.uses >= v_promo_row.max_uses THEN
      RAISE EXCEPTION 'Promo code usage limit reached';
    END IF;
    IF (v_subtotal + v_modifiers) < v_promo_row.min_order_amount THEN
      RAISE EXCEPTION 'Order does not meet promo minimum amount';
    END IF;
    IF v_promo_row.branch_id IS NOT NULL AND v_promo_row.branch_id <> v_branch_id THEN
      RAISE EXCEPTION 'Promo code is not valid for this branch';
    END IF;
    IF v_customer_id IS NOT NULL AND v_promo_row.per_customer > 0 THEN
      IF (
        SELECT count(*)::int FROM public.kk_promo_claims
        WHERE promo_code_id = v_promo_row.id AND customer_id = v_customer_id
      ) >= v_promo_row.per_customer THEN
        RAISE EXCEPTION 'Promo code already used the maximum times for this account';
      END IF;
    END IF;

    v_promo_discount := public.kk_compute_promo_discount(
      v_promo_row,
      v_subtotal + v_modifiers,
      v_lines
    );
    IF v_promo_discount <= 0 THEN
      RAISE EXCEPTION 'Promo code cannot be applied to this cart';
    END IF;
    v_discount := v_promo_discount;
    v_promo_id := v_promo_row.id;
  END IF;

  SELECT coalesce(tax_rate, 0) INTO v_tax_rate
  FROM public.kk_app_settings
  WHERE id = true
  LIMIT 1;

  v_taxable := greatest(0, v_subtotal + v_modifiers - v_discount);
  v_tax := CASE WHEN v_tax_rate > 0 THEN round((v_taxable * v_tax_rate) / 100) ELSE 0 END;
  v_total := v_taxable + v_tax;

  v_payment_method := coalesce(
    nullif(trim(payload->>'payment_method'), ''),
    CASE WHEN v_channel IN ('online', 'merch') THEN 'gcash-qr' ELSE 'pay-at-store' END
  );
  v_payment_status := coalesce(nullif(trim(payload->>'payment_status'), ''), 'unpaid');
  v_status := coalesce(nullif(trim(payload->>'status'), ''), 'pending');

  FOR v_attempt IN 1..12 LOOP
    v_short_code := 'KK-' || floor(1000 + random() * 9000)::text;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.kk_orders WHERE short_code = v_short_code);
  END LOOP;

  IF v_short_code IS NULL THEN
    RAISE EXCEPTION 'Could not allocate order code';
  END IF;

  INSERT INTO public.kk_orders (
    id, short_code, channel, branch_id, table_id, customer_id, guest_name, staff_id,
    payment_method, payment_status, status,
    subtotal, modifiers_total, tax, total,
    loyalty_voucher_id, loyalty_voucher_code, loyalty_discount_total,
    created_at, updated_at
  ) VALUES (
    v_order_id,
    v_short_code,
    v_channel,
    v_branch_id,
    v_table_id,
    v_customer_id,
    v_guest_name,
    v_staff_id,
    v_payment_method,
    v_payment_status,
    v_status,
    v_subtotal,
    v_modifiers,
    v_tax,
    v_total,
    v_voucher_id,
    CASE WHEN v_voucher_id IS NOT NULL THEN v_voucher_row.code ELSE nullif(trim(payload->>'loyalty_voucher_code'), '') END,
    CASE WHEN v_loyalty_discount > 0 THEN v_loyalty_discount ELSE NULL END,
    v_now,
    v_now
  );

  INSERT INTO public.kk_order_items (
    id, order_id, product_id, product_name_snapshot, item_type,
    size_id, size_label_snapshot, milk_id, milk_label_snapshot, temperature,
    merch_variants, notes, unit_price, qty, line_total, created_at
  )
  SELECT
    l->>'id',
    v_order_id,
    l->>'product_id',
    l->>'product_name_snapshot',
    l->>'item_type',
    nullif(l->>'size_id', ''),
    nullif(l->>'size_label_snapshot', ''),
    nullif(l->>'milk_id', ''),
    nullif(l->>'milk_label_snapshot', ''),
    nullif(l->>'temperature', ''),
    coalesce(l->'merch_variants', '[]'::jsonb),
    nullif(l->>'notes', ''),
    (l->>'unit_price')::numeric,
    (l->>'qty')::int,
    (l->>'line_total')::numeric,
    v_now
  FROM jsonb_array_elements(v_lines) AS l;

  IF v_promo_id IS NOT NULL AND v_promo_discount > 0 THEN
    INSERT INTO public.kk_promo_claims (
      promo_code_id, customer_id, order_id, discount_amount, claimed_at
    ) VALUES (
      v_promo_id,
      v_customer_id,
      v_order_id,
      v_promo_discount,
      v_now
    );
    PERFORM public.increment_promo_uses(v_promo_id);
  END IF;

  IF v_voucher_id IS NOT NULL AND v_loyalty_discount > 0 THEN
    UPDATE public.kk_loyalty_vouchers
    SET status = 'redeemed',
        redeemed_at = v_now,
        redeemed_order_id = v_order_id
    WHERE id = v_voucher_id;
  END IF;

  RETURN jsonb_build_object(
    'id', v_order_id,
    'short_code', v_short_code,
    'channel', v_channel,
    'branch_id', v_branch_id,
    'table_id', v_table_id,
    'customer_id', v_customer_id,
    'guest_name', v_guest_name,
    'staff_id', v_staff_id,
    'payment_method', v_payment_method,
    'payment_status', v_payment_status,
    'status', v_status,
    'subtotal', v_subtotal,
    'modifiers_total', v_modifiers,
    'tax', v_tax,
    'total', v_total,
    'loyalty_discount_total', CASE WHEN v_loyalty_discount > 0 THEN v_loyalty_discount ELSE NULL END,
    'created_at', v_now,
    'updated_at', v_now
  );
END;
$$;

REVOKE ALL ON FUNCTION public.kk_place_order(jsonb) FROM PUBLIC;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kk_loyalty_rewards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kk_loyalty_rewards;
  END IF;
END $$;
