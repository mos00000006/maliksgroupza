-- Simplify imported 5L / 20L paint ranges: display as ASSORTED instead of size-specific codes.
-- Only remove system-generated variant codes; preserve any manually entered stock codes in the database.
UPDATE catalogue_products
SET code_5l = CASE WHEN code_5l = code || '-5L' THEN '' ELSE code_5l END,
    code_20l = CASE WHEN code_20l = code || '-20L' THEN '' ELSE code_20l END
WHERE code_5l = code || '-5L' OR code_20l = code || '-20L';
