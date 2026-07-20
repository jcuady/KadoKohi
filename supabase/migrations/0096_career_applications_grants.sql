-- Careers: tighten kk_career_applications privileges.
-- Guest/authenticated clients must use kk_submit_career_application (SECURITY DEFINER).
-- Admins read via RLS policy kk_career_applications_admin_select.

REVOKE ALL ON TABLE public.kk_career_applications FROM PUBLIC;
REVOKE ALL ON TABLE public.kk_career_applications FROM anon;
REVOKE ALL ON TABLE public.kk_career_applications FROM authenticated;

GRANT SELECT ON TABLE public.kk_career_applications TO authenticated;

-- Keep service_role full access for backups / admin reset RPCs.
GRANT ALL ON TABLE public.kk_career_applications TO service_role;

-- Ensure submit RPC stays callable by guests + signed-in customers.
GRANT EXECUTE ON FUNCTION public.kk_submit_career_application(jsonb) TO anon, authenticated;
