-- Admin-only order delete (line items cascade; clears promo/voucher links).

CREATE OR REPLACE FUNCTION public.kk_admin_delete_order(p_order_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.kk_current_role() <> 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_order_id IS NULL OR length(trim(p_order_id)) = 0 OR length(p_order_id) > 64 THEN
    RAISE EXCEPTION 'Invalid order id';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.kk_orders WHERE id = p_order_id) THEN
    RAISE EXCEPTION 'Order not found or already deleted';
  END IF;

  DELETE FROM public.kk_promo_claims WHERE order_id = p_order_id;

  UPDATE public.kk_loyalty_vouchers
  SET redeemed_order_id = NULL
  WHERE redeemed_order_id = p_order_id;

  DELETE FROM public.kk_orders WHERE id = p_order_id;

  RETURN jsonb_build_object('ok', true, 'id', p_order_id);
END;
$$;

REVOKE ALL ON FUNCTION public.kk_admin_delete_order(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_admin_delete_order(text) TO authenticated;
