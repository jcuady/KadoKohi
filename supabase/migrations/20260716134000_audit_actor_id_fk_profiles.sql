-- place_order passes requesting_profile_id() as actor_id; must FK to kk_profiles.

ALTER TABLE public.kk_audit_logs
  DROP CONSTRAINT IF EXISTS kk_audit_logs_actor_id_fkey;

UPDATE public.kk_audit_logs a
SET actor_id = p.id
FROM public.kk_profiles p
WHERE a.actor_id IS NOT NULL
  AND p.clerk_user_id = a.actor_id::text
  AND NOT EXISTS (SELECT 1 FROM public.kk_profiles p2 WHERE p2.id = a.actor_id);

UPDATE public.kk_audit_logs a
SET actor_id = NULL
WHERE a.actor_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.kk_profiles p WHERE p.id = a.actor_id);

ALTER TABLE public.kk_audit_logs
  ADD CONSTRAINT kk_audit_logs_actor_id_fkey
    FOREIGN KEY (actor_id) REFERENCES public.kk_profiles(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
