-- Hide accidental duplicate "Pastries" category (empty; products live on cat_pastries).
-- Prevents double Pastries pills on QR dine-in / takeout menus.

update public.kk_menu_categories
set visible = false,
    updated_at = now()
where id = 'c4dd4a9c-c9f2-4154-9e31-d16a231e4a47'
  and name = 'Pastries'
  and id <> 'cat_pastries';
