-- Debias visible landing + matcha booking copy (factual, review-backed wording).

UPDATE public.kk_app_settings
SET landing_content = jsonb_set(
  jsonb_set(
    jsonb_set(
      landing_content,
      '{heroChrome,mainHeadline}',
      '"Kado Coffee — Matcha & Specialty Coffee in Marikina"'::jsonb
    ),
    '{storySeo,intro}',
    '"Kado Coffee (Kado Kohi) is a 4.9-star specialty cafe in Sta. Elena, Marikina. Our Coffee, Our Rules — honest craft for guests who want quality, not hype."'::jsonb
  ),
  '{menuSeo,headline,middle}',
  '" corner — matcha & hojicha, crafted "'::jsonb
)
WHERE landing_content IS NOT NULL;

UPDATE public.kk_app_settings
SET landing_content = jsonb_set(
  landing_content,
  '{menuSeo,bodyParagraphs,0}',
  '"Japanese-inspired specialty cafe on J.P. Laurel, Sta. Elena — matcha, hojicha oat lattes, and signature drinks in a neighborhood tambayan rated 4.9 stars on Google."'::jsonb
)
WHERE landing_content IS NOT NULL
  AND jsonb_array_length(coalesce(landing_content->'menuSeo'->'bodyParagraphs', '[]'::jsonb)) > 0;

UPDATE public.kk_app_settings
SET matcha_content = jsonb_set(
  matcha_content,
  '{copy,heroTitleLine1}',
  '"Premium Matcha,"'::jsonb
)
WHERE matcha_content IS NOT NULL;

-- Normalize showcase / gallery titles if legacy ceremonial wording remains.
UPDATE public.kk_app_settings
SET matcha_content = jsonb_set(
  matcha_content,
  '{media}',
  (
    SELECT coalesce(jsonb_agg(
      CASE
        WHEN elem->>'title' = 'Ceremonial Matcha Bar' THEN jsonb_set(elem, '{title}', '"Matcha Bar Setup"'::jsonb)
        ELSE elem
      END
    ), '[]'::jsonb)
    FROM jsonb_array_elements(coalesce(matcha_content->'media', '[]'::jsonb)) AS elem
  )
)
WHERE matcha_content IS NOT NULL
  AND matcha_content->'media' IS NOT NULL;
