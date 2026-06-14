-- Guest QR / takeout: cancel while order is still pending (before staff accepts).

CREATE OR REPLACE FUNCTION public.kk_guest_cancel_order(p_order_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.kk_orders%ROWTYPE;
BEGIN
  IF p_order_id IS NULL OR length(trim(p_order_id)) = 0 OR length(p_order_id) > 64 THEN
    RAISE EXCEPTION 'Invalid order id';
  END IF;

  SELECT * INTO v_order FROM public.kk_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.channel NOT IN ('dine-in', 'takeout') THEN
    RAISE EXCEPTION 'Cancellation is not allowed for this order';
  END IF;

  IF v_order.status IN ('cancelled', 'completed') THEN
    RAISE EXCEPTION 'This order can no longer be cancelled';
  END IF;

  IF v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'This order has already been received by our team';
  END IF;

  DELETE FROM public.kk_promo_claims WHERE order_id = p_order_id;

  UPDATE public.kk_loyalty_vouchers
  SET redeemed_order_id = NULL
  WHERE redeemed_order_id = p_order_id;

  UPDATE public.kk_orders
  SET
    status = 'cancelled',
    updated_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'id', p_order_id,
    'status', 'cancelled',
    'updated_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.kk_guest_cancel_order(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_guest_cancel_order(text) TO anon, authenticated;
