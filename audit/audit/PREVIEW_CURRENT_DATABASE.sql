-- Read-only category totals for the actual live D1 catalogue.
SELECT category, COUNT(*) AS products
FROM catalogue_products WHERE active=1
GROUP BY category ORDER BY products DESC, category;

-- Broad categories most likely to contain mixed product families.
SELECT code, name, category, updated_by
FROM catalogue_products
WHERE active=1 AND (category IN (
  'Fittings','Plumbing','Roofing','Fasteners & Ironmongery',
  'General Hardware','Homeware','General'
) OR (lower(name) LIKE '%blind%' AND lower(name) NOT LIKE '%blind rivet%'))
ORDER BY category, name;

-- Image gap count for quality assurance; this query makes no changes.
SELECT category, COUNT(*) AS missing_images
FROM catalogue_products
WHERE active=1 AND (image_key IS NULL OR trim(image_key)='')
GROUP BY category ORDER BY missing_images DESC;
