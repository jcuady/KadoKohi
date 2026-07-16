-- Customer / guest: change payment method or cancel while order is still unpaid.

CREATE OR REPLACE FUNCTION public.kk_change_order_payment_method(
  p_order_id text,
  p_payment_method text,
  p_short_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.kk_orders%ROWTYPE;
  v_method text;
  v_short text;
  v_profile_id uuid := public.requesting_profile_id();
  v_payment_status text;
BEGIN
  IF p_order_id IS NULL OR length(trim(p_order_id)) = 0 OR length(p_order_id) > 64 THEN
    RAISE EXCEPTION 'Invalid order id';
  END IF;

  v_method := lower(nullif(trim(p_payment_method), ''));
  IF v_method IS NULL OR v_method NOT IN ('paymongo', 'gcash-qr', 'pay-at-store') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;

  v_short := upper(nullif(trim(p_short_code), ''));

  SELECT * INTO v_order FROM public.kk_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status IN ('cancelled', 'completed') THEN
    RAISE EXCEPTION 'This order can no longer be changed';
  END IF;

  IF v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'This order has already been received by our team';
  END IF;

  IF v_order.payment_method IN ('gcash-qr', 'paymongo') AND v_order.payment_status <> 'unpaid' THEN
    RAISE EXCEPTION 'Payment has already been submitted or confirmed';
  END IF;

  IF v_order.payment_method = 'gcash-qr'
     AND v_order.payment_proof_image IS NOT NULL
     AND length(v_order.payment_proof_image) > 0 THEN
    RAISE EXCEPTION 'Cannot change payment after GCash proof has been uploaded';
  END IF;

  IF v_order.customer_id IS NOT NULL THEN
    IF v_profile_id IS NULL OR v_profile_id IS DISTINCT FROM v_order.customer_id THEN
      RAISE EXCEPTION 'Sign in to change payment for this order';
    END IF;
  ELSIF v_order.channel IN ('online', 'merch') THEN
    IF v_short IS NULL OR v_short <> upper(coalesce(v_order.short_code, '')) THEN
      RAISE EXCEPTION 'Invalid order reference';
    END IF;
  ELSIF v_order.channel NOT IN ('dine-in', 'takeout') THEN
    RAISE EXCEPTION 'Payment change is not allowed for this order';
  END IF;

  IF v_order.channel IN ('online', 'merch') AND v_method = 'pay-at-store' THEN
    RAISE EXCEPTION 'Pay at store is not available for online orders';
  END IF;

  IF v_order.channel IN ('online', 'merch')
     AND v_method = 'paymongo'
     AND v_order.customer_id IS NULL THEN
    RAISE EXCEPTION 'QR Ph online checkout requires a signed-in customer account';
  END IF;

  IF v_method = v_order.payment_method THEN
    RETURN jsonb_build_object(
      'id', p_order_id,
      'payment_method', v_method,
      'payment_status', v_order.payment_status,
      'updated_at', now()
    );
  END IF;

  v_payment_status := CASE
    WHEN v_method IN ('gcash-qr', 'paymongo') THEN 'unpaid'
    ELSE 'paid'
  END;

  UPDATE public.kk_orders
  SET
    payment_method = v_method,
    payment_status = v_payment_status,
    payment_proof_image = NULL,
    payment_proof_uploaded_at = NULL,
    paymongo_checkout_session_id = CASE WHEN v_method = 'paymongo' THEN paymongo_checkout_session_id ELSE NULL END,
    paymongo_payment_id = CASE WHEN v_method = 'paymongo' THEN paymongo_payment_id ELSE NULL END,
    updated_at = now()
  WHERE id = p_order_id;

  PERFORM public.kk_write_audit(
    v_profile_id,
    NULL,
    CASE WHEN v_profile_id IS NULL THEN 'guest' ELSE 'customer' END,
    'order.payment_method_changed',
    'order',
    p_order_id,
    v_order.branch_id,
    'Payment method changed on ' || v_order.short_code,
    jsonb_build_object(
      'channel', v_order.channel,
      'short_code', v_order.short_code,
      'from_method', v_order.payment_method,
      'to_method', v_method
    )
  );

  RETURN jsonb_build_object(
    'id', p_order_id,
    'payment_method', v_method,
    'payment_status', v_payment_status,
    'updated_at', now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.kk_guest_cancel_order(
  p_order_id text,
  p_action text DEFAULT 'cancel',
  p_reason text DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.kk_orders%ROWTYPE;
  v_action text;
  v_reason text;
  v_note text;
  v_profile_id uuid := public.requesting_profile_id();
BEGIN
  IF p_order_id IS NULL OR length(trim(p_order_id)) = 0 OR length(p_order_id) > 64 THEN
    RAISE EXCEPTION 'Invalid order id';
  END IF;

  v_action := lower(nullif(trim(p_action), ''));
  IF v_action IS NULL THEN
    v_action := 'cancel';
  END IF;
  IF v_action NOT IN ('cancel', 'change_order') THEN
    RAISE EXCEPTION 'Invalid guest action';
  END IF;

  v_reason := left(nullif(trim(p_reason), ''), 64);
  IF v_reason IS NULL THEN
    v_reason := 'unspecified';
  END IF;

  v_note := left(nullif(trim(p_note), ''), 200);

  SELECT * INTO v_order FROM public.kk_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.channel IN ('online', 'merch') THEN
    IF v_order.customer_id IS NOT NULL THEN
      IF v_profile_id IS NULL OR v_profile_id IS DISTINCT FROM v_order.customer_id THEN
        RAISE EXCEPTION 'Sign in to cancel this order';
      END IF;
    END IF;
  ELSIF v_order.channel NOT IN ('dine-in', 'takeout') THEN
    RAISE EXCEPTION 'Changes are not allowed for this order';
  END IF;

  IF v_order.status IN ('cancelled', 'completed') THEN
    RAISE EXCEPTION 'This order can no longer be changed';
  END IF;

  IF v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'This order has already been received by our team';
  END IF;

  IF v_order.payment_method IN ('gcash-qr', 'paymongo') AND v_order.payment_status <> 'unpaid' THEN
    RAISE EXCEPTION 'Cannot cancel or change order after payment has been submitted';
  END IF;

  IF v_order.payment_method = 'gcash-qr' AND (
    v_order.payment_proof_image IS NOT NULL AND length(v_order.payment_proof_image) > 0
  ) THEN
    RAISE EXCEPTION 'Cannot cancel or change order after GCash payment has been submitted';
  END IF;

  DELETE FROM public.kk_promo_claims WHERE order_id = p_order_id;

  UPDATE public.kk_loyalty_vouchers
  SET redeemed_order_id = NULL
  WHERE redeemed_order_id = p_order_id;

  UPDATE public.kk_orders
  SET
    status = 'cancelled',
    guest_action = v_action,
    guest_action_reason = v_reason,
    guest_action_note = v_note,
    updated_at = now()
  WHERE id = p_order_id;

  PERFORM public.kk_write_audit(
    v_profile_id,
    NULL,
    CASE WHEN v_profile_id IS NULL THEN 'guest' ELSE 'customer' END,
    CASE WHEN v_action = 'change_order' THEN 'order.change_requested_by_guest' ELSE 'order.cancelled_by_guest' END,
    'order',
    p_order_id,
    v_order.branch_id,
    CASE
      WHEN v_action = 'change_order' THEN 'Guest requested change on ' || v_order.short_code
      ELSE 'Guest cancelled ' || v_order.short_code
    END,
    jsonb_build_object(
      'channel', v_order.channel,
      'short_code', v_order.short_code,
      'guest_action', v_action,
      'guest_action_reason', v_reason,
      'guest_action_note', v_note
    )
  );

  RETURN jsonb_build_object(
    'id', p_order_id,
    'status', 'cancelled',
    'guest_action', v_action,
    'guest_action_reason', v_reason,
    'updated_at', now()
  );
END;
$$;

-- Legacy alias: switch GCash or QR Ph → pay at counter.
CREATE OR REPLACE FUNCTION public.kk_guest_switch_to_cash(p_order_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.kk_change_order_payment_method(p_order_id, 'pay-at-store', NULL);
END;
$$;

REVOKE ALL ON FUNCTION public.kk_change_order_payment_method(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_change_order_payment_method(text, text, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.kk_guest_cancel_order(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_guest_cancel_order(text, text, text, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.kk_guest_switch_to_cash(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_guest_switch_to_cash(text) TO anon, authenticated;
