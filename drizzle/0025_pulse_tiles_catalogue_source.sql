-- External catalogue source metadata for Pulse Tiles sync.
ALTER TABLE catalogue_products ADD COLUMN source_name TEXT NOT NULL DEFAULT '';
ALTER TABLE catalogue_products ADD COLUMN source_url TEXT NOT NULL DEFAULT '';
ALTER TABLE catalogue_products ADD COLUMN source_sku TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS catalogue_products_source_url_idx ON catalogue_products(source_name,source_url);
CREATE INDEX IF NOT EXISTS catalogue_products_source_sku_idx ON catalogue_products(source_name,source_sku);
