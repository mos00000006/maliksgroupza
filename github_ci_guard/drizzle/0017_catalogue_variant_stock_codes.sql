-- Add editable size-specific stock codes for catalogue products
ALTER TABLE catalogue_products ADD COLUMN code_5l TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE catalogue_products ADD COLUMN code_20l TEXT NOT NULL DEFAULT '';
--> statement-breakpoint

-- Preserve the size-code values that were previously generated in the UI so managers can edit them.
UPDATE catalogue_products
SET code_5l = CASE
      WHEN code_5l = '' AND upper(description) LIKE '%5L%' THEN code || '-5L'
      ELSE code_5l
    END,
    code_20l = CASE
      WHEN code_20l = '' AND upper(description) LIKE '%20L%' THEN code || '-20L'
      ELSE code_20l
    END
WHERE active=1
  AND code LIKE 'WHPDF-CARD-P11-%'
  AND (upper(description) LIKE '%5L%' OR upper(description) LIKE '%20L%');
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS catalogue_products_variant_codes_idx ON catalogue_products(code_5l,code_20l);
