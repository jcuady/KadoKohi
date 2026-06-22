-- Deploy Clerk-aware kk_ensure_my_profile (0059 body may never have been applied to production).

CREATE OR REPLACE FUNCTION public.kk_ensure_my_profile(p_name text DEFAULT NULL)
RETURNS public.kk_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub text := public.kk_requesting_user_sub();
  v_profile_id uuid := public.requesting_profile_id();
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

  IF v_profile_id IS NOT NULL THEN
    UPDATE public.kk_profiles
    SET
      clerk_user_id = COALESCE(clerk_user_id, v_sub),
      name = COALESCE(NULLIF(trim(p_name), ''), name),
      email = CASE WHEN v_email <> '' THEN v_email ELSE email END
    WHERE id = v_profile_id
    RETURNING * INTO v_row;
    RETURN v_row;
  END IF;

  -- Link legacy row by email when migration/webhook has not run yet.
  IF v_email <> '' THEN
    SELECT * INTO v_row
    FROM public.kk_profiles
    WHERE lower(email) = lower(v_email)
    LIMIT 1;

    IF FOUND THEN
      UPDATE public.kk_profiles
      SET
        clerk_user_id = COALESCE(clerk_user_id, v_sub),
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

GRANT EXECUTE ON FUNCTION public.kk_ensure_my_profile(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
