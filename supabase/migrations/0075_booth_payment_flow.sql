-- Booth payment flow: payment columns, proof RPC, admin patch, calendar pending kind.

-- ---------------------------------------------------------------------------
-- Booth booking payment columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.kk_booth_bookings
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'gcash-or-bank',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS payment_proof_image text,
  ADD COLUMN IF NOT EXISTS payment_proof_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_paid_at timestamptz;

-- ---------------------------------------------------------------------------
-- Calendar: blocked vs pending date kinds
-- ---------------------------------------------------------------------------
ALTER TABLE public.kk_event_date_blockouts
  ADD COLUMN IF NOT EXISTS block_kind text NOT NULL DEFAULT 'blocked';

UPDATE public.kk_event_date_blockouts SET block_kind = 'blocked' WHERE block_kind IS NULL;

CREATE OR REPLACE FUNCTION public.kk_fetch_event_calendar(p_year int, p_month int)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'blockouts',
      coalesce(
        (
          SELECT jsonb_agg(to_char(block_date, 'YYYY-MM-DD') ORDER BY block_date)
          FROM public.kk_event_date_blockouts
          WHERE block_kind = 'blocked'
            AND extract(year FROM block_date) = p_year
            AND extract(month FROM block_date) = p_month
        ),
        '[]'::jsonb
      ),
    'pending',
      coalesce(
        (
          SELECT jsonb_agg(to_char(block_date, 'YYYY-MM-DD') ORDER BY block_date)
          FROM public.kk_event_date_blockouts
          WHERE block_kind = 'pending'
            AND extract(year FROM block_date) = p_year
            AND extract(month FROM block_date) = p_month
        ),
        '[]'::jsonb
      ),
    'booked',
      coalesce(
        (
          SELECT jsonb_agg(d ORDER BY d)
          FROM (
            SELECT DISTINCT to_char(public.kk_event_date_local(event_date), 'YYYY-MM-DD') AS d
            FROM public.kk_booth_bookings
            WHERE status = 'confirmed'
              AND extract(year FROM public.kk_event_date_local(event_date)) = p_year
              AND extract(month FROM public.kk_event_date_local(event_date)) = p_month
          ) booked_days
        ),
        '[]'::jsonb
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.kk_admin_set_event_date_kind(
  p_date date,
  p_kind text,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind text := lower(trim(coalesce(p_kind, 'available')));
BEGIN
  IF public.kk_current_role() <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can manage the event calendar';
  END IF;

  IF p_date IS NULL OR p_date < (now() AT TIME ZONE 'Asia/Manila')::date THEN
    RAISE EXCEPTION 'Cannot change past dates';
  END IF;

  IF v_kind NOT IN ('available', 'blocked', 'pending') THEN
    RAISE EXCEPTION 'Invalid date kind';
  END IF;

  DELETE FROM public.kk_event_date_blockouts WHERE block_date = p_date;

  IF v_kind IN ('blocked', 'pending') THEN
    INSERT INTO public.kk_event_date_blockouts (block_date, block_kind, note, created_by)
    VALUES (p_date, v_kind, left(nullif(trim(p_note), ''), 200), auth.uid());
  END IF;

  RETURN jsonb_build_object(
    'block_date', to_char(p_date, 'YYYY-MM-DD'),
    'kind', v_kind
  );
END;
$$;

REVOKE ALL ON FUNCTION public.kk_admin_set_event_date_kind(date, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_admin_set_event_date_kind(date, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Customer payment proof upload for booth bookings
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kk_submit_booth_payment_proof(
  p_booking_id text,
  p_proof_data_url text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.kk_booth_bookings%ROWTYPE;
  v_proof text;
  v_uid uuid := auth.uid();
  v_role text := public.kk_current_role();
BEGIN
  IF p_booking_id IS NULL OR length(trim(p_booking_id)) = 0 OR length(p_booking_id) > 64 THEN
    RAISE EXCEPTION 'Invalid booking id';
  END IF;

  v_proof := trim(p_proof_data_url);
  IF v_proof IS NULL OR length(v_proof) < 32 THEN
    RAISE EXCEPTION 'Proof image is required';
  END IF;

  IF v_proof LIKE 'data:image/%' THEN
    IF length(v_proof) > 1500000 THEN
      RAISE EXCEPTION 'Proof image is too large. Use a smaller screenshot or crop the receipt.';
    END IF;
  ELSIF v_proof LIKE 'proof-storage:%' THEN
    IF length(v_proof) > 256 THEN
      RAISE EXCEPTION 'Invalid proof storage reference';
    END IF;
    IF v_proof NOT LIKE ('%/' || p_booking_id || '-proof%')
       AND v_proof NOT LIKE ('proof-storage:guest/' || p_booking_id || '/%') THEN
      RAISE EXCEPTION 'Proof path does not match this booking';
    END IF;
  ELSIF v_proof LIKE 'https://%' THEN
    IF length(v_proof) > 2048 THEN
      RAISE EXCEPTION 'Invalid proof URL';
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid proof image format';
  END IF;

  SELECT * INTO v_booking FROM public.kk_booth_bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_uid IS NOT NULL AND v_role = 'customer' AND v_booking.customer_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Not allowed to upload proof for this booking';
  END IF;

  IF v_booking.status NOT IN ('quoted', 'awaiting_confirmation') THEN
    RAISE EXCEPTION 'Payment proof is only accepted after a quote is sent';
  END IF;

  IF coalesce(v_booking.payment_amount, (v_booking.final_quote->>'total')::numeric, 0) <= 0 THEN
    RAISE EXCEPTION 'No payment amount is due for this booking';
  END IF;

  IF v_booking.payment_status NOT IN ('unpaid', 'proof_submitted') THEN
    RAISE EXCEPTION 'Payment already verified';
  END IF;

  UPDATE public.kk_booth_bookings
  SET
    payment_proof_image = v_proof,
    payment_proof_uploaded_at = now(),
    payment_status = 'proof_submitted',
    updated_at = now()
  WHERE id = p_booking_id;

  RETURN jsonb_build_object(
    'id', p_booking_id,
    'payment_status', 'proof_submitted',
    'updated_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.kk_submit_booth_payment_proof(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_submit_booth_payment_proof(text, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Staff/admin unified booth booking patch
-- ---------------------------------------------------------------------------
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

  UPDATE public.kk_booth_bookings
  SET
    status = CASE WHEN payload ? 'status' THEN nullif(trim(payload->>'status'), '') ELSE status END,
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
    payment_status = CASE
      WHEN payload ? 'payment_status' THEN coalesce(nullif(trim(payload->>'payment_status'), ''), payment_status)
      ELSE payment_status
    END,
    payment_amount = CASE
      WHEN payload ? 'payment_amount' THEN (payload->>'payment_amount')::numeric
      ELSE payment_amount
    END,
    payment_paid_at = CASE
      WHEN payload ? 'payment_paid_at' THEN (payload->>'payment_paid_at')::timestamptz
      WHEN payload->>'payment_status' = 'paid' THEN v_now
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
    'updated_at', v_row.updated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.kk_admin_patch_booth_booking(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_admin_patch_booth_booking(jsonb) TO authenticated;
