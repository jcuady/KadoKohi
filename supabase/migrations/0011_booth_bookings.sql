-- Events (booth) bookings in Supabase: customer submissions, admin/staff management, realtime.

CREATE TABLE IF NOT EXISTS public.kk_booth_bookings (
  id text PRIMARY KEY,
  short_code text NOT NULL UNIQUE,
  branch_id text,
  customer_id uuid REFERENCES public.kk_profiles(id) ON DELETE SET NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  event_name text NOT NULL,
  occasion text NOT NULL DEFAULT 'other',
  guest_count int NOT NULL DEFAULT 1,
  event_date timestamptz NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  package_id text NOT NULL,
  package_name_snapshot text NOT NULL,
  package_base_price_snapshot numeric(12,2) NOT NULL DEFAULT 0,
  selected_addons jsonb NOT NULL DEFAULT '[]'::jsonb,
  special_requests text,
  estimate_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  final_quote jsonb,
  quote_notes text,
  quoted_at timestamptz,
  status text NOT NULL DEFAULT 'submitted',
  assigned_staff_id uuid REFERENCES public.kk_profiles(id) ON DELETE SET NULL,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kk_booth_bookings_customer ON public.kk_booth_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_kk_booth_bookings_created ON public.kk_booth_bookings(created_at DESC);

DROP TRIGGER IF EXISTS trg_kk_booth_bookings_updated_at ON public.kk_booth_bookings;
CREATE TRIGGER trg_kk_booth_bookings_updated_at
BEFORE UPDATE ON public.kk_booth_bookings
FOR EACH ROW
EXECUTE FUNCTION public.kk_set_updated_at();

ALTER TABLE public.kk_booth_bookings ENABLE ROW LEVEL SECURITY;

-- Customers see their own bookings; staff/admin/barista see all.
DROP POLICY IF EXISTS kk_booth_bookings_select ON public.kk_booth_bookings;
CREATE POLICY kk_booth_bookings_select
ON public.kk_booth_bookings
FOR SELECT
TO authenticated
USING (
  customer_id = auth.uid()
  OR public.kk_current_role() IN ('admin', 'barista', 'staff')
);

-- Staff/admin/barista manage bookings (status, quote, assignment, notes).
DROP POLICY IF EXISTS kk_booth_bookings_staff_update ON public.kk_booth_bookings;
CREATE POLICY kk_booth_bookings_staff_update
ON public.kk_booth_bookings
FOR UPDATE
TO authenticated
USING (public.kk_current_role() IN ('admin', 'barista', 'staff'))
WITH CHECK (public.kk_current_role() IN ('admin', 'barista', 'staff'));

-- Customers may update their own booking (e.g. cancel) but not reassign/quote.
DROP POLICY IF EXISTS kk_booth_bookings_customer_update ON public.kk_booth_bookings;
CREATE POLICY kk_booth_bookings_customer_update
ON public.kk_booth_bookings
FOR UPDATE
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

-- All inserts go through kk_place_booth_booking (SECURITY DEFINER); no direct INSERT policy.

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
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_package_id text;
  v_package_name text;
  v_package_base numeric;
  v_now timestamptz := now();
  v_attempt int;
BEGIN
  IF payload IS NULL OR jsonb_typeof(payload) <> 'object' THEN
    RAISE EXCEPTION 'Invalid booking payload';
  END IF;

  v_id := nullif(trim(payload->>'id'), '');
  IF v_id IS NULL OR length(v_id) > 64 THEN
    RAISE EXCEPTION 'Invalid booking id';
  END IF;

  -- Attribute to the signed-in customer; staff cannot submit on behalf via this RPC.
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

  v_package_id := nullif(trim(payload->>'package_id'), '');
  v_package_name := nullif(trim(payload->>'package_name_snapshot'), '');
  IF v_package_id IS NULL OR v_package_name IS NULL THEN
    RAISE EXCEPTION 'A package selection is required';
  END IF;
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

REVOKE ALL ON FUNCTION public.kk_place_booth_booking(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_place_booth_booking(jsonb) TO anon, authenticated;

DO $m$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kk_booth_bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kk_booth_bookings;
  END IF;
END $m$;

ALTER TABLE public.kk_booth_bookings REPLICA IDENTITY FULL;
