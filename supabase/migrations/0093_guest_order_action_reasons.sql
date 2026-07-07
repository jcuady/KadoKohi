-- Guest cancel / change-order with reason capture; block after GCash payment.

ALTER TABLE public.kk_orders
  ADD COLUMN IF NOT EXISTS guest_action text,
  ADD COLUMN IF NOT EXISTS guest_action_reason text,
  ADD COLUMN IF NOT EXISTS guest_action_note text;

DROP FUNCTION IF EXISTS public.kk_guest_cancel_order(text);

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

  IF v_order.channel NOT IN ('dine-in', 'takeout') THEN
    RAISE EXCEPTION 'Changes are not allowed for this order';
  END IF;

  IF v_order.status IN ('cancelled', 'completed') THEN
    RAISE EXCEPTION 'This order can no longer be changed';
  END IF;

  IF v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'This order has already been received by our team';
  END IF;

  IF v_order.payment_method = 'gcash-qr' AND (
    v_order.payment_status <> 'unpaid'
    OR (v_order.payment_proof_image IS NOT NULL AND length(v_order.payment_proof_image) > 0)
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
    auth.uid(),
    NULL,
    'guest',
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

REVOKE ALL ON FUNCTION public.kk_guest_cancel_order(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_guest_cancel_order(text, text, text, text) TO anon, authenticated;
