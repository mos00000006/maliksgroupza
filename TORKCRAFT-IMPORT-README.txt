COMPANY HUB — TORK CRAFT CATALOGUE

5,817 unique product names and codes collected from the official All Products catalogue on 27 October 2026. All six pages at 1,000 items per page were checked against the advertised total of 5,817.
Source: https://www.torkcraft.com/index.php?route=product/catalog

Apply to COMPANY HUB only. Copy the drizzle, data and tests folders into the repository and commit. Your normal deployment must apply D1 migrations. If the deployment does not do that automatically, use the existing deployment configuration:
npx wrangler d1 migrations apply maliks-group-hub-db --remote --config .deploy/wrangler.jsonc

The new migration is drizzle/0046_torkcraft_catalogue_names_codes.sql. Once deployment and migrations finish, refresh the Hub catalogue and search a code such as AB03170. New products appear in category Tork Craft.

Only product names and codes are imported, with category Tork Craft for filtering. No pricing, pictures, stock quantities or supplier descriptions are imported. Existing products matching a code, ignoring case and surrounding spaces, are left untouched, including their names, photos, prices and inactive status. Consequently the number of NEW products depends on how many codes already exist in your catalogue. The original products are never removed.

The migration adds a lookup index to avoid scanning the entire catalogue for every imported code. It inserts in batches of 100 and is safe to repeat. No root page, Worker, price-tag generator or permission settings are replaced.

Source note: TC69003 had a blank product title on the official listing. Its product name was taken from the first line of that listing's own description: Tork Craft Extension Bar 3-Piece Set — ½″ Drive (75 mm, 125 mm, 250 mm) (Model TC69003).

Validation: two local SQLite tests passed: all 5,817 names/codes insert correctly; repeating the import preserves existing codes (including case/space differences), pictures, inactive records and price data. No remote database migration or live deployment was performed here.
