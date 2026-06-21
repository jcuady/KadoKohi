-- Fix kk_write_audit call sites: auth.users.email is varchar, helper expects text.

CREATE OR REPLACE FUNCTION public.kk_admin_delete_order(p_order_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.kk_orders%ROWTYPE;
  v_uid uuid := auth.uid();
BEGIN
  IF public.kk_current_role() <> 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_order_id IS NULL OR length(trim(p_order_id)) = 0 OR length(p_order_id) > 64 THEN
    RAISE EXCEPTION 'Invalid order id';
  END IF;

  SELECT * INTO v_order FROM public.kk_orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or already deleted';
  END IF;

  DELETE FROM public.kk_promo_claims WHERE order_id = p_order_id;

  UPDATE public.kk_loyalty_vouchers
  SET redeemed_order_id = NULL
  WHERE redeemed_order_id = p_order_id;

  DELETE FROM public.kk_orders WHERE id = p_order_id;

  PERFORM public.kk_write_audit(
    v_uid,
    (SELECT email::text FROM auth.users WHERE id = v_uid),
    'admin',
    'order.deleted',
    'order',
    p_order_id,
    v_order.branch_id,
    'Deleted ' || v_order.short_code,
    jsonb_build_object('channel', v_order.channel, 'status', v_order.status, 'total', v_order.total)
  );

  RETURN jsonb_build_object('ok', true, 'id', p_order_id);
END;
$$;

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

  PERFORM public.kk_write_audit(
    auth.uid(),
    (SELECT email::text FROM auth.users WHERE id = auth.uid()),
    CASE WHEN auth.uid() IS NULL THEN 'guest' ELSE coalesce(public.kk_current_role(), 'customer') END,
    'order.proof_submitted',
    'order',
    p_order_id,
    v_order.branch_id,
    'Payment proof submitted for ' || v_order.short_code,
    jsonb_build_object('channel', v_order.channel, 'short_code', v_order.short_code)
  );

  RETURN jsonb_build_object(
    'id', p_order_id,
    'payment_status', 'proof_submitted',
    'updated_at', now()
  );
END;
$$;

-- kk_place_order: patch audit email cast only (full body unchanged in 0055).
DO $patch$
DECLARE
  v_def text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'kk_place_order';

  IF v_def IS NULL THEN
    RAISE EXCEPTION 'kk_place_order not found';
  END IF;

  IF v_def NOT LIKE '%email::text%' THEN
    v_def := replace(
      v_def,
      '(SELECT email FROM auth.users WHERE id = v_uid)',
      '(SELECT email::text FROM auth.users WHERE id = v_uid)'
    );
    EXECUTE v_def;
  END IF;
END $patch$;
