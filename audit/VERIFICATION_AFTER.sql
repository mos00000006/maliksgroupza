-- Verify that the known imported codes have been recategorised.
SELECT category, COUNT(*) products FROM catalogue_products
WHERE active=1 GROUP BY category ORDER BY category;
-- The old mixed Fittings category must have zero active records after all
-- legacy items are reviewed; unknown user-created records may still need review.
SELECT code, name, category, updated_by FROM catalogue_products
WHERE active=1 AND lower(trim(category))='fittings';
-- Check blinds have not been mixed into Homeware or Plumbing:
SELECT code, name, category FROM catalogue_products
WHERE active=1 AND lower(name) LIKE '%blind%'
  AND lower(name) NOT LIKE '%blind rivet%'
  AND lower(name) NOT LIKE '%blind flange%'
  AND lower(name) NOT LIKE '%blind cap%'
  AND lower(name) NOT LIKE '%blind plug%'
  AND lower(name) NOT LIKE '%blind nut%'
  AND category != 'Window Blinds & Treatments';
