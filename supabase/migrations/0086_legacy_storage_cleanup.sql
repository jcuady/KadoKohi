-- Legacy buckets: drop permissive policies (objects unused; bucket delete via Storage API).

DROP POLICY IF EXISTS product_images_public_read ON storage.objects;
DROP POLICY IF EXISTS product_images_admin_write ON storage.objects;
DROP POLICY IF EXISTS product_images_admin_update ON storage.objects;
DROP POLICY IF EXISTS product_images_admin_delete ON storage.objects;
