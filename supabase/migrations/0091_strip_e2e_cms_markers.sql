-- Remove leftover E2E test markers from CMS hero badge (admin-cms round-trip).

UPDATE public.kk_app_settings
SET landing_content = jsonb_set(
  landing_content,
  '{heroChrome,locationBadge}',
  to_jsonb(
    trim(
      regexp_replace(
        coalesce(landing_content->'heroChrome'->>'locationBadge', ''),
        '\s+e2e(\s+e2e)*$',
        '',
        'i'
      )
    )
  )
)
WHERE landing_content IS NOT NULL
  AND coalesce(landing_content->'heroChrome'->>'locationBadge', '') ~* 'e2e';
