-- Hide only products created by the October 2026 Tork Craft catalogue import.
-- Retain IDs, price tags, pictures and history; leave pre-existing catalogue records untouched.
UPDATE catalogue_products
SET active=0,
    updated_by='system:remove-torkcraft-2026-10-29',
    updated_at=datetime('now')
WHERE created_by='system:torkcraft-catalogue-2026-10-27'
  AND active<>0;
