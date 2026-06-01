-- Kado Events: multiple images, sign-up window, and registrations.

ALTER TABLE public.kk_events
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS signup_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS signup_opens_at timestamptz,
  ADD COLUMN IF NOT EXISTS signup_closes_at timestamptz,
  ADD COLUMN IF NOT EXISTS max_signups int;

UPDATE public.kk_events
SET images = CASE
  WHEN cover IS NOT NULL AND trim(cover) <> '' THEN jsonb_build_array(cover)
  ELSE '[]'::jsonb
END
WHERE images = '[]'::jsonb OR images IS NULL;

CREATE TABLE IF NOT EXISTS public.kk_event_registrations (
  id text PRIMARY KEY,
  event_id text NOT NULL REFERENCES public.kk_events(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.kk_profiles(id) ON DELETE SET NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kk_event_registrations_event ON public.kk_event_registrations(event_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kk_event_registrations_event_email
  ON public.kk_event_registrations(event_id, lower(contact_email));

ALTER TABLE public.kk_event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kk_event_registrations_select ON public.kk_event_registrations;
CREATE POLICY kk_event_registrations_select
ON public.kk_event_registrations
FOR SELECT
TO authenticated
USING (
  customer_id = auth.uid()
  OR public.kk_current_role() IN ('admin', 'barista', 'staff')
);

-- Inserts only via kk_register_for_event (SECURITY DEFINER).

CREATE OR REPLACE FUNCTION public.kk_register_for_event(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.kk_events%ROWTYPE;
  v_id text;
  v_uid uuid := auth.uid();
  v_role text := public.kk_current_role();
  v_customer_id uuid;
  v_name text;
  v_email text;
  v_phone text;
  v_now timestamptz := now();
  v_count int;
BEGIN
  IF payload IS NULL OR jsonb_typeof(payload) <> 'object' THEN
    RAISE EXCEPTION 'Invalid registration payload';
  END IF;

  v_id := nullif(trim(payload->>'id'), '');
  IF v_id IS NULL OR length(v_id) > 64 THEN
    RAISE EXCEPTION 'Invalid registration id';
  END IF;

  SELECT * INTO v_event
  FROM public.kk_events
  WHERE id = nullif(trim(payload->>'event_id'), '');

  IF NOT FOUND OR v_event.visible IS NOT TRUE THEN
    RAISE EXCEPTION 'Event is not available';
  END IF;

  IF v_event.signup_enabled IS NOT TRUE THEN
    RAISE EXCEPTION 'Sign-ups are not open for this event';
  END IF;

  IF v_event.signup_opens_at IS NOT NULL AND v_now < v_event.signup_opens_at THEN
    RAISE EXCEPTION 'Sign-ups have not opened yet';
  END IF;

  IF v_event.signup_closes_at IS NULL OR v_now >= v_event.signup_closes_at THEN
    RAISE EXCEPTION 'Sign-ups are closed for this event';
  END IF;

  IF v_event.ends_at IS NOT NULL AND v_now >= v_event.ends_at THEN
    RAISE EXCEPTION 'This event has already ended';
  END IF;

  IF v_uid IS NOT NULL AND v_role = 'customer' THEN
    v_customer_id := v_uid;
  ELSE
    v_customer_id := NULL;
  END IF;

  v_name := nullif(trim(payload->>'contact_name'), '');
  v_email := lower(nullif(trim(payload->>'contact_email'), ''));
  v_phone := nullif(trim(payload->>'contact_phone'), '');

  IF v_name IS NULL OR length(v_name) > 120 THEN
    RAISE EXCEPTION 'Name is required (max 120 characters)';
  END IF;
  IF v_email IS NULL OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'A valid email is required';
  END IF;
  IF v_phone IS NULL OR v_phone !~ '^\+639\d{9}$' THEN
    RAISE EXCEPTION 'Phone must be a valid Philippine mobile number (+63 9XX XXX XXXX)';
  END IF;

  IF v_event.max_signups IS NOT NULL AND v_event.max_signups > 0 THEN
    SELECT count(*)::int INTO v_count FROM public.kk_event_registrations WHERE event_id = v_event.id;
    IF v_count >= v_event.max_signups THEN
      RAISE EXCEPTION 'This event is full';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.kk_event_registrations
    WHERE event_id = v_event.id AND lower(contact_email) = v_email
  ) THEN
    RAISE EXCEPTION 'This email is already registered for this event';
  END IF;

  IF v_customer_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.kk_event_registrations
    WHERE event_id = v_event.id AND customer_id = v_customer_id
  ) THEN
    RAISE EXCEPTION 'You are already registered for this event';
  END IF;

  INSERT INTO public.kk_event_registrations (
    id, event_id, customer_id, contact_name, contact_email, contact_phone, created_at
  ) VALUES (
    v_id, v_event.id, v_customer_id, v_name, v_email, v_phone, v_now
  );

  RETURN jsonb_build_object(
    'id', v_id,
    'event_id', v_event.id,
    'created_at', v_now
  );
END;
$$;

REVOKE ALL ON FUNCTION public.kk_register_for_event(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_register_for_event(jsonb) TO anon, authenticated;

DO $m$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kk_event_registrations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kk_event_registrations;
  END IF;
END $m$;

ALTER TABLE public.kk_event_registrations REPLICA IDENTITY FULL;

-- Seed sign-up windows on demo events (closes 1 day before start).
UPDATE public.kk_events
SET
  signup_enabled = true,
  signup_opens_at = now() - interval '1 day',
  signup_closes_at = starts_at - interval '1 day'
WHERE id IN ('evt_latte_art', 'evt_cupping', 'evt_greenhills_opening')
  AND signup_closes_at IS NULL;
