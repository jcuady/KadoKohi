-- Oat-named drinks include oat milk in the base price; no milk modifier picker.
-- Sodas already have empty milks from 0021; this aligns live rows with the printed menu.

UPDATE public.kk_products
SET milks = '[]'::jsonb,
    updated_at = now()
WHERE lower(name) LIKE '%oat%'
  AND coalesce(custom_fields->>'source', '') <> 'merch'
  AND milks IS DISTINCT FROM '[]'::jsonb;
