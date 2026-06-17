-- Accept authenticated-customer proof-storage paths (userId/orderId-proof.jpg) in addition to guest/ paths.

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
  v_proof text;
BEGIN
  IF p_order_id IS NULL OR length(trim(p_order_id)) = 0 OR length(p_order_id) > 64 THEN
    RAISE EXCEPTION 'Invalid order id';
  END IF;

  v_proof := trim(p_proof_data_url);
  IF v_proof IS NULL OR length(v_proof) < 32 THEN
    RAISE EXCEPTION 'Proof image is required';
  END IF;

  IF v_proof LIKE 'data:image/%' THEN
    IF length(v_proof) > 1500000 THEN
      RAISE EXCEPTION 'Proof image is too large. Use a smaller screenshot or crop the receipt.';
    END IF;
  ELSIF v_proof LIKE 'proof-storage:guest/%' THEN
    IF length(v_proof) > 256 THEN
      RAISE EXCEPTION 'Invalid proof storage reference';
    END IF;
    IF v_proof NOT LIKE ('proof-storage:guest/' || p_order_id || '/%') THEN
      RAISE EXCEPTION 'Proof path does not match this order';
    END IF;
  ELSIF v_proof LIKE 'proof-storage:%' THEN
    IF length(v_proof) > 256 THEN
      RAISE EXCEPTION 'Invalid proof storage reference';
    END IF;
    IF v_proof NOT LIKE ('%/' || p_order_id || '-proof%') THEN
      RAISE EXCEPTION 'Proof path does not match this order';
    END IF;
  ELSIF v_proof LIKE 'https://%' THEN
    IF length(v_proof) > 2048 THEN
      RAISE EXCEPTION 'Invalid proof URL';
    END IF;
  ELSE
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
    payment_proof_image = v_proof,
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
