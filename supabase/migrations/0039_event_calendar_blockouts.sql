-- Event calendar: admin blockouts + public availability (no PII).
-- Booth proposals validate against blockouts and confirmed bookings.

CREATE TABLE IF NOT EXISTS public.kk_event_date_blockouts (
  block_date date PRIMARY KEY,
  note text,
  created_by uuid REFERENCES public.kk_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_kk_event_date_blockouts_updated_at ON public.kk_event_date_blockouts;
CREATE TRIGGER trg_kk_event_date_blockouts_updated_at
BEFORE UPDATE ON public.kk_event_date_blockouts
FOR EACH ROW
EXECUTE FUNCTION public.kk_set_updated_at();

ALTER TABLE public.kk_event_date_blockouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kk_event_date_blockouts_admin_all ON public.kk_event_date_blockouts;
CREATE POLICY kk_event_date_blockouts_admin_all
ON public.kk_event_date_blockouts
FOR ALL
TO authenticated
USING (public.kk_current_role() = 'admin')
WITH CHECK (public.kk_current_role() = 'admin');

CREATE OR REPLACE FUNCTION public.kk_event_date_local(p_ts timestamptz)
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (p_ts AT TIME ZONE 'Asia/Manila')::date;
$$;

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
          WHERE extract(year FROM block_date) = p_year
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
            WHERE status IN ('confirmed', 'awaiting_confirmation')
              AND extract(year FROM public.kk_event_date_local(event_date)) = p_year
              AND extract(month FROM public.kk_event_date_local(event_date)) = p_month
          ) booked_days
        ),
        '[]'::jsonb
      )
  );
$$;

