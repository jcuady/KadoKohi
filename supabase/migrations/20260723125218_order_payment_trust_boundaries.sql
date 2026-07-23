-- Trust boundaries for payments / loyalty (audit 2026-07-23).
-- 1) Gateway orders cannot insert as paid (except POS counter).
-- 2) Customers cannot escalate payment_status/status/money fields via PostgREST.
-- 3) Customers cannot self-write loyalty_stamps; staff award via SECURITY DEFINER RPC.

-- ─── 1. INSERT: force unpaid+pending for non-POS gateway methods ─────────────
CREATE OR REPLACE FUNCTION public.kk_orders_enforce_payment_invariants()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- POS counter may record gcash/cash as already collected.
  IF NEW.channel IS DISTINCT FROM 'pos'
     AND NEW.payment_method IN ('paymongo', 'gcash-qr') THEN
    NEW.payment_status := 'unpaid';
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kk_orders_enforce_payment_invariants ON public.kk_orders;
CREATE TRIGGER trg_kk_orders_enforce_payment_invariants
  BEFORE INSERT ON public.kk_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.kk_orders_enforce_payment_invariants();

-- ─── 2. UPDATE: customers cannot forge paid / advance kitchen ────────────────
CREATE OR REPLACE FUNCTION public.kk_orders_protect_customer_mutations()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_role text := public.kk_current_role();
BEGIN
  -- service_role / anon guest RPCs / staff: unrestricted (RPCs still enforce their own rules).
  IF v_role IS DISTINCT FROM 'customer' THEN
    RETURN NEW;
  END IF;

  -- Never allow customers to mark paid / refunded.
  -- Exception: unpaid → pay-at-store paid while pending (switch to cash RPC).
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
     AND NEW.payment_status IN ('paid', 'refunded') THEN
    IF NOT (
      NEW.payment_status = 'paid'
      AND NEW.payment_method = 'pay-at-store'
      AND OLD.payment_status = 'unpaid'
      AND OLD.status = 'pending'
      AND NEW.status = 'pending'
    ) THEN
      RAISE EXCEPTION 'Customers cannot mark orders paid';
    END IF;
  END IF;

  -- Allow unpaid ↔ proof_submitted for GCash; allow unpaid when switching methods.
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
     AND NEW.payment_status NOT IN ('unpaid', 'proof_submitted', 'paid') THEN
    RAISE EXCEPTION 'Customers cannot change payment status';
  END IF;

  -- Allow cancel while still pending; block kitchen advancement.
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

DROP TRIGGER IF EXISTS trg_kk_orders_protect_customer_mutations ON public.kk_orders;
CREATE TRIGGER trg_kk_orders_protect_customer_mutations
  BEFORE UPDATE ON public.kk_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.kk_orders_protect_customer_mutations();

-- ─── 3. Profiles: customers cannot self-set loyalty_stamps ───────────────────
CREATE OR REPLACE FUNCTION public.kk_profiles_protect_loyalty_stamps()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF public.kk_current_role() = 'customer'
     AND NEW.loyalty_stamps IS DISTINCT FROM OLD.loyalty_stamps THEN
    RAISE EXCEPTION 'Customers cannot modify loyalty stamps directly';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kk_profiles_protect_loyalty_stamps ON public.kk_profiles;
CREATE TRIGGER trg_kk_profiles_protect_loyalty_stamps
  BEFORE UPDATE ON public.kk_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.kk_profiles_protect_loyalty_stamps();

-- ─── 4. Atomic, idempotent stamp award (staff only) ─────────────────────────
CREATE OR REPLACE FUNCTION public.kk_award_loyalty_stamps(p_order_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text := public.kk_current_role();
  v_order public.kk_orders%ROWTYPE;
  v_delta int := 0;
BEGIN
  IF v_role IS NULL OR v_role NOT IN ('admin', 'barista', 'staff') THEN
    RAISE EXCEPTION 'Only staff may award loyalty stamps';
  END IF;

  SELECT * INTO v_order
  FROM public.kk_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_role IN ('barista', 'staff')
     AND v_order.branch_id IS DISTINCT FROM public.kk_current_branch() THEN
    RAISE EXCEPTION 'Order branch does not match your assignment';
  END IF;

  IF v_order.status <> 'completed' THEN
    RAISE EXCEPTION 'Order is not completed';
  END IF;

  IF v_order.customer_id IS NULL THEN
    RETURN jsonb_build_object('awarded', 0, 'already', true);
  END IF;

  IF v_order.loyalty_stamps_awarded IS NOT NULL THEN
    RETURN jsonb_build_object('awarded', v_order.loyalty_stamps_awarded, 'already', true);
  END IF;

  IF v_order.channel = 'merch' THEN
    v_delta := 0;
  ELSE
    SELECT coalesce(sum(oi.qty), 0)::int
    INTO v_delta
    FROM public.kk_order_items oi
    WHERE oi.order_id = p_order_id
      AND coalesce(oi.item_type, 'coffee') <> 'merch';
  END IF;

  UPDATE public.kk_orders
  SET loyalty_stamps_awarded = v_delta,
      updated_at = now()
  WHERE id = p_order_id;

  IF v_delta > 0 THEN
    UPDATE public.kk_profiles
    SET loyalty_stamps = coalesce(loyalty_stamps, 0) + v_delta
    WHERE id = v_order.customer_id;
  END IF;

  RETURN jsonb_build_object('awarded', v_delta, 'already', false);
END;
$$;

REVOKE ALL ON FUNCTION public.kk_award_loyalty_stamps(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_award_loyalty_stamps(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kk_award_loyalty_stamps(text) TO service_role;
