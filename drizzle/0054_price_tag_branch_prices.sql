CREATE TABLE IF NOT EXISTS price_tag_branch_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand TEXT NOT NULL CHECK(brand IN ('powerbuild','busterbuild')),
  product_id INTEGER NOT NULL REFERENCES catalogue_products(id) ON DELETE CASCADE,
  branch_name TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK(price_cents > 0),
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(brand, product_id, branch_name)
);

CREATE INDEX IF NOT EXISTS price_tag_branch_prices_product
  ON price_tag_branch_prices(brand, product_id);

CREATE INDEX IF NOT EXISTS price_tag_branch_prices_branch
  ON price_tag_branch_prices(branch_name);
