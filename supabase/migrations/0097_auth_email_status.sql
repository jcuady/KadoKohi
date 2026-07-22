-- Public auth helper: whether an email is registered in auth.users.
-- Intentional enumeration tradeoff for clearer forgot-password / login UX.
CREATE OR REPLACE FUNCTION public.kk_auth_email_status(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text := lower(trim(coalesce(p_email, '')));
  v_confirmed timestamptz;
BEGIN
  IF v_email = '' OR position('@' IN v_email) = 0 OR char_length(v_email) > 254 THEN
    RETURN 'invalid';
  END IF;

  SELECT u.email_confirmed_at
  INTO v_confirmed
  FROM auth.users u
  WHERE lower(u.email::text) = v_email
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 'missing';
  END IF;

  IF v_confirmed IS NULL THEN
    RETURN 'unconfirmed';
  END IF;

  RETURN 'ready';
END;
$$;

COMMENT ON FUNCTION public.kk_auth_email_status(text) IS
  'Returns invalid|missing|unconfirmed|ready for a login email. Used by forgot-password and sign-in UX.';

REVOKE ALL ON FUNCTION public.kk_auth_email_status(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_auth_email_status(text) TO anon, authenticated;
