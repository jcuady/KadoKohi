-- Shared CMS: store the published landing-page content as a JSON blob on the singleton settings row.
-- Layout is fixed; only text/images inside each slot are editable (no add/remove of sections).

ALTER TABLE public.kk_app_settings
  ADD COLUMN IF NOT EXISTS landing_content jsonb;
