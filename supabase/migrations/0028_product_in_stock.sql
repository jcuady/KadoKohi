-- Manual out-of-stock toggle (no quantity tracking).

ALTER TABLE public.kk_products
  ADD COLUMN IF NOT EXISTS in_stock boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.kk_products.in_stock IS
  'When false, item stays on menu but cannot be ordered (staff toggles via admin/barista menu).';

CREATE OR REPLACE FUNCTION public.kk_set_product_in_stock(
  p_product_id text,
  p_in_stock boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := public.kk_current_role();
  IF v_role NOT IN ('admin', 'barista') THEN
    RAISE EXCEPTION 'Only admin or barista may change stock status';
  END IF;

  IF p_product_id IS NULL OR length(trim(p_product_id)) = 0 OR length(p_product_id) > 64 THEN
    RAISE EXCEPTION 'Invalid product id';
  END IF;

  UPDATE public.kk_products
  SET in_stock = coalesce(p_in_stock, true),
      updated_at = now()
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  RETURN jsonb_build_object('id', p_product_id, 'in_stock', coalesce(p_in_stock, true));
END;
$$;

REVOKE ALL ON FUNCTION public.kk_set_product_in_stock(text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_set_product_in_stock(text, boolean) TO authenticated;
