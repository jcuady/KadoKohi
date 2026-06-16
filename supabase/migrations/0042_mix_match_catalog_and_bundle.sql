-- Kukidō Mix & Match: pastries catalog, drink tags, and server-validated bundle pricing (10% off).

CREATE OR REPLACE FUNCTION public.kk_product_has_tag(p_product public.kk_products, p_tag text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(coalesce(p_product.tags, '[]'::jsonb)) AS t(tag)
    WHERE lower(trim(t.tag)) = lower(trim(p_tag))
  );
$$;

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
    AND NOT (
      public.kk_product_has_tag(p_product, 'collab')
      OR public.kk_product_has_tag(p_product, 'kukilatte')
    );
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
    ('cookie_klassic', 'cat_pastries', null, 'Klassic Kuki', 'Kukidō handcrafted cookie — Mix & Match with any tagged Kado Kohi drink.', 98, '/mix-match/kukido2.jpg', 'both', '[]'::jsonb, '[]'::jsonb, '["mix-match","cookie"]'::jsonb, '[]'::jsonb, true, 10, true),
    ('cookie_campfire', 'cat_pastries', null, 'Campfire', 'Kukidō handcrafted cookie — Mix & Match with any tagged Kado Kohi drink.', 108, '/mix-match/kukido2.jpg', 'both', '[]'::jsonb, '[]'::jsonb, '["mix-match","cookie"]'::jsonb, '[]'::jsonb, true, 11, true),
    ('cookie_double_dark', 'cat_pastries', null, 'Double Dark', 'Kukidō handcrafted cookie — Mix & Match with any tagged Kado Kohi drink.', 118, '/mix-match/kukido2.jpg', 'both', '[]'::jsonb, '[]'::jsonb, '["mix-match","cookie"]'::jsonb, '[]'::jsonb, true, 12, true),
    ('cookie_birthday', 'cat_pastries', null, 'Birthday Bake', 'Kukidō handcrafted cookie — Mix & Match with any tagged Kado Kohi drink.', 118, '/mix-match/kukido2.jpg', 'both', '[]'::jsonb, '[]'::jsonb, '["mix-match","cookie"]'::jsonb, '[]'::jsonb, true, 13, true),
    ('cookie_blondie', 'cat_pastries', null, 'Blondie', 'Kukidō handcrafted cookie — Mix & Match with any tagged Kado Kohi drink.', 105, '/mix-match/kukido2.jpg', 'both', '[]'::jsonb, '[]'::jsonb, '["mix-match","cookie"]'::jsonb, '[]'::jsonb, true, 14, true),
    ('cookie_white_walnut', 'cat_pastries', null, 'White Chocolate Walnut', 'Kukidō handcrafted cookie — Mix & Match with any tagged Kado Kohi drink.', 115, '/mix-match/kukido2.jpg', 'both', '[]'::jsonb, '[]'::jsonb, '["mix-match","cookie"]'::jsonb, '[]'::jsonb, true, 15, true),
    ('pastry_kukilatte', 'cat_pastries', null, 'Kado Kukilatte', 'Kukidō x Kado Kohi takeover exclusive — iced Kado Latte with muscovado brûlée and cookie crumble.', 220, '/mix-match/kukido1.jpg', 'iced', '[]'::jsonb, '[]'::jsonb, '["collab","takeover","exclusive","kukilatte","featured"]'::jsonb, '[]'::jsonb, true, 0, true)
  ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    base_price = EXCLUDED.base_price,
    image = EXCLUDED.image,
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

REVOKE ALL ON FUNCTION public.kk_ensure_mix_match_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_ensure_mix_match_catalog() TO anon, authenticated;

SELECT public.kk_ensure_mix_match_catalog();