REVOKE ALL ON FUNCTION public.kk_fetch_event_calendar(int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_fetch_event_calendar(int, int) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.kk_admin_toggle_event_blockout(p_date date, p_note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_blocked boolean;
BEGIN
  IF public.kk_current_role() <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can manage the event calendar';
  END IF;

  IF p_date IS NULL OR p_date < (now() AT TIME ZONE 'Asia/Manila')::date THEN
    RAISE EXCEPTION 'Cannot block past dates';
  END IF;

  IF EXISTS (SELECT 1 FROM public.kk_event_date_blockouts WHERE block_date = p_date) THEN
    DELETE FROM public.kk_event_date_blockouts WHERE block_date = p_date;
    v_blocked := false;
  ELSE
    INSERT INTO public.kk_event_date_blockouts (block_date, note, created_by)
    VALUES (p_date, left(nullif(trim(p_note), ''), 200), auth.uid());
    v_blocked := true;
  END IF;

  RETURN jsonb_build_object('block_date', to_char(p_date, 'YYYY-MM-DD'), 'blocked', v_blocked);
END;
$$;

REVOKE ALL ON FUNCTION public.kk_admin_toggle_event_blockout(date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_admin_toggle_event_blockout(date, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.kk_place_booth_booking(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id text;
  v_short_code text;
  v_uid uuid := auth.uid();
  v_role text := public.kk_current_role();
  v_customer_id uuid;
  v_branch_id text;
  v_contact_name text;
  v_contact_email text;
  v_contact_phone text;
  v_event_name text;
  v_occasion text;
  v_guest_count int;
  v_event_date timestamptz;
  v_event_day date;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_package_id text;
  v_package_name text;
  v_package_base numeric;
  v_now timestamptz := now();
  v_attempt int;
  v_min_day date := ((v_now + interval '1 day') AT TIME ZONE 'Asia/Manila')::date;
BEGIN
  IF payload IS NULL OR jsonb_typeof(payload) <> 'object' THEN
    RAISE EXCEPTION 'Invalid booking payload';
  END IF;

  v_id := nullif(trim(payload->>'id'), '');
  IF v_id IS NULL OR length(v_id) > 64 THEN
    RAISE EXCEPTION 'Invalid booking id';
  END IF;

  IF v_uid IS NOT NULL AND v_role = 'customer' THEN
    v_customer_id := v_uid;
  ELSE
    v_customer_id := NULL;
  END IF;

  v_branch_id := nullif(trim(payload->>'branch_id'), '');

  v_contact_name := nullif(trim(payload->>'contact_name'), '');
  v_contact_email := nullif(trim(payload->>'contact_email'), '');
  v_contact_phone := nullif(trim(payload->>'contact_phone'), '');
  IF v_contact_name IS NULL OR length(v_contact_name) > 120 THEN
    RAISE EXCEPTION 'Contact name is required (max 120 characters)';
  END IF;
  IF v_contact_email IS NULL OR v_contact_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'A valid contact email is required';
  END IF;
  IF v_contact_phone IS NULL OR length(v_contact_phone) > 40 THEN
    RAISE EXCEPTION 'Contact phone is required (max 40 characters)';
  END IF;

  v_event_name := nullif(trim(payload->>'event_name'), '');
  IF v_event_name IS NULL OR length(v_event_name) > 160 THEN
    RAISE EXCEPTION 'Event name is required (max 160 characters)';
  END IF;

  v_occasion := coalesce(nullif(trim(payload->>'occasion'), ''), 'other');
  IF v_occasion NOT IN ('birthday', 'wedding', 'corporate', 'private_party', 'engagement', 'other') THEN
    v_occasion := 'other';
  END IF;

  v_guest_count := coalesce((payload->>'guest_count')::int, 0);
  IF v_guest_count < 1 OR v_guest_count > 10000 THEN
    RAISE EXCEPTION 'Guest count must be between 1 and 10000';
  END IF;

  v_event_date := (payload->>'event_date')::timestamptz;
  v_starts_at := (payload->>'starts_at')::timestamptz;
  v_ends_at := (payload->>'ends_at')::timestamptz;
  IF v_event_date IS NULL OR v_starts_at IS NULL OR v_ends_at IS NULL THEN
    RAISE EXCEPTION 'Event date and schedule are required';
  END IF;
  IF v_ends_at <= v_starts_at THEN
    RAISE EXCEPTION 'Event end time must be after the start time';
  END IF;

  v_event_day := public.kk_event_date_local(v_event_date);
  IF v_event_day < v_min_day THEN
    RAISE EXCEPTION 'Please choose a date at least 24 hours from now';
  END IF;

  IF EXISTS (SELECT 1 FROM public.kk_event_date_blockouts WHERE block_date = v_event_day) THEN
    RAISE EXCEPTION 'That date is not available. Please choose another day on the calendar.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.kk_booth_bookings
    WHERE status IN ('confirmed', 'awaiting_confirmation')
      AND public.kk_event_date_local(event_date) = v_event_day
  ) THEN
    RAISE EXCEPTION 'That date is already booked. Please choose another available day.';
  END IF;

  v_package_id := coalesce(nullif(trim(payload->>'package_id'), ''), 'event_proposal');
  v_package_name := coalesce(nullif(trim(payload->>'package_name_snapshot'), ''), 'Event Proposal');
  v_package_base := coalesce((payload->>'package_base_price_snapshot')::numeric, 0);

  FOR v_attempt IN 1..12 LOOP
    v_short_code := 'BK-' || floor(1000 + random() * 9000)::text;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.kk_booth_bookings WHERE short_code = v_short_code);
  END LOOP;
  IF v_short_code IS NULL THEN
    RAISE EXCEPTION 'Could not allocate booking code';
  END IF;

  INSERT INTO public.kk_booth_bookings (
    id, short_code, branch_id, customer_id,
    contact_name, contact_email, contact_phone,
    event_name, occasion, guest_count,
    event_date, starts_at, ends_at,
    package_id, package_name_snapshot, package_base_price_snapshot,
    selected_addons, special_requests, estimate_snapshot,
    status, created_at, updated_at
  ) VALUES (
    v_id, v_short_code, v_branch_id, v_customer_id,
    v_contact_name, v_contact_email, v_contact_phone,
    v_event_name, v_occasion, v_guest_count,
    v_event_date, v_starts_at, v_ends_at,
    v_package_id, v_package_name, v_package_base,
    coalesce(payload->'selected_addons', '[]'::jsonb),
    left(nullif(trim(payload->>'special_requests'), ''), 1000),
    coalesce(payload->'estimate_snapshot', '{}'::jsonb),
    'submitted', v_now, v_now
  );

  RETURN jsonb_build_object(
    'id', v_id,
    'short_code', v_short_code,
    'customer_id', v_customer_id,
    'status', 'submitted',
    'created_at', v_now,
    'updated_at', v_now
  );
END;
$$;
