-- Public buckets: drop blanket SELECT (stops bucket listing). Object URLs still work via bucket public flag.

DROP POLICY IF EXISTS "menu_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "gcash_qr_public_read" ON storage.objects;
DROP POLICY IF EXISTS "blog_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "cms_images_public_read" ON storage.objects;
