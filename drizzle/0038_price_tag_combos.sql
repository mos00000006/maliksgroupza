CREATE TABLE IF NOT EXISTS price_tag_combos (
 token TEXT PRIMARY KEY NOT NULL,
 brand TEXT NOT NULL CHECK(brand IN ('powerbuild','busterbuild')),
 code TEXT NOT NULL COLLATE NOCASE,
 name TEXT NOT NULL,
 price_cents INTEGER NOT NULL CHECK(price_cents>0),
 includes_title TEXT NOT NULL,
 includes_text TEXT NOT NULL,
 items_json TEXT NOT NULL,
 published INTEGER NOT NULL DEFAULT 1 CHECK(published IN (0,1)),
 updated_by TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 UNIQUE(brand,code)
);
CREATE INDEX IF NOT EXISTS price_tag_combos_brand_updated ON price_tag_combos(brand,updated_at DESC);
