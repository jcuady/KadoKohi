-- Kuki Box composition validation for kk_place_order (exact slot count + real cookies).
-- Pricing stays server-side from kk_products.base_price (4/5 @ ₱100, 6/10 @ ₱90).

CREATE OR REPLACE FUNCTION public.kk_assert_kuki_box_line(
  p_product public.kk_products,
  p_variants jsonb
)
RETURNS void
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $fn$
DECLARE
  v_size int;
  v_sum int := 0;
  v_elem jsonb;
  v_cookie_id text;
  v_qty int;
  v_label text;
  v_cookie public.kk_products%ROWTYPE;
  v_m text[];
BEGIN
  IF p_product.id NOT LIKE 'kuki_box_%' THEN
    RETURN;
  END IF;

  v_size := substring(p_product.id from 'kuki_box_([0-9]+)$')::int;
  IF v_size IS NULL OR v_size NOT IN (4, 5, 6, 10) THEN
    RAISE EXCEPTION 'Invalid Kuki Box product %', p_product.id;
  END IF;

  IF jsonb_typeof(coalesce(p_variants, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Kuki Box % requires cookie selections', p_product.id;
  END IF;

  FOR v_elem IN
    SELECT value FROM jsonb_array_elements(coalesce(p_variants, '[]'::jsonb))
  LOOP
    IF coalesce(nullif(trim(v_elem->>'groupName'), ''), 'Cookies') IS DISTINCT FROM 'Cookies' THEN
      CONTINUE;
    END IF;

    v_cookie_id := nullif(trim(coalesce(v_elem->>'optionId', '')), '');
    IF v_cookie_id IS NULL THEN
      RAISE EXCEPTION 'Kuki Box cookie selection is missing optionId';
    END IF;

    BEGIN
      v_qty := nullif(trim(coalesce(v_elem->>'qty', '')), '')::int;
    EXCEPTION WHEN others THEN
      v_qty := NULL;
    END;

    IF v_qty IS NULL OR v_qty < 1 THEN
      v_label := coalesce(v_elem->>'optionLabel', '');
      v_m := regexp_match(v_label, '×\s*([0-9]+)\s*$');
      IF v_m IS NOT NULL THEN
        v_qty := v_m[1]::int;
      ELSE
        v_qty := 1;
      END IF;
    END IF;

    IF v_qty < 1 OR v_qty > 20 THEN
      RAISE EXCEPTION 'Invalid cookie quantity for %', v_cookie_id;
    END IF;

    SELECT * INTO v_cookie
    FROM public.kk_products
    WHERE id = v_cookie_id
      AND visible = true
      AND coalesce(in_stock, true) = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cookie % is not available for Kuki Box', v_cookie_id;
    END IF;

    IF v_cookie.id NOT LIKE 'cookie_%'
       AND NOT public.kk_product_has_tag(v_cookie, 'cookie')
       AND NOT public.kk_product_has_tag(v_cookie, 'kukido') THEN
      RAISE EXCEPTION '% is not a cookie for Kuki Box', v_cookie_id;
    END IF;

    v_sum := v_sum + v_qty;
  END LOOP;

  IF v_sum IS DISTINCT FROM v_size THEN
    RAISE EXCEPTION 'Kuki Box % requires exactly % cookies (got %)', p_product.id, v_size, v_sum;
  END IF;
END;
$fn$;

REVOKE ALL ON FUNCTION public.kk_assert_kuki_box_line(public.kk_products, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_assert_kuki_box_line(public.kk_products, jsonb) TO anon, authenticated, service_role;

DO $patch$
DECLARE
  def text;
  old_snip text := $o$IF v_product.branch_id IS NOT NULL AND v_product.branch_id <> v_branch_id THEN
      RAISE EXCEPTION 'Product is not available at this branch';
    END IF;

    v_cookie_id := nullif(trim(v_item->>'mix_match_cookie_id'), '');$o$;
  new_snip text := $n$IF v_product.branch_id IS NOT NULL AND v_product.branch_id <> v_branch_id THEN
      RAISE EXCEPTION 'Product is not available at this branch';
    END IF;

    -- Kuki Box: require exact cookie slot fill (4/5/6/10) before pricing from base_price.
    IF v_product.id LIKE 'kuki_box_%' THEN
      PERFORM public.kk_assert_kuki_box_line(
        v_product,
        coalesce(v_item->'merch_variants', '[]'::jsonb)
      );
    END IF;

    v_cookie_id := nullif(trim(v_item->>'mix_match_cookie_id'), '');$n$;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO def
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'kk_place_order';

  IF def IS NULL OR position(old_snip in def) = 0 THEN
    RAISE EXCEPTION 'kk_place_order patch point not found for kuki box assert';
  END IF;

  def := replace(def, old_snip, new_snip);
  EXECUTE def;
END;
$patch$;
