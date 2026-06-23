-- Career applications: in-page forms (guest + logged-in), admin review.

CREATE TABLE IF NOT EXISTS public.kk_career_applications (
  id text PRIMARY KEY,
  listing_id text NOT NULL,
  listing_title text NOT NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL DEFAULT '',
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kk_career_applications_listing ON public.kk_career_applications(listing_id);
CREATE INDEX IF NOT EXISTS idx_kk_career_applications_created ON public.kk_career_applications(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kk_career_applications_listing_email
  ON public.kk_career_applications(listing_id, lower(contact_email));

ALTER TABLE public.kk_career_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kk_career_applications_admin_select ON public.kk_career_applications;
CREATE POLICY kk_career_applications_admin_select
  ON public.kk_career_applications FOR SELECT TO authenticated
  USING (public.kk_current_role() = 'admin');

DO $m$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kk_career_applications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kk_career_applications;
  END IF;
END $m$;

ALTER TABLE public.kk_career_applications REPLICA IDENTITY FULL;

CREATE OR REPLACE FUNCTION public.kk_submit_career_application(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_content jsonb;
  v_listings jsonb;
  v_listing jsonb;
  v_listing_id text;
  v_listing_title text;
  v_form jsonb;
  v_fields jsonb;
  v_field jsonb;
  v_field_id text;
  v_field_type text;
  v_field_label text;
  v_field_required boolean;
  v_field_maps text;
  v_options jsonb;
  v_raw text;
  v_answers jsonb;
  v_custom jsonb := '{}'::jsonb;
  v_opt text;
  v_found boolean;
  v_id text;
  v_uid uuid := auth.uid();
  v_role text := public.kk_current_role();
  v_customer_id uuid;
  v_name text;
  v_email text;
  v_phone text;
  v_visible boolean;
  v_apply_mode text;
BEGIN
  IF payload IS NULL OR jsonb_typeof(payload) <> 'object' THEN
    RAISE EXCEPTION 'Invalid application payload';
  END IF;

  v_id := nullif(trim(payload->>'id'), '');
  IF v_id IS NULL OR length(v_id) > 64 THEN
    RAISE EXCEPTION 'Invalid application id';
  END IF;

  v_listing_id := nullif(trim(payload->>'listing_id'), '');
  IF v_listing_id IS NULL THEN
    RAISE EXCEPTION 'Role is required';
  END IF;

  SELECT careers_content INTO v_content
  FROM public.kk_app_settings
  WHERE id IS TRUE;

  IF v_content IS NULL OR jsonb_typeof(v_content) <> 'object' THEN
    RAISE EXCEPTION 'Careers page is not configured';
  END IF;

  v_listings := COALESCE(v_content->'listings', '[]'::jsonb);
  v_listing := NULL;
  FOR v_field IN SELECT value FROM jsonb_array_elements(v_listings)
  LOOP
    IF nullif(trim(v_field->>'id'), '') = v_listing_id THEN
      v_listing := v_field;
      EXIT;
    END IF;
  END LOOP;

  IF v_listing IS NULL THEN
    RAISE EXCEPTION 'This role is no longer available';
  END IF;

  v_visible := COALESCE((v_listing->>'visible')::boolean, false);
  IF NOT v_visible THEN
    RAISE EXCEPTION 'This role is not accepting applications';
  END IF;

  v_apply_mode := COALESCE(nullif(trim(v_listing->>'applyMode'), ''), 'form');
  IF v_apply_mode <> 'form' THEN
    RAISE EXCEPTION 'This role uses an external application link';
  END IF;

  v_listing_title := COALESCE(nullif(trim(v_listing->>'title'), ''), 'Role');

  v_form := COALESCE(v_content->'applicationForm', '{}'::jsonb);
  v_fields := v_form->'fields';
  IF v_fields IS NULL OR jsonb_array_length(v_fields) = 0 THEN
    v_fields := '[
      {"id":"f_name","type":"text","label":"Full name","required":true,"mapsTo":"contact_name"},
      {"id":"f_phone","type":"phone","label":"Phone number","required":true,"mapsTo":"contact_phone"},
      {"id":"f_email","type":"email","label":"Email","required":true,"mapsTo":"contact_email"}
    ]'::jsonb;
  END IF;

  v_answers := COALESCE(payload->'answers', '{}'::jsonb);
  IF jsonb_typeof(v_answers) <> 'object' THEN
    v_answers := '{}'::jsonb;
  END IF;

  IF v_uid IS NOT NULL AND v_role = 'customer' THEN
    v_customer_id := v_uid;
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
      IF v_field_required AND NOT (v_answers ? v_field_id) THEN
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
        RAISE EXCEPTION 'Name is too long';
      END IF;
      v_name := v_raw;
    ELSE
      v_custom := v_custom || jsonb_build_object(v_field_id, v_raw);
    END IF;
  END LOOP;

  IF v_name IS NULL OR length(trim(v_name)) < 2 THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  IF v_phone IS NULL THEN
    RAISE EXCEPTION 'Phone number is required';
  END IF;

  INSERT INTO public.kk_career_applications (
    id, listing_id, listing_title, contact_name, contact_email, contact_phone, answers, customer_id
  ) VALUES (
    v_id, v_listing_id, v_listing_title, v_name, v_email, v_phone, v_custom, v_customer_id
  );

  RETURN jsonb_build_object(
    'id', v_id,
    'listing_id', v_listing_id,
    'listing_title', v_listing_title,
    'created_at', now()
  );
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'You already applied for this role with this email';
END;
$$;

REVOKE ALL ON FUNCTION public.kk_submit_career_application(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_submit_career_application(jsonb) TO anon, authenticated;
