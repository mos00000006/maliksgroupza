-- Run against live D1 BEFORE applying to inspect the affected product rows.
SELECT code, name, category, updated_by
FROM catalogue_products
WHERE active=1 AND category COLLATE NOCASE <> 'Underground (UG)' AND (
  UPPER(TRIM(category)) IN ('UG','UNDERGROUND','UNDERGROUND (UG)')
  OR (' ' || UPPER(TRIM(REPLACE(REPLACE(REPLACE(name, '-', ' '), '/', ' '), '(', ' '))) || ' ') LIKE '% UG %'
  OR (' ' || UPPER(TRIM(REPLACE(REPLACE(name, '-', ' '), '/', ' '))) || ' ') LIKE '% UNDERGROUND %'
)
ORDER BY name;
