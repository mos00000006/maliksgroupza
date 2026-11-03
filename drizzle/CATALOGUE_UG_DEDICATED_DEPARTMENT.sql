-- MIGRATION: CATALOGUE_UG_DEDICATED_DEPARTMENT.sql
-- Ensures every clearly marked UG item (INCLUDING UG PIPES) is grouped in its own department.
-- No BEGIN/COMMIT: Cloudflare D1 migration runner controls atomic execution.
-- Intentionally leaves ambiguous items unchanged. Does not change codes, images, prices or descriptions.
-- Safe to rerun; product rows updated only when a category correction is needed.
UPDATE catalogue_products
SET category = 'Underground (UG)',
    updated_at = datetime('now')
WHERE active = 1
  AND category COLLATE NOCASE <> 'Underground (UG)'
  AND (
  UPPER(TRIM(category)) IN ('UG','UNDERGROUND','UNDERGROUND (UG)')
  OR (' ' || UPPER(TRIM(REPLACE(REPLACE(REPLACE(name, '-', ' '), '/', ' '), '(', ' '))) || ' ') LIKE '% UG %'
  OR (' ' || UPPER(TRIM(REPLACE(REPLACE(name, '-', ' '), '/', ' '))) || ' ') LIKE '% UNDERGROUND %'
);
