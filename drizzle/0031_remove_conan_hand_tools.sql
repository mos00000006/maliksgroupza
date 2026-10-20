-- Remove only the Conan hand-tools import; preserve accessories and other products.
UPDATE ecommerce_product_settings
SET b2c_enabled=0,b2b_enabled=0,updated_by='system:remove-conan-hand-tools-v1',updated_at=datetime('now')
WHERE catalogue_product_id IN (SELECT id FROM catalogue_products WHERE created_by='system:conan-hand-tools-static-v1');

UPDATE catalogue_products
SET active=0,updated_by='system:remove-conan-hand-tools-v1',updated_at=datetime('now')
WHERE created_by='system:conan-hand-tools-static-v1' AND active=1;
