-- Permanent Clerk id fix: never cast user_… to uuid; purge legacy auth.uid() RLS on kk_profiles.

CREATE OR REPLACE FUNCTION public.kk_try_uuid_from_text(p_text text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_text IS NULL OR NOT public.kk_is_uuid_text(p_text) THEN
    RETURN NULL;
  END IF;
  RETURN p_text::uuid;
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.kk_requesting_user_sub()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(trim(auth.jwt() ->> 'sub'), '');
$$;

-- Clerk users: match clerk_user_id only. Legacy Supabase Auth: safe uuid parse (never throws).
CREATE OR REPLACE FUNCTION public.requesting_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT p.id
      FROM public.kk_profiles p
      WHERE p.clerk_user_id = public.kk_requesting_user_sub()
      LIMIT 1
    ),
    (
      SELECT p.id
      FROM public.kk_profiles p
      WHERE p.id = public.kk_try_uuid_from_text(public.kk_requesting_user_sub())
      LIMIT 1
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.kk_ensure_my_profile(p_name text DEFAULT NULL)
RETURNS public.kk_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub text := public.kk_requesting_user_sub();
  v_email text := COALESCE(NULLIF(trim(auth.jwt() ->> 'email'), ''), '');
  v_name text;
  v_row public.kk_profiles;
BEGIN
  IF v_sub IS NULL OR v_sub = '' THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_name := COALESCE(
    NULLIF(trim(p_name), ''),
    NULLIF(trim(auth.jwt() -> 'user_metadata' ->> 'name'), ''),
    NULLIF(trim(auth.jwt() -> 'unsafe_metadata' ->> 'name'), ''),
    split_part(NULLIF(v_email, ''), '@', 1),
    'User'
  );

  SELECT * INTO v_row
  FROM public.kk_profiles
  WHERE clerk_user_id = v_sub
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.kk_profiles
    SET
      name = COALESCE(NULLIF(trim(p_name), ''), name),
      email = CASE WHEN v_email <> '' THEN v_email ELSE email END
    WHERE id = v_row.id
    RETURNING * INTO v_row;
    RETURN v_row;
  END IF;

  IF v_email <> '' THEN
    SELECT * INTO v_row
    FROM public.kk_profiles
    WHERE lower(email) = lower(v_email)
    LIMIT 1;

    IF FOUND THEN
      UPDATE public.kk_profiles
      SET
        clerk_user_id = v_sub,
        name = COALESCE(NULLIF(trim(p_name), ''), name),
        email = v_email
      WHERE id = v_row.id
      RETURNING * INTO v_row;
      RETURN v_row;
    END IF;
  END IF;

  INSERT INTO public.kk_profiles (id, clerk_user_id, email, name, role, loyalty_stamps)
  VALUES (gen_random_uuid(), v_sub, COALESCE(v_email, ''), v_name, 'customer', 0)
  ON CONFLICT (clerk_user_id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, public.kk_profiles.name),
    email = COALESCE(NULLIF(EXCLUDED.email, ''), public.kk_profiles.email)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- Legacy policies call auth.uid() which throws for Clerk JWT subs.
DROP POLICY IF EXISTS kk_profiles_select_own ON public.kk_profiles;
DROP POLICY IF EXISTS kk_profiles_select_staff ON public.kk_profiles;
DROP POLICY IF EXISTS kk_profiles_update_own ON public.kk_profiles;
DROP POLICY IF EXISTS kk_profiles_admin_all ON public.kk_profiles;
DROP POLICY IF EXISTS kk_profiles_insert_self_or_admin ON public.kk_profiles;
DROP POLICY IF EXISTS kk_profiles_update_self_or_admin ON public.kk_profiles;
DROP POLICY IF EXISTS kk_profiles_select_self_or_internal ON public.kk_profiles;

CREATE POLICY kk_profiles_select_self_or_internal
  ON public.kk_profiles FOR SELECT TO authenticated
  USING (
    clerk_user_id = public.kk_requesting_user_sub()
    OR id = public.requesting_profile_id()
    OR public.kk_current_role() = 'admin'
    OR (
      public.kk_current_role() IN ('barista', 'staff')
      AND branch_id = public.kk_current_branch()
    )
  );

CREATE POLICY kk_profiles_update_self_or_admin
  ON public.kk_profiles FOR UPDATE TO authenticated
  USING (id = public.requesting_profile_id() OR public.kk_current_role() = 'admin')
  WITH CHECK (
    (
      id = public.requesting_profile_id()
      AND role = (SELECT p.role FROM public.kk_profiles p WHERE p.id = public.requesting_profile_id())
    )
    OR public.kk_current_role() = 'admin'
  );

CREATE POLICY kk_profiles_insert_self_or_admin
  ON public.kk_profiles FOR INSERT TO authenticated
  WITH CHECK (
    (clerk_user_id = public.kk_requesting_user_sub() AND role = 'customer')
    OR public.kk_current_role() = 'admin'
  );

GRANT EXECUTE ON FUNCTION public.kk_try_uuid_from_text(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.kk_ensure_my_profile(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
