-- Refine customer UPDATE guard: block paid/kitchen escalation, allow cancel + payment-method switch + GCash proof.
-- Also allow unpaid→pay-at-store paid while pending (switch to cash).
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
