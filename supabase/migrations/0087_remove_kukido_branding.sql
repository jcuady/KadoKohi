-- Remove Kukidō / Kukilatte branding from live catalog and CMS content.

CREATE OR REPLACE FUNCTION public.kk_is_mix_match_cookie(p_product public.kk_products)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    p_product.category_id = 'cat_pastries'
    AND (
      public.kk_product_has_tag(p_product, 'mix-match')
      OR public.kk_product_has_tag(p_product, 'cookie')
    )
    AND NOT public.kk_product_has_tag(p_product, 'collab');
$$;

CREATE OR REPLACE FUNCTION public.kk_ensure_mix_match_catalog()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cookies int;
  v_tagged int;
BEGIN
  INSERT INTO public.kk_menu_categories (id, branch_id, name, sort_order, visible)
  VALUES ('cat_pastries', null, 'Pastries', 4, true)
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order, visible = EXCLUDED.visible, updated_at = now();

  INSERT INTO public.kk_products (
    id, category_id, branch_id, name, description, base_price, image,
    temperature, sizes, milks, tags, custom_fields, visible, sort_order, in_stock
  ) VALUES
    ('cookie_klassic', 'cat_pastries', null, 'Klassic Cookie', 'Handcrafted cookie — Mix & Match with any tagged Kado Kohi drink.', 98, '/mix-match/cookies-plate.jpg', 'both', '[]'::jsonb, '[]'::jsonb, '["mix-match","cookie"]'::jsonb, '[]'::jsonb, true, 10, true),
    ('cookie_campfire', 'cat_pastries', null, 'Campfire', 'Handcrafted cookie — Mix & Match with any tagged Kado Kohi drink.', 108, '/mix-match/cookies-plate.jpg', 'both', '[]'::jsonb, '[]'::jsonb, '["mix-match","cookie"]'::jsonb, '[]'::jsonb, true, 11, true),
    ('cookie_double_dark', 'cat_pastries', null, 'Double Dark', 'Handcrafted cookie — Mix & Match with any tagged Kado Kohi drink.', 118, '/mix-match/cookies-plate.jpg', 'both', '[]'::jsonb, '[]'::jsonb, '["mix-match","cookie"]'::jsonb, '[]'::jsonb, true, 12, true),
    ('cookie_birthday', 'cat_pastries', null, 'Birthday Bake', 'Handcrafted cookie — Mix & Match with any tagged Kado Kohi drink.', 118, '/mix-match/cookies-plate.jpg', 'both', '[]'::jsonb, '[]'::jsonb, '["mix-match","cookie"]'::jsonb, '[]'::jsonb, true, 13, true),
    ('cookie_blondie', 'cat_pastries', null, 'Blondie', 'Handcrafted cookie — Mix & Match with any tagged Kado Kohi drink.', 105, '/mix-match/cookies-plate.jpg', 'both', '[]'::jsonb, '[]'::jsonb, '["mix-match","cookie"]'::jsonb, '[]'::jsonb, true, 14, true),
    ('cookie_white_walnut', 'cat_pastries', null, 'White Chocolate Walnut', 'Handcrafted cookie — Mix & Match with any tagged Kado Kohi drink.', 115, '/mix-match/cookies-plate.jpg', 'both', '[]'::jsonb, '[]'::jsonb, '["mix-match","cookie"]'::jsonb, '[]'::jsonb, true, 15, true),
    ('pastry_kukilatte', 'cat_pastries', null, 'Cookie Latte', 'Iced Kado Latte with muscovado brûlée and cookie crumble.', 220, '/mix-match/pastries-poster.jpg', 'iced', '[]'::jsonb, '[]'::jsonb, '["featured","featured-drink"]'::jsonb, '[]'::jsonb, true, 0, true)
  ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    base_price = EXCLUDED.base_price,
    tags = EXCLUDED.tags,
    visible = EXCLUDED.visible,
    sort_order = EXCLUDED.sort_order,
    in_stock = EXCLUDED.in_stock,
    updated_at = now();

  UPDATE public.kk_products p
  SET tags = (
    SELECT coalesce(jsonb_agg(DISTINCT t), '[]'::jsonb)
    FROM (
      SELECT jsonb_array_elements_text(coalesce(p.tags, '[]'::jsonb)) AS t
      UNION ALL
      SELECT 'mix-match'
    ) s
  ),
  updated_at = now()
  WHERE p.id IN (
    'prod_kado_latte', 'prod_ube_shio', 'prod_nori_salted', 'prod_yuzu_amerikado',
    'prod_matcha_oat', 'prod_matcha_straw', 'prod_hojicha_oat'
  );

  SELECT count(*)::int INTO v_cookies
  FROM public.kk_products
  WHERE category_id = 'cat_pastries' AND public.kk_is_mix_match_cookie(kk_products.*);

  SELECT count(*)::int INTO v_tagged
  FROM public.kk_products
  WHERE public.kk_product_has_tag(kk_products.*, 'mix-match')
    AND category_id <> 'cat_pastries';

  RETURN jsonb_build_object('cookies', v_cookies, 'mix_match_drinks', v_tagged);
