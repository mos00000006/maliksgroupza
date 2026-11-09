-- Maliks catalogue audit fixes (2026-11-09): category accuracy and legacy duplicate SKUs.
-- Safe when earlier migrations up to 0066 have already been installed.
-- Keeps all historical records and does not touch stock, prices, or linked transactions.

-- Move explicitly identified underground (UG) products out of Plumbing.
-- Word boundaries prevent treating PLUG, MUG, etc. as UG.
UPDATE catalogue_products
SET category='Underground (UG)', updated_by='system:catalogue-audit-v7', updated_at=datetime('now')
WHERE active=1 AND category COLLATE NOCASE <> 'Underground (UG)'
  AND (
    UPPER(TRIM(category)) IN ('UG','UNDERGROUND','UNDERGROUND (UG)')
    OR (' ' || UPPER(TRIM(REPLACE(REPLACE(REPLACE(name, '-', ' '), '/', ' '), '(', ' '))) || ' ') LIKE '% UG %'
    OR (' ' || UPPER(TRIM(REPLACE(REPLACE(name, '-', ' '), '/', ' '))) || ' ') LIKE '% UNDERGROUND %'
  );

-- Put actual window blinds in their own department, but never blind rivets or hardware.
UPDATE catalogue_products
SET category='Window Blinds & Treatments', updated_by='system:catalogue-audit-v7', updated_at=datetime('now')
WHERE active=1 AND category COLLATE NOCASE <> 'Window Blinds & Treatments'
  AND LOWER(name) LIKE '%blind%'
  AND LOWER(name) NOT LIKE '%blind rivet%'
  AND LOWER(name) NOT LIKE '%blind flange%'
  AND LOWER(name) NOT LIKE '%blind cap%'
  AND LOWER(name) NOT LIKE '%blind plug%'
  AND LOWER(name) NOT LIKE '%blind nut%';

-- T001-T030 are padlocks, not door locksets. Never create missing numbers.
UPDATE catalogue_products
SET category='Locks', updated_by='system:catalogue-audit-v7', updated_at=datetime('now')
WHERE active=1 AND code IN (
  'T001','T002','T003','T004','T006','T007','T008','T009','T010','T011','T012',
  'T016','T017','T018','T019','T020','T021','T022','T023','T024','T025',
  'T026','T027','T028','T029','T030'
) AND category COLLATE NOCASE <> 'Locks';

-- Two old imported Nail-In Anchor SKUs duplicate supplier-verified equivalents.
-- Inactivate, never DELETE: existing sale/stock references remain preserved.
UPDATE catalogue_products
SET active=0,updated_by='system:catalogue-audit-v7',updated_at=datetime('now')
WHERE code IN ('TF-NA5035-15','TF-NA5050-5') AND active=1
  AND created_by='system:2026-10-10-instore-batch-2'
  AND EXISTS (
    SELECT 1 FROM catalogue_products newer
    WHERE newer.active=1
      AND newer.code=CASE catalogue_products.code
        WHEN 'TF-NA5035-15' THEN 'TF-NA535-15'
        WHEN 'TF-NA5050-5' THEN 'TF-NA550-5'
      END
  );

-- Two other older 6x60 anchor rows have no product photos in the base catalogue.
-- Preserve their identifiers/descriptions and use a generic representative tub image.
UPDATE catalogue_products
SET image_name='nailjar-brand-only-v6.jpg',image_type='image/jpeg',image_size=108375,
    image_key='static:/wholesale-products/tommy-fix/nailjar-brand-only-v6.jpg',
    updated_by='system:catalogue-audit-v7',updated_at=datetime('now')
WHERE active=1 AND code IN ('TF-NA6060-50','TF-NA6060-100')
  AND (image_key IS NULL OR TRIM(image_key)='')
  AND created_by='system:2026-10-10-instore-batch-2';

-- Correct confirmed mojibake from the November 2026 supplier import:
-- 600Ã1200 -> 600×1200, â -> –, and DÃ©cor -> Décor.
-- Only applies to system-created supplier rows with untouched system updates.
UPDATE catalogue_products
SET name=REPLACE(
           REPLACE(
             REPLACE(name, 'Ã' || char(151), '×'),
             'â' || char(128) || char(147), '–'),
           'Ã©', 'é'),
    updated_by='system:catalogue-audit-v7',updated_at=datetime('now')
WHERE active=1
  AND created_by IN ('system:pulse-tiles-static-v1','system:pulse-bathroom-static-v1')
  AND updated_by IN ('system:pulse-tiles-static-v1','system:pulse-bathroom-static-v1')
  AND (instr(name,'Ã')>0 OR instr(name,'â')>0);
