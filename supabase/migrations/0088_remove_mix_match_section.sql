-- Remove retired Mix & Match homepage section and hide legacy collab products.

UPDATE public.kk_app_settings
SET landing_content = landing_content - 'schedule'
WHERE landing_content ? 'schedule';

UPDATE public.kk_products
SET visible = false,
    updated_at = now()
WHERE id IN ('pastry_kukilatte', 'c8f3a1b2-6d4e-4f9a-b7c2-8e1d0f9a3b4c');

UPDATE public.kk_app_settings
SET pastries_content = pastries_content
  || jsonb_build_object(
    'poster',
    coalesce(pastries_content->'poster', '{}'::jsonb)
    || jsonb_build_object(
      'primaryImage', '/featuredmarikina/kadom1.jpg',
      'secondaryImage', '/social/cafe-latte.png'
    )
  )
WHERE pastries_content IS NOT NULL;
