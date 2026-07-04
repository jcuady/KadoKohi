-- Strip emoji icons from ordering carousel steps in CMS JSON (typography-only UI).

UPDATE public.kk_app_settings
SET landing_content = jsonb_set(
  landing_content,
  '{ordering,steps}',
  (
    SELECT coalesce(jsonb_agg(
      jsonb_set(elem, '{icon}', '""'::jsonb)
    ), '[]'::jsonb)
    FROM jsonb_array_elements(coalesce(landing_content->'ordering'->'steps', '[]'::jsonb)) AS elem
  )
)
WHERE landing_content IS NOT NULL
  AND landing_content->'ordering'->'steps' IS NOT NULL;
