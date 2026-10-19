-- PowerBuild catalogue: Bathroom & Sanware department/category cleanup.
-- Reclassifies existing obvious bathroom products so the new bathroom browse area has live stock immediately.

UPDATE catalogue_products
SET category='Bathroom · Showers', updated_by='system:bathroom-category-v1', updated_at=datetime('now')
WHERE active=1 AND (
  upper(name) LIKE '%SHOWER%' OR upper(description) LIKE '%SHOWER%'
) AND upper(name) NOT LIKE '%SHOWERPROOF%';

UPDATE catalogue_products
SET category='Bathroom · Basins', updated_by='system:bathroom-category-v1', updated_at=datetime('now')
WHERE active=1 AND (
  upper(name) LIKE '%BASIN%' OR upper(description) LIKE '%BASIN%'
) AND upper(name) NOT LIKE '%BASIN WRENCH%';

UPDATE catalogue_products
SET category='Bathroom · Toilets', updated_by='system:bathroom-category-v1', updated_at=datetime('now')
WHERE active=1 AND (
  upper(name) LIKE '%TOILET%' OR upper(name) LIKE '%CISTERN%' OR upper(name) LIKE '%URINAL%'
  OR upper(description) LIKE '%TOILET%' OR upper(description) LIKE '%CISTERN%' OR upper(description) LIKE '%URINAL%'
);

UPDATE catalogue_products
SET category='Bathroom · Baths', updated_by='system:bathroom-category-v1', updated_at=datetime('now')
WHERE active=1 AND (
  upper(name) LIKE '%BATH %' OR upper(name) LIKE '%BATHS %' OR upper(name) LIKE '%BATH PLUG%'
  OR upper(description) LIKE '%BATH PLUG%' OR upper(description) LIKE '%BATH SCREEN%'
);

UPDATE catalogue_products
SET category='Bathroom · Furniture', updated_by='system:bathroom-category-v1', updated_at=datetime('now')
WHERE active=1 AND (
  upper(name) LIKE '%BATHROOM MIRROR%' OR upper(name) LIKE '%MIRROR CABINET%' OR upper(name) LIKE '%LED MIRROR%'
  OR upper(description) LIKE '%BATHROOM MIRROR%' OR upper(description) LIKE '%MIRROR CABINET%'
);

UPDATE catalogue_products
SET category='Bathroom · Taps', updated_by='system:bathroom-category-v1', updated_at=datetime('now')
WHERE active=1 AND (
  upper(name) LIKE '%BASIN TAP%' OR upper(name) LIKE '%BATH TAP%' OR upper(name) LIKE '%SHOWER TAP%'
  OR upper(name) LIKE '%BATHROOM SPOUT%' OR upper(name) LIKE '%BASIN MIXER%' OR upper(name) LIKE '%BATH MIXER%'
  OR upper(description) LIKE '%BASIN TAP%' OR upper(description) LIKE '%BATH TAP%' OR upper(description) LIKE '%SHOWER TAP%'
);

UPDATE catalogue_products
SET category='Bathroom · Tiles', updated_by='system:bathroom-category-v1', updated_at=datetime('now')
WHERE active=1 AND (
  upper(name) LIKE '%BATHROOM TILE%' OR upper(description) LIKE '%BATHROOM TILE%'
);
