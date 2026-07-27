-- P0 payment trust: narrow switch-to-cash paid exception to QR dine-in/takeout;
-- allow merch GCash proof (RPC + storage policies).
-- Target: idwtlujcdfnnndxmlaco

CREATE OR REPLACE FUNCTION public.kk_orders_protect_customer_mutations()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_role text := public.kk_current_role();
BEGIN
  IF v_role IS DISTINCT FROM 'customer' THEN
    RETURN NEW;
  END IF;

  -- Block paid/refunded except unpaid→pay-at-store (switch to cash) while pending
  -- on QR dine-in/takeout only. Online/merch must never self-mark paid via table UPDATE.
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
     AND NEW.payment_status IN ('paid', 'refunded') THEN
    IF NOT (
      NEW.payment_status = 'paid'
      AND NEW.payment_method = 'pay-at-store'
      AND OLD.payment_status = 'unpaid'
      AND OLD.status = 'pending'
      AND NEW.status = 'pending'
      AND OLD.channel IN ('dine-in', 'takeout')
      AND NEW.channel IN ('dine-in', 'takeout')
    ) THEN
      RAISE EXCEPTION 'Customers cannot mark orders paid';
    END IF;
  END IF;

  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
     AND NEW.payment_status NOT IN ('unpaid', 'proof_submitted', 'paid') THEN
    RAISE EXCEPTION 'Customers cannot change payment status';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (NEW.status = 'cancelled' AND OLD.status = 'pending') THEN
      RAISE EXCEPTION 'Customers cannot change order status';
    END IF;
  END IF;

  IF NEW.loyalty_stamps_awarded IS DISTINCT FROM OLD.loyalty_stamps_awarded THEN
    RAISE EXCEPTION 'Customers cannot award loyalty stamps';
  END IF;

  IF NEW.total IS DISTINCT FROM OLD.total
     OR NEW.subtotal IS DISTINCT FROM OLD.subtotal
     OR NEW.tax IS DISTINCT FROM OLD.tax
     OR NEW.modifiers_total IS DISTINCT FROM OLD.modifiers_total
     OR NEW.customer_id IS DISTINCT FROM OLD.customer_id
     OR NEW.channel IS DISTINCT FROM OLD.channel
     OR NEW.branch_id IS DISTINCT FROM OLD.branch_id
     OR NEW.paymongo_payment_id IS DISTINCT FROM OLD.paymongo_payment_id
     OR NEW.paymongo_checkout_session_id IS DISTINCT FROM OLD.paymongo_checkout_session_id
  THEN
    RAISE EXCEPTION 'Customers cannot modify protected order fields';
  END IF;

  RETURN NEW;
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
  v_uid uuid := public.requesting_profile_id();
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

  IF v_order.channel NOT IN ('dine-in', 'takeout', 'online', 'merch') THEN
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
    v_uid,
    public.kk_requesting_actor_email(),
    CASE WHEN v_uid IS NULL THEN 'guest' ELSE coalesce(public.kk_current_role(), 'customer') END,
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

REVOKE ALL ON FUNCTION public.kk_submit_guest_payment_proof(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_submit_guest_payment_proof(text, text) TO anon, authenticated;

-- Guest proof storage: include merch channel
DROP POLICY IF EXISTS "payment_proofs_guest_insert" ON storage.objects;
CREATE POLICY "payment_proofs_guest_insert"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'kado-payment-proofs'
  AND (storage.foldername(name))[1] = 'guest'
  AND EXISTS (
    SELECT 1 FROM public.kk_orders o
    WHERE o.id = (storage.foldername(name))[2]
      AND o.payment_method = 'gcash-qr'
      AND o.payment_status IN ('unpaid', 'proof_submitted')
      AND o.channel IN ('dine-in', 'takeout', 'online', 'merch')
  )
);

DROP POLICY IF EXISTS "payment_proofs_guest_update" ON storage.objects;
CREATE POLICY "payment_proofs_guest_update"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (
  bucket_id = 'kado-payment-proofs'
  AND (storage.foldername(name))[1] = 'guest'
  AND EXISTS (
    SELECT 1 FROM public.kk_orders o
    WHERE o.id = (storage.foldername(name))[2]
      AND o.payment_method = 'gcash-qr'
      AND o.payment_status IN ('unpaid', 'proof_submitted')
      AND o.channel IN ('dine-in', 'takeout', 'online', 'merch')
  )
)
WITH CHECK (
  bucket_id = 'kado-payment-proofs'
  AND (storage.foldername(name))[1] = 'guest'
  AND EXISTS (
    SELECT 1 FROM public.kk_orders o
    WHERE o.id = (storage.foldername(name))[2]
      AND o.payment_method = 'gcash-qr'
      AND o.payment_status IN ('unpaid', 'proof_submitted')
      AND o.channel IN ('dine-in', 'takeout', 'online', 'merch')
  )
);

NOTIFY pgrst, 'reload schema';
