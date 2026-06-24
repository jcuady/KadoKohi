-- Restore staff booth booking UPDATE policy (dropped in 0059) and harden admin patch RPC.

DROP POLICY IF EXISTS kk_booth_bookings_staff_update ON public.kk_booth_bookings;
CREATE POLICY kk_booth_bookings_staff_update
  ON public.kk_booth_bookings FOR UPDATE TO authenticated
  USING (public.kk_current_role() IN ('admin', 'barista', 'staff'))
  WITH CHECK (public.kk_current_role() IN ('admin', 'barista', 'staff'));

CREATE OR REPLACE FUNCTION public.kk_admin_patch_booth_booking(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id text;
  v_role text := public.kk_current_role();
  v_now timestamptz := now();
  v_row public.kk_booth_bookings%ROWTYPE;
  v_status text;
  v_payment_status text;
BEGIN
  IF v_role NOT IN ('admin', 'barista', 'staff') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  IF payload IS NULL OR jsonb_typeof(payload) <> 'object' THEN
    RAISE EXCEPTION 'Invalid payload';
  END IF;

  v_id := nullif(trim(payload->>'id'), '');
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Booking id is required';
  END IF;

  SELECT * INTO v_row FROM public.kk_booth_bookings WHERE id = v_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  v_status := CASE
    WHEN payload ? 'status' THEN nullif(trim(payload->>'status'), '')
    ELSE v_row.status
  END;

  v_payment_status := CASE
    WHEN payload ? 'payment_status' THEN coalesce(nullif(trim(payload->>'payment_status'), ''), v_row.payment_status)
    ELSE v_row.payment_status
  END;

  IF v_status IS NOT NULL AND v_status NOT IN (
    'submitted', 'under_review', 'quoted', 'awaiting_confirmation',
    'confirmed', 'declined', 'cancelled', 'completed'
  ) THEN
    RAISE EXCEPTION 'Invalid booking status';
  END IF;

  IF v_payment_status NOT IN ('unpaid', 'proof_submitted', 'paid', 'refunded') THEN
    RAISE EXCEPTION 'Invalid payment status';
  END IF;

  -- Smart default: marking paid confirms the booking unless terminal status.
  IF v_payment_status = 'paid'
     AND NOT (payload ? 'status')
     AND v_row.status NOT IN ('declined', 'cancelled', 'completed') THEN
    v_status := 'confirmed';
  END IF;

  UPDATE public.kk_booth_bookings
  SET
    status = coalesce(v_status, status),
    assigned_staff_id = CASE
      WHEN payload ? 'assigned_staff_id' THEN nullif(trim(payload->>'assigned_staff_id'), '')::uuid
      ELSE assigned_staff_id
    END,
    final_quote = CASE WHEN payload ? 'final_quote' THEN payload->'final_quote' ELSE final_quote END,
    quote_notes = CASE WHEN payload ? 'quote_notes' THEN nullif(trim(payload->>'quote_notes'), '') ELSE quote_notes END,
    quoted_at = CASE
      WHEN payload ? 'quoted_at' THEN (payload->>'quoted_at')::timestamptz
      WHEN payload ? 'final_quote' THEN v_now
      ELSE quoted_at
    END,
    internal_notes = CASE WHEN payload ? 'internal_notes' THEN nullif(trim(payload->>'internal_notes'), '') ELSE internal_notes END,
    event_date = CASE WHEN payload ? 'event_date' THEN (payload->>'event_date')::timestamptz ELSE event_date END,
    starts_at = CASE WHEN payload ? 'starts_at' THEN (payload->>'starts_at')::timestamptz ELSE starts_at END,
    ends_at = CASE WHEN payload ? 'ends_at' THEN (payload->>'ends_at')::timestamptz ELSE ends_at END,
    payment_method = CASE
      WHEN payload ? 'payment_method' THEN coalesce(nullif(trim(payload->>'payment_method'), ''), payment_method)
      ELSE payment_method
    END,
    payment_status = v_payment_status,
    payment_amount = CASE
      WHEN payload ? 'payment_amount' THEN (payload->>'payment_amount')::numeric
      ELSE payment_amount
    END,
    payment_paid_at = CASE
      WHEN payload ? 'payment_paid_at' THEN (payload->>'payment_paid_at')::timestamptz
      WHEN v_payment_status = 'paid' AND payment_paid_at IS NULL THEN v_now
      WHEN v_payment_status = 'paid' AND payload ? 'payment_status' THEN v_now
      ELSE payment_paid_at
    END,
    updated_at = v_now
  WHERE id = v_id;

  SELECT * INTO v_row FROM public.kk_booth_bookings WHERE id = v_id;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'status', v_row.status,
    'payment_status', v_row.payment_status,
    'payment_amount', v_row.payment_amount,
    'payment_paid_at', v_row.payment_paid_at,
    'updated_at', v_row.updated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.kk_admin_patch_booth_booking(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_admin_patch_booth_booking(jsonb) TO authenticated;