END;
$$;

-- Live catalog rows (preserve admin-uploaded images when present).
UPDATE public.kk_products
SET
  name = CASE
    WHEN id IN ('cookie_klassic', 'b1000001-0001-4000-8000-000000000001') THEN 'Klassic Cookie'
    WHEN id IN ('pastry_kukilatte', 'c8f3a1b2-6d4e-4f9a-b7c2-8e1d0f9a3b4c') THEN 'Cookie Latte'
    ELSE name
  END,
  description = trim(both ' ' FROM replace(replace(coalesce(description, ''), 'Kukidō handcrafted cookie — ', ''), 'Kukidō x Kado Kohi takeover exclusive — ', '')),
  image = CASE
    WHEN coalesce(image, '') LIKE '%kukido1%' OR coalesce(image, '') LIKE '%kukido2%' THEN
      CASE
        WHEN id IN ('pastry_kukilatte', 'c8f3a1b2-6d4e-4f9a-b7c2-8e1d0f9a3b4c') THEN '/mix-match/pastries-poster.jpg'
        ELSE '/mix-match/cookies-plate.jpg'
      END
    ELSE image
  END,
  tags = (
    SELECT coalesce(jsonb_agg(DISTINCT to_jsonb(elem)), '[]'::jsonb)
    FROM jsonb_array_elements_text(coalesce(tags, '[]'::jsonb)) AS elem
    WHERE lower(elem) NOT IN ('kukilatte', 'collab', 'takeover', 'exclusive')
  ),
  updated_at = now()
WHERE
  id LIKE 'cookie_%'
  OR id IN ('pastry_kukilatte', 'c8f3a1b2-6d4e-4f9a-b7c2-8e1d0f9a3b4c', 'b1000001-0001-4000-8000-000000000001')
  OR coalesce(name, '') ILIKE '%kuki%'
  OR coalesce(description, '') ILIKE '%kukid%'
  OR coalesce(image, '') ILIKE '%kukido%'
  OR coalesce(tags::text, '') ILIKE '%kukilatte%';

UPDATE public.kk_products
SET tags = '["featured","featured-drink"]'::jsonb,
    updated_at = now()
WHERE id IN ('pastry_kukilatte', 'c8f3a1b2-6d4e-4f9a-b7c2-8e1d0f9a3b4c');

UPDATE public.kk_app_settings
SET landing_content = (
  coalesce(landing_content, '{}'::jsonb)
  || jsonb_build_object(
    'schedule',
    coalesce(landing_content->'schedule', '{}'::jsonb)
    || jsonb_build_object(
      'badge', 'Mix & Match Bundle',
      'description', 'Pair any Kado Kohi drink with a fresh-baked cookie — build your bundle on the homepage or pastries page.',
      'posterImageUrl', '/mix-match/pastries-poster.jpg',
      'ctaLabel', 'View pastries',
      'featuredCtaLabel', 'Browse drinks',
      'featuredProductId', 'pastry_kukilatte'
    )
  )
)::jsonb
WHERE landing_content IS NOT NULL;

UPDATE public.kk_app_settings
SET landing_content = replace(
  replace(
    replace(
      replace(landing_content::text, 'Kukidō x Kado Kohi', 'Mix & Match Bundle'),
      'Kukidō handcrafted cookie', 'fresh-baked cookie'
    ),
    'Order Kado Kukilatte', 'Browse drinks'
  ),
  'View pastries & collabs', 'View pastries'
)::jsonb
WHERE landing_content::text ILIKE '%kukid%' OR landing_content::text ILIKE '%kukilatte%';

UPDATE public.kk_app_settings
SET pastries_content = replace(
  replace(pastries_content::text, '/mix-match/kukido1.jpg', '/mix-match/pastries-poster.jpg'),
  '/mix-match/kukido2.jpg', '/mix-match/cookies-plate.jpg'
)::jsonb
WHERE pastries_content IS NOT NULL
  AND pastries_content::text ILIKE '%kukido%';
