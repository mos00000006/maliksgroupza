-- EXPECT ZERO rows: clearly identified UG items outside UG.
SELECT code, name, category
FROM catalogue_products
WHERE active=1 AND category COLLATE NOCASE <> 'Underground (UG)' AND (
  UPPER(TRIM(category)) IN ('UG','UNDERGROUND','UNDERGROUND (UG)')
  OR (' ' || UPPER(TRIM(REPLACE(REPLACE(REPLACE(name, '-', ' '), '/', ' '), '(', ' '))) || ' ') LIKE '% UG %'
  OR (' ' || UPPER(TRIM(REPLACE(REPLACE(name, '-', ' '), '/', ' '))) || ' ') LIKE '% UNDERGROUND %'
)
ORDER BY name;
-- Breakdown for inspection; verify the dedicated UG category count.
SELECT category, COUNT(*) AS products FROM catalogue_products WHERE active=1 AND category IN ('Underground (UG)', 'Plumbing', 'Plumbing Pipes') GROUP BY category ORDER BY category;
