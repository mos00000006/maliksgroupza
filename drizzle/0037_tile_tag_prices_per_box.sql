-- Tile shelf-tag amounts entered by the designer are prices for one box.
-- Keep an audit copy of prior unit labels; do not change the entered amount,
-- product catalogue prices, saved quotations, publication status or QR tokens.
CREATE TABLE IF NOT EXISTS price_tag_box_basis_corrections (
 brand TEXT NOT NULL,
 product_id INTEGER NOT NULL,
 original_unit TEXT NOT NULL,
 original_price_cents INTEGER NOT NULL,
 original_updated_at TEXT NOT NULL,
 corrected_at TEXT NOT NULL,
 PRIMARY KEY (brand,product_id)
);
INSERT OR IGNORE INTO price_tag_box_basis_corrections
 SELECT 'powerbuild',product_id,unit,price_cents,updated_at,strftime('%Y-%m-%dT%H:%M:%fZ','now')
 FROM powerbuild_price_tags WHERE is_tile=1 AND unit='M2';
INSERT OR IGNORE INTO price_tag_box_basis_corrections
 SELECT 'busterbuild',product_id,unit,price_cents,updated_at,strftime('%Y-%m-%dT%H:%M:%fZ','now')
 FROM busterbuild_price_tags WHERE is_tile=1 AND unit='M2';
UPDATE powerbuild_price_tags SET unit='BOX',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE is_tile=1 AND unit='M2';
UPDATE busterbuild_price_tags SET unit='BOX',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE is_tile=1 AND unit='M2';
