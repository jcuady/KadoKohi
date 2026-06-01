-- Auto-create kk_profiles when a Supabase Auth user is created (public signup or admin provision).
CREATE OR REPLACE FUNCTION public.kk_handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_branch_id uuid;
BEGIN
  v_role := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'role'), ''), 'customer');
  IF v_role NOT IN ('admin', 'barista', 'staff', 'customer') THEN
    v_role := 'customer';
  END IF;

  BEGIN
    v_branch_id := (NEW.raw_user_meta_data->>'branch_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_branch_id := NULL;
  END;

  INSERT INTO public.kk_profiles (id, email, name, role, branch_id, loyalty_stamps)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''), split_part(COALESCE(NEW.email, 'user'), '@', 1)),
    v_role,
    CASE WHEN v_role = 'admin' THEN NULL ELSE v_branch_id END,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(NULLIF(EXCLUDED.name, ''), public.kk_profiles.name),
    role = EXCLUDED.role,
    branch_id = EXCLUDED.branch_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kk_on_auth_user_created ON auth.users;
CREATE TRIGGER kk_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.kk_handle_new_user();

-- Belt-and-suspenders: authenticated users can ensure their profile row exists (e.g. legacy accounts).
CREATE OR REPLACE FUNCTION public.kk_ensure_my_profile(p_name text DEFAULT NULL)
RETURNS public.kk_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_name text;
  v_meta_name text;
  v_row public.kk_profiles;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT
    u.email,
    COALESCE(
      NULLIF(trim(p_name), ''),
      NULLIF(trim(u.raw_user_meta_data->>'name'), ''),
      split_part(COALESCE(u.email, 'user'), '@', 1)
    )
  INTO v_email, v_name
  FROM auth.users u
  WHERE u.id = v_uid;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO public.kk_profiles (id, email, name, role, loyalty_stamps)
  VALUES (v_uid, v_email, v_name, 'customer', 0)
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, public.kk_profiles.name),
    email = COALESCE(EXCLUDED.email, public.kk_profiles.email)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.kk_ensure_my_profile(text) TO authenticated;
