-- kk_place_order: add server-side order.created audit row.

-- Enforce in_stock on kk_place_order

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
  v_cookie_id text;
  v_cookie public.kk_products%ROWTYPE;
  v_bundle_discount numeric;
  v_drink_unit numeric;
  v_name_snapshot text;
  v_item_notes text;
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
      AND visible = true
      AND coalesce(in_stock, true) = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % is not available or out of stock', v_item->>'product_id';
    END IF;

    IF v_product.branch_id IS NOT NULL AND v_product.branch_id <> v_branch_id THEN
      RAISE EXCEPTION 'Product is not available at this branch';
    END IF;

    v_cookie_id := nullif(trim(v_item->>'mix_match_cookie_id'), '');

    IF v_cookie_id IS NOT NULL THEN
      IF NOT public.kk_product_has_tag(v_product, 'mix-match') THEN
        RAISE EXCEPTION 'Drink % is not eligible for mix & match', v_product.id;
      END IF;

      SELECT * INTO v_cookie
      FROM public.kk_products
      WHERE id = v_cookie_id
        AND visible = true
        AND coalesce(in_stock, true) = true;

      IF NOT FOUND OR NOT public.kk_is_mix_match_cookie(v_cookie) THEN
        RAISE EXCEPTION 'Mix & match cookie % is not available', v_cookie_id;
      END IF;

      v_base := v_product.base_price;
      v_drink_unit := public.kk_compute_unit_price(
        v_product,
        nullif(trim(v_item->>'milk_id'), ''),
        nullif(trim(v_item->>'size_id'), ''),
        coalesce(v_item->'merch_variants', '[]'::jsonb)
      );

      v_bundle_discount := round((v_drink_unit + v_cookie.base_price) * 0.10, 2);
      v_unit := round(v_drink_unit + v_cookie.base_price - v_bundle_discount, 2);
      v_line_total := round(v_unit * v_qty, 2);
      v_subtotal := v_subtotal + round((v_product.base_price + v_cookie.base_price) * v_qty, 2);
      v_modifiers := v_modifiers + round((v_drink_unit - v_product.base_price) * v_qty - v_bundle_discount * v_qty, 2);
      v_name_snapshot := 'Mix & Match: ' || v_product.name || ' + ' || v_cookie.name;
      v_item_notes := left(coalesce(nullif(trim(v_item->>'notes'), ''), 'Cookie: ' || v_cookie.name), 500);

      v_lines := v_lines || jsonb_build_array(
        jsonb_build_object(
          'id', coalesce(nullif(trim(v_item->>'id'), ''), gen_random_uuid()::text),
          'product_id', v_product.id,
          'product_name_snapshot', v_name_snapshot,
          'item_type', 'mix-match',
          'milk_id', nullif(trim(v_item->>'milk_id'), ''),
          'size_id', nullif(trim(v_item->>'size_id'), ''),
          'milk_label_snapshot', nullif(trim(v_item->>'milk_label_snapshot'), ''),
          'size_label_snapshot', nullif(trim(v_item->>'size_label_snapshot'), ''),
          'temperature', nullif(trim(v_item->>'temperature'), ''),
          'merch_variants', coalesce(v_item->'merch_variants', '[]'::jsonb),
          'notes', v_item_notes,
          'unit_price', v_unit,
          'qty', v_qty,
          'line_total', v_line_total
        )
      );
    ELSE
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
      v_name_snapshot := coalesce(nullif(trim(v_item->>'product_name_snapshot'), ''), v_product.name);

      v_lines := v_lines || jsonb_build_array(
        jsonb_build_object(
          'id', coalesce(nullif(trim(v_item->>'id'), ''), gen_random_uuid()::text),
          'product_id', v_product.id,
          'product_name_snapshot', v_name_snapshot,
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
    END IF;
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


  PERFORM public.kk_write_audit(
    p_actor_id := v_uid,
    p_actor_email := (SELECT u.email::text FROM auth.users u WHERE u.id = v_uid),
    p_actor_role := (
      CASE
        WHEN v_uid IS NULL THEN 'guest'
        WHEN v_role IN ('admin', 'barista', 'staff') THEN v_role::text
        ELSE coalesce(v_role::text, 'customer')
      END
    ),
    p_action := 'order.created'::text,
    p_entity_type := 'order'::text,
    p_entity_id := v_order_id::text,
    p_branch_id := v_branch_id,
    p_summary := ('Order ' || v_short_code)::text,
    p_metadata := jsonb_build_object('channel', v_channel, 'short_code', v_short_code, 'total', v_total)
  );
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
GRANT EXECUTE ON FUNCTION public.kk_place_order(jsonb) TO anon, authenticated;
