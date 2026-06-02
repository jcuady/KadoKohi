-- Customer mobile (E.164 +639XXXXXXXXX) for SMS automation later.

ALTER TABLE public.kk_profiles
  ADD COLUMN IF NOT EXISTS phone text;

COMMENT ON COLUMN public.kk_profiles.phone IS 'Philippine mobile in E.164 (+639XXXXXXXXX); used for SMS notifications.';

CREATE OR REPLACE FUNCTION public.kk_handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_branch_id text;
  v_phone text;
BEGIN
  v_role := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'role'), ''), 'customer');
  IF v_role NOT IN ('admin', 'barista', 'staff', 'customer') THEN
    v_role := 'customer';
  END IF;

  v_branch_id := NULLIF(trim(NEW.raw_user_meta_data->>'branch_id'), '');
  v_phone := NULLIF(trim(NEW.raw_user_meta_data->>'phone'), '');
  IF v_phone IS NOT NULL AND v_phone !~ '^\+639\d{9}$' THEN
    v_phone := NULL;
  END IF;

  INSERT INTO public.kk_profiles (id, email, name, role, branch_id, phone, loyalty_stamps)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''), split_part(COALESCE(NEW.email, 'user'), '@', 1)),
    v_role,
    CASE WHEN v_role IN ('admin', 'customer') THEN NULL ELSE v_branch_id END,
    CASE WHEN v_role = 'customer' THEN v_phone ELSE NULL END,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(NULLIF(EXCLUDED.name, ''), public.kk_profiles.name),
    role = EXCLUDED.role,
    branch_id = CASE
      WHEN EXCLUDED.role IN ('admin', 'customer') THEN NULL
      ELSE COALESCE(EXCLUDED.branch_id, public.kk_profiles.branch_id)
    END,
    phone = CASE
      WHEN EXCLUDED.role = 'customer' THEN COALESCE(EXCLUDED.phone, public.kk_profiles.phone)
      ELSE NULL
    END;

  RETURN NEW;
END;
$$;
