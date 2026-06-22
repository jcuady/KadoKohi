-- Fix 42P10: ON CONFLICT (clerk_user_id) requires a non-partial UNIQUE constraint.
-- Partial index from 0059 cannot be inferred by INSERT ... ON CONFLICT.

-- Remove duplicate clerk_user_id rows if any (keep earliest row per clerk_user_id).
DELETE FROM public.kk_profiles p
USING (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY clerk_user_id
        ORDER BY created_at NULLS LAST, id
      ) AS rn
    FROM public.kk_profiles
    WHERE clerk_user_id IS NOT NULL AND btrim(clerk_user_id) <> ''
  ) ranked
  WHERE rn > 1
) dup
WHERE p.id = dup.id;

DROP INDEX IF EXISTS public.kk_profiles_clerk_user_id_key;

ALTER TABLE public.kk_profiles
  DROP CONSTRAINT IF EXISTS kk_profiles_clerk_user_id_unique;

ALTER TABLE public.kk_profiles
  ADD CONSTRAINT kk_profiles_clerk_user_id_unique UNIQUE (clerk_user_id);

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

  BEGIN
    INSERT INTO public.kk_profiles (id, clerk_user_id, email, name, role, loyalty_stamps)
    VALUES (gen_random_uuid(), v_sub, COALESCE(v_email, ''), v_name, 'customer', 0)
    RETURNING * INTO v_row;
  EXCEPTION
    WHEN unique_violation THEN
      SELECT * INTO v_row
      FROM public.kk_profiles
      WHERE clerk_user_id = v_sub
      LIMIT 1;

      IF NOT FOUND THEN
        RAISE;
      END IF;

      UPDATE public.kk_profiles
      SET
        name = COALESCE(NULLIF(trim(p_name), ''), name),
        email = CASE WHEN v_email <> '' THEN v_email ELSE email END
      WHERE id = v_row.id
      RETURNING * INTO v_row;
  END;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.kk_ensure_my_profile(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
