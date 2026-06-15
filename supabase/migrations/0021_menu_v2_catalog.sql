-- KADO MENU V2 — coffee categories & products (no images).
-- Milk: regular +0, oat +40. No milk on AmeriKADO, Yuzu AmeriKADO, Yuzu sodas.
-- Temperature: iced-only on signature/matcha/yuzu items per printed menu.

INSERT INTO public.kk_menu_categories (id, branch_id, name, sort_order, visible)
VALUES
  ('cat_classics', null, 'Espresso Based Classics', 0, true),
  ('cat_signatures', null, 'Espresso Based Signatures', 1, true),
  ('cat_matcha', null, 'Matcha & Hojicha', 2, true),
  ('cat_yuzu', null, 'Yuzu Soda', 3, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  visible = EXCLUDED.visible,
  branch_id = EXCLUDED.branch_id,
  updated_at = now();

-- Remove legacy coffee rows (keep merch mirror rows in cat_hidden_merch).
DELETE FROM public.kk_products
WHERE coalesce(custom_fields->>'source', '') <> 'merch'
  AND category_id IN ('cat_classics', 'cat_signatures', 'cat_matcha', 'cat_yuzu');

INSERT INTO public.kk_products (
  id, category_id, branch_id, name, description, base_price, image,
  temperature, sizes, milks, tags, custom_fields, visible, sort_order
) VALUES
  ('prod_amerikado', 'cat_classics', null, 'AmeriKADO', null, 130, null, 'both', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, true, 0),
  ('prod_cafe_latte', 'cat_classics', null, 'Cafe Latte', null, 160, null, 'both', '[]'::jsonb,
    '[{"id":"milk_regular","label":"Milk","priceDelta":0},{"id":"milk_oat","label":"Oat","priceDelta":40}]'::jsonb, '[]'::jsonb, '[]'::jsonb, true, 1),
  ('prod_cappuccino', 'cat_classics', null, 'Cappucinno', null, 160, null, 'both', '[]'::jsonb,
    '[{"id":"milk_regular","label":"Milk","priceDelta":0},{"id":"milk_oat","label":"Oat","priceDelta":40}]'::jsonb, '[]'::jsonb, '[]'::jsonb, true, 2),
  ('prod_flat_white', 'cat_classics', null, 'Flat White', null, 150, null, 'both', '[]'::jsonb,
    '[{"id":"milk_regular","label":"Milk","priceDelta":0},{"id":"milk_oat","label":"Oat","priceDelta":40}]'::jsonb, '[]'::jsonb, '[]'::jsonb, true, 3),
  ('prod_moka_latte', 'cat_classics', null, 'Moka Latte', null, 170, null, 'both', '[]'::jsonb,
    '[{"id":"milk_regular","label":"Milk","priceDelta":0},{"id":"milk_oat","label":"Oat","priceDelta":40}]'::jsonb, '[]'::jsonb, '[]'::jsonb, true, 4),
  ('prod_karamel_latte', 'cat_classics', null, 'Karamel Latte', null, 170, null, 'both', '[]'::jsonb,
    '[{"id":"milk_regular","label":"Milk","priceDelta":0},{"id":"milk_oat","label":"Oat","priceDelta":40}]'::jsonb, '[]'::jsonb, '[]'::jsonb, true, 5),
  ('prod_spanish_latte', 'cat_classics', null, 'Spanish Latte', null, 170, null, 'both', '[]'::jsonb,
    '[{"id":"milk_regular","label":"Milk","priceDelta":0},{"id":"milk_oat","label":"Oat","priceDelta":40}]'::jsonb, '[]'::jsonb, '[]'::jsonb, true, 6),

  ('prod_kado_latte', 'cat_signatures', null, 'KADO Latte', null, 195, null, 'iced', '[]'::jsonb,
    '[{"id":"milk_regular","label":"Milk","priceDelta":0},{"id":"milk_oat","label":"Oat","priceDelta":40}]'::jsonb, '["iced-only"]'::jsonb, '[]'::jsonb, true, 0),
  ('prod_ube_shio', 'cat_signatures', null, 'Ube Shio Karamel Latte', null, 195, null, 'both', '[]'::jsonb,
    '[{"id":"milk_regular","label":"Milk","priceDelta":0},{"id":"milk_oat","label":"Oat","priceDelta":40}]'::jsonb, '[]'::jsonb, '[]'::jsonb, true, 1),
  ('prod_yuzu_amerikado', 'cat_signatures', null, 'Yuzu AmeriKado', null, 195, null, 'iced', '[]'::jsonb,
    '[]'::jsonb, '["iced-only"]'::jsonb, '[]'::jsonb, true, 2),
  ('prod_nori_salted', 'cat_signatures', null, 'Nori Salted Cream Latte', null, 195, null, 'iced', '[]'::jsonb,
    '[{"id":"milk_regular","label":"Milk","priceDelta":0},{"id":"milk_oat","label":"Oat","priceDelta":40}]'::jsonb, '["iced-only"]'::jsonb, '[]'::jsonb, true, 3),

  ('prod_matcha_oat', 'cat_matcha', null, 'Matcha Oat Latte', null, 170, null, 'both', '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, true, 0),
  ('prod_dirty_matcha', 'cat_matcha', null, 'Dirty Matcha Oat Latte', null, 200, null, 'both', '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, true, 1),
  ('prod_matcha_straw', 'cat_matcha', null, 'Matcha Strawberry Oat Latte', null, 180, null, 'iced', '[]'::jsonb,
    '[]'::jsonb, '["iced-only"]'::jsonb, '[]'::jsonb, true, 2),
  ('prod_hojicha_oat', 'cat_matcha', null, 'Hojicha Oat Latte', null, 200, null, 'both', '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, true, 3),
  ('prod_salted_hojicha', 'cat_matcha', null, 'Salted Cream Hojicha Oat Latte', null, 210, null, 'iced', '[]'::jsonb,
    '[]'::jsonb, '["iced-only"]'::jsonb, '[]'::jsonb, true, 4),

  ('prod_yuzu_lime', 'cat_yuzu', null, 'Yuzu Lime Soda', null, 140, null, 'iced', '[]'::jsonb,
    '[]'::jsonb, '["iced-only"]'::jsonb, '[]'::jsonb, true, 0),
  ('prod_yuzu_straw', 'cat_yuzu', null, 'Yuzu Strawberry Soda', null, 140, null, 'iced', '[]'::jsonb,
    '[]'::jsonb, '["iced-only"]'::jsonb, '[]'::jsonb, true, 1)
ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  image = EXCLUDED.image,
  temperature = EXCLUDED.temperature,
  sizes = EXCLUDED.sizes,
  milks = EXCLUDED.milks,
  tags = EXCLUDED.tags,
  custom_fields = EXCLUDED.custom_fields,
  visible = EXCLUDED.visible,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
