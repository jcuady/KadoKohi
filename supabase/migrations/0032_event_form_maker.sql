-- Reusable event registration forms + per-event assignment + custom answers.

CREATE TABLE IF NOT EXISTS public.kk_event_forms (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_kk_event_forms_updated_at ON public.kk_event_forms;
CREATE TRIGGER trg_kk_event_forms_updated_at
BEFORE UPDATE ON public.kk_event_forms
FOR EACH ROW
EXECUTE FUNCTION public.kk_set_updated_at();

ALTER TABLE public.kk_events
  ADD COLUMN IF NOT EXISTS signup_form_id text REFERENCES public.kk_event_forms(id) ON DELETE SET NULL;

ALTER TABLE public.kk_event_registrations
  ADD COLUMN IF NOT EXISTS custom_answers jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.kk_event_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kk_event_forms_select ON public.kk_event_forms;
CREATE POLICY kk_event_forms_select
ON public.kk_event_forms
FOR SELECT
TO anon, authenticated
USING (
  public.kk_current_role() IN ('admin', 'barista', 'staff')
  OR EXISTS (
    SELECT 1 FROM public.kk_events e
    WHERE e.signup_form_id = kk_event_forms.id AND e.visible IS TRUE
  )
);

DROP POLICY IF EXISTS kk_event_forms_admin_insert ON public.kk_event_forms;
CREATE POLICY kk_event_forms_admin_insert
ON public.kk_event_forms
FOR INSERT
TO authenticated
WITH CHECK (public.kk_current_role() = 'admin');

DROP POLICY IF EXISTS kk_event_forms_admin_update ON public.kk_event_forms;
CREATE POLICY kk_event_forms_admin_update
ON public.kk_event_forms
FOR UPDATE
TO authenticated
USING (public.kk_current_role() = 'admin')
WITH CHECK (public.kk_current_role() = 'admin');

DROP POLICY IF EXISTS kk_event_forms_admin_delete ON public.kk_event_forms;
CREATE POLICY kk_event_forms_admin_delete
ON public.kk_event_forms
FOR DELETE
TO authenticated
USING (public.kk_current_role() = 'admin');

DO $m$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kk_event_forms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kk_event_forms;
  END IF;
END $m$;

ALTER TABLE public.kk_event_forms REPLICA IDENTITY FULL;

-- Default template (standard name / phone / email).
INSERT INTO public.kk_event_forms (id, name, description, fields)
VALUES (
  'form_standard_signup',
  'Standard sign-up',
  'Full name, Philippine mobile (+63), and email',
  '[
    {"id":"f_name","type":"text","label":"Full name","placeholder":"Your name","required":true,"mapsTo":"contact_name"},
    {"id":"f_phone","type":"phone","label":"Phone number","required":true,"mapsTo":"contact_phone"},
    {"id":"f_email","type":"email","label":"Email","placeholder":"you@email.com","required":true,"mapsTo":"contact_email"}
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.kk_register_for_event(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.kk_events%ROWTYPE;
  v_form public.kk_event_forms%ROWTYPE;
  v_id text;
  v_uid uuid := auth.uid();
  v_role text := public.kk_current_role();
  v_customer_id uuid;
  v_name text;
  v_email text;
  v_phone text;
  v_now timestamptz := now();
  v_count int;
  v_fields jsonb;
  v_field jsonb;
  v_field_id text;
  v_field_type text;
  v_field_label text;
  v_field_required boolean;
  v_field_maps text;
  v_options jsonb;
  v_raw text;
  v_custom jsonb := '{}'::jsonb;
  v_answers jsonb;
  v_opt text;
  v_found boolean;
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

  v_answers := COALESCE(payload->'answers', '{}'::jsonb);
  IF jsonb_typeof(v_answers) <> 'object' THEN
    v_answers := '{}'::jsonb;
  END IF;

  IF v_event.signup_form_id IS NOT NULL THEN
    SELECT * INTO v_form FROM public.kk_event_forms WHERE id = v_event.signup_form_id;
    IF FOUND THEN
      v_fields := v_form.fields;
    END IF;
  END IF;

  IF v_fields IS NULL OR jsonb_array_length(v_fields) = 0 THEN
    v_fields := '[
      {"id":"f_name","type":"text","label":"Full name","required":true,"mapsTo":"contact_name"},
      {"id":"f_phone","type":"phone","label":"Phone number","required":true,"mapsTo":"contact_phone"},
      {"id":"f_email","type":"email","label":"Email","required":true,"mapsTo":"contact_email"}
    ]'::jsonb;
  END IF;

  FOR v_field IN SELECT value FROM jsonb_array_elements(v_fields)
  LOOP
    v_field_id := nullif(trim(v_field->>'id'), '');
    v_field_type := nullif(trim(v_field->>'type'), '');
    v_field_label := COALESCE(nullif(trim(v_field->>'label'), ''), 'Field');
    v_field_required := COALESCE((v_field->>'required')::boolean, false);
    v_field_maps := nullif(trim(v_field->>'mapsTo'), '');
    v_options := v_field->'options';
    v_raw := nullif(trim(v_answers->>v_field_id), '');

    IF v_field_type = 'checkbox' THEN
      IF v_field_required AND (v_answers->>v_field_id IS NULL) THEN
        RAISE EXCEPTION '% is required', v_field_label;
      END IF;
      IF v_answers ? v_field_id THEN
        v_custom := v_custom || jsonb_build_object(v_field_id, (v_answers->>v_field_id)::boolean);
      END IF;
      CONTINUE;
    END IF;

    IF v_raw IS NULL THEN
      IF v_field_required THEN
        RAISE EXCEPTION '% is required', v_field_label;
      END IF;
      CONTINUE;
    END IF;

    IF v_field_type = 'email' OR v_field_maps = 'contact_email' THEN
      IF v_raw !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
        RAISE EXCEPTION 'A valid email is required for %', v_field_label;
      END IF;
      IF v_field_maps = 'contact_email' THEN
        v_email := lower(v_raw);
      ELSE
        v_custom := v_custom || jsonb_build_object(v_field_id, lower(v_raw));
      END IF;
      CONTINUE;
    END IF;

    IF v_field_type = 'phone' OR v_field_maps = 'contact_phone' THEN
      IF v_raw !~ '^\+639\d{9}$' AND v_raw !~ '^9\d{9}$' THEN
        RAISE EXCEPTION 'Phone must be a valid Philippine mobile number (+63 9XX XXX XXXX)';
      END IF;
      IF v_raw ~ '^9\d{9}$' THEN
        v_raw := '+63' || v_raw;
      END IF;
      IF v_field_maps = 'contact_phone' THEN
        v_phone := v_raw;
      ELSE
        v_custom := v_custom || jsonb_build_object(v_field_id, v_raw);
      END IF;
      CONTINUE;
    END IF;

    IF v_field_type = 'select' THEN
      v_found := false;
      IF jsonb_typeof(v_options) = 'array' THEN
        FOR v_opt IN SELECT jsonb_array_elements_text(v_options)
        LOOP
          IF v_opt = v_raw THEN
            v_found := true;
            EXIT;
          END IF;
        END LOOP;
      END IF;
      IF NOT v_found THEN
        RAISE EXCEPTION 'Choose a valid option for %', v_field_label;
      END IF;
      v_custom := v_custom || jsonb_build_object(v_field_id, v_raw);
      CONTINUE;
    END IF;

    IF v_field_type = 'number' THEN
      IF v_raw !~ '^-?\d+(\.\d+)?$' THEN
        RAISE EXCEPTION '% must be a number', v_field_label;
      END IF;
      v_custom := v_custom || jsonb_build_object(v_field_id, v_raw::numeric);
      CONTINUE;
    END IF;

    IF v_field_maps = 'contact_name' THEN
      IF length(v_raw) > 120 THEN
        RAISE EXCEPTION 'Name is required (max 120 characters)';
      END IF;
      v_name := v_raw;
    ELSE
      v_custom := v_custom || jsonb_build_object(v_field_id, v_raw);
    END IF;
  END LOOP;

  -- Legacy payload keys when form answers omit mapped fields.
  IF v_name IS NULL THEN
    v_name := nullif(trim(payload->>'contact_name'), '');
  END IF;
  IF v_email IS NULL THEN
    v_email := lower(nullif(trim(payload->>'contact_email'), ''));
  END IF;
  IF v_phone IS NULL THEN
    v_phone := nullif(trim(payload->>'contact_phone'), '');
    IF v_phone ~ '^9\d{9}$' THEN
      v_phone := '+63' || v_phone;
    END IF;
  END IF;

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
    id, event_id, customer_id, contact_name, contact_email, contact_phone, custom_answers, created_at
  ) VALUES (
    v_id, v_event.id, v_customer_id, v_name, v_email, v_phone, v_custom, v_now
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
