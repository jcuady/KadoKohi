-- Greenhills: official Maps share link + branch phone for public pages.

ALTER TABLE public.kk_branches
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS maps_url text;

UPDATE public.kk_branches
SET
  phone = '09605779641',
  maps_url = 'https://maps.app.goo.gl/uxnZNSRxFmSg84Kz7',
  updated_at = now()
WHERE id = 'branch_greenhills';
