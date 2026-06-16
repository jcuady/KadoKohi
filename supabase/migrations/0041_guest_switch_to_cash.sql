  -- Guest QR / takeout: switch from GCash to pay-at-store while order is still pending.

  CREATE OR REPLACE FUNCTION public.kk_guest_switch_to_cash(p_order_id text)
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
      RAISE EXCEPTION 'Payment change is not allowed for this order';
    END IF;

    IF v_order.status <> 'pending' THEN
      RAISE EXCEPTION 'This order has already been received by our team';
    END IF;

    IF v_order.payment_method IS DISTINCT FROM 'gcash-qr' THEN
      RAISE EXCEPTION 'This order is not set up for GCash';
    END IF;

    UPDATE public.kk_orders
    SET
      payment_method = 'pay-at-store',
      payment_status = 'paid',
      payment_proof_image = NULL,
      payment_proof_uploaded_at = NULL,
      updated_at = now()
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
      'id', p_order_id,
      'payment_method', 'pay-at-store',
      'payment_status', 'paid',
      'updated_at', now()
    );
  END;
  $$;

  REVOKE ALL ON FUNCTION public.kk_guest_switch_to_cash(text) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.kk_guest_switch_to_cash(text) TO anon, authenticated;
