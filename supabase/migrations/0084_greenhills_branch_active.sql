-- Reconcile Greenhills to active (matches 0050_greenhills_branch.sql seed intent).

UPDATE public.kk_branches
SET
  status = 'active',
  updated_at = now()
WHERE id = 'branch_greenhills';
