CREATE TABLE IF NOT EXISTS busterbuild_price_tags (
 product_id INTEGER PRIMARY KEY NOT NULL REFERENCES catalogue_products(id),
 token TEXT NOT NULL UNIQUE,
 price_cents INTEGER NOT NULL CHECK(price_cents>0),
 unit TEXT NOT NULL DEFAULT 'EA' CHECK(unit IN ('EA','M2','BOX')),
 is_tile INTEGER NOT NULL DEFAULT 0 CHECK(is_tile IN (0,1)),
 coverage_per_box REAL NOT NULL DEFAULT 0,
 pieces_per_box INTEGER NOT NULL DEFAULT 0,
 tile_width_mm REAL NOT NULL DEFAULT 0,
 tile_length_mm REAL NOT NULL DEFAULT 0,
 published INTEGER NOT NULL DEFAULT 1 CHECK(published IN (0,1)),
 updated_by TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 CHECK(is_tile=0 OR coverage_per_box>0)
);

ALTER TABLE busterbuild_price_tags ADD COLUMN picture_key TEXT NOT NULL DEFAULT '';
