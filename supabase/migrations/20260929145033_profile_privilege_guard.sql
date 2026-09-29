-- Block privilege escalation through direct kk_profiles UPDATEs.
-- profiles_staff_update lets any barista/staff update any profile row, and
-- authenticated holds UPDATE on role/branch_id — so a barista could make itself admin.
-- SECURITY DEFINER RPCs (kk_award_loyalty_stamps, kk_claim_loyalty_reward,
-- kk_ensure_my_profile, kk_admin_reset_data) and service-role edge functions
-- (kk-admin-users) run as a different current_user and are not affected.

CREATE OR REPLACE FUNCTION public.kk_profiles_guard_direct_updates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  v_role := public.kk_current_role();
  IF v_role = 'admin' THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.branch_id IS DISTINCT FROM OLD.branch_id
     OR NEW.clerk_user_id IS DISTINCT FROM OLD.clerk_user_id
     OR NEW.team_password_hash IS DISTINCT FROM OLD.team_password_hash
  THEN
    RAISE EXCEPTION 'Only admins can change role, branch, or account links';
  END IF;

  IF OLD.id IS DISTINCT FROM public.requesting_profile_id() THEN
    IF v_role IS NULL OR v_role NOT IN ('barista', 'staff') OR OLD.role IS DISTINCT FROM 'customer' THEN
      RAISE EXCEPTION 'Cannot modify another user''s profile';
    END IF;
    -- Staff may only adjust a customer's stamp balance; the client resends (possibly stale) identity fields.
    NEW.name := OLD.name;
    NEW.email := OLD.email;
    NEW.phone := OLD.phone;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kk_profiles_guard_direct_updates ON public.kk_profiles;
CREATE TRIGGER trg_kk_profiles_guard_direct_updates
  BEFORE UPDATE ON public.kk_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.kk_profiles_guard_direct_updates();

-- Stamp guard applied to kk_claim_loyalty_reward too (it reads the customer JWT),
-- so no customer could redeem a reward. Scope it to direct API writes only.
CREATE OR REPLACE FUNCTION public.kk_profiles_protect_loyalty_stamps()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon')
     AND public.kk_current_role() = 'customer'
     AND NEW.loyalty_stamps IS DISTINCT FROM OLD.loyalty_stamps THEN
    RAISE EXCEPTION 'Customers cannot modify loyalty stamps directly';
  END IF;
  RETURN NEW;
END;
$$;
