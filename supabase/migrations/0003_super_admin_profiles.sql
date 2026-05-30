-- Admins are super-admins: no branch assignment, access all branches in the app.
UPDATE public.kk_profiles
SET branch_id = NULL
WHERE role = 'admin' AND branch_id IS NOT NULL;
