-- QR / guest GCash: extend tracking + allow proof upload without sign-in.

DROP FUNCTION IF EXISTS public.kk_track_order(text);

CREATE OR REPLACE FUNCTION public.kk_track_order(order_id text)
RETURNS TABLE (
  id text,
  short_code text,
  channel text,
  status text,
  payment_status text,
  payment_method text,
  guest_name text,
  total numeric,
  has_payment_proof boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id,
    o.short_code,
    o.channel,
    o.status,
    o.payment_status,
    o.payment_method,
    o.guest_name,
    o.total,
    (o.payment_proof_image IS NOT NULL AND length(o.payment_proof_image) > 0),
    o.created_at,
    o.updated_at
  FROM public.kk_orders o
  WHERE o.id = order_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.kk_track_order(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_track_order(text) TO anon, authenticated;

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
BEGIN
  IF p_order_id IS NULL OR length(trim(p_order_id)) = 0 OR length(p_order_id) > 64 THEN
    RAISE EXCEPTION 'Invalid order id';
  END IF;

  IF p_proof_data_url IS NULL OR length(p_proof_data_url) < 32 THEN
    RAISE EXCEPTION 'Proof image is required';
  END IF;

  IF length(p_proof_data_url) > 900000 THEN
    RAISE EXCEPTION 'Proof image is too large';
  END IF;

  IF p_proof_data_url NOT LIKE 'data:image/%' THEN
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
    payment_proof_image = p_proof_data_url,
    payment_proof_uploaded_at = now(),
    payment_status = 'proof_submitted',
    updated_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'id', p_order_id,
    'payment_status', 'proof_submitted',
    'updated_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.kk_submit_guest_payment_proof(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_submit_guest_payment_proof(text, text) TO anon, authenticated;
