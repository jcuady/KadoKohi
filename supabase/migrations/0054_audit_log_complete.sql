-- Audit trail DDL, RLS, kk_write_audit helper, and server-side order RPC logging.

CREATE TABLE IF NOT EXISTS public.kk_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  actor_role text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  branch_id text,
  summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kk_audit_logs_created_at_idx
  ON public.kk_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS kk_audit_logs_action_idx
  ON public.kk_audit_logs (action);

CREATE INDEX IF NOT EXISTS kk_audit_logs_entity_idx
  ON public.kk_audit_logs (entity_type, entity_id);

ALTER TABLE public.kk_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kk_audit_logs_insert_own ON public.kk_audit_logs;
CREATE POLICY kk_audit_logs_insert_own
  ON public.kk_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

DROP POLICY IF EXISTS kk_audit_logs_select_admin ON public.kk_audit_logs;
CREATE POLICY kk_audit_logs_select_admin
  ON public.kk_audit_logs
  FOR SELECT
  TO authenticated
  USING (public.kk_current_role() = 'admin');

CREATE OR REPLACE FUNCTION public.kk_write_audit(
  p_actor_id uuid,
  p_actor_email text,
  p_actor_role text,
  p_action text,
  p_entity_type text,
  p_entity_id text DEFAULT NULL,
  p_branch_id text DEFAULT NULL,
  p_summary text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.kk_audit_logs (
    actor_id,
    actor_email,
    actor_role,
    action,
    entity_type,
    entity_id,
    branch_id,
    summary,
    metadata,
    created_at
  ) VALUES (
    p_actor_id,
    p_actor_email,
    p_actor_role,
    p_action,
    p_entity_type,
    p_entity_id,
    p_branch_id,
    p_summary,
    coalesce(p_metadata, '{}'::jsonb),
    now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.kk_write_audit(uuid, text, text, text, text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_write_audit(uuid, text, text, text, text, text, text, text, jsonb) TO authenticated;

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

  PERFORM public.kk_write_audit(
    auth.uid(),
    NULL,
    'guest',
    'order.cancelled_by_guest',
    'order',
    p_order_id,
    v_order.branch_id,
    'Guest cancelled ' || v_order.short_code,
    jsonb_build_object('channel', v_order.channel, 'short_code', v_order.short_code)
  );

  RETURN jsonb_build_object(
    'id', p_order_id,
    'status', 'cancelled',
    'updated_at', now()
  );
END;
$$;

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

  PERFORM public.kk_write_audit(
    auth.uid(),
    NULL,
    'guest',
    'order.payment_switched_to_cash',
    'order',
    p_order_id,
    v_order.branch_id,
    'Guest switched ' || v_order.short_code || ' to pay at store',
    jsonb_build_object('channel', v_order.channel, 'short_code', v_order.short_code)
  );

  RETURN jsonb_build_object(
    'id', p_order_id,
    'payment_method', 'pay-at-store',
    'payment_status', 'paid',
    'updated_at', now()
  );
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

REVOKE ALL ON FUNCTION public.kk_admin_delete_order(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_admin_delete_order(text) TO authenticated;

REVOKE ALL ON FUNCTION public.kk_guest_cancel_order(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_guest_cancel_order(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.kk_guest_switch_to_cash(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_guest_switch_to_cash(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.kk_submit_guest_payment_proof(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_submit_guest_payment_proof(text, text) TO anon, authenticated;
