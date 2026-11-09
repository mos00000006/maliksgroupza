MALIKS GROUP HUB — COMPLETE LOCKS CATALOGUE PATCH
Version: 2026-11-09

INCLUDES:
- 26 catalogue SKU records (SAMHOO + SEMI-CIRCLE), with individual front-view images
- Four ordered D1 migrations: 0059, 0060, 0061 and 0062
- One image per product; no 2-product collages or shelf/background pictures
- Original existing catalogue records preserved; pricing/stock unaffected
- CSV reference for each product code and matching image path

INSTALL INTO MALIKS GROUP HUB REPOSITORY:
1. UNZIP the archive. Copy public/ and drizzle/ directories INTO the project root, merging with the existing folders. Do not erase or replace entire existing directories.
2. Commit/push changes to the existing GitHub repository.
3. Apply migrations with your deployment database/config; for your existing Cloudflare setup, use:
   npx wrangler d1 migrations apply maliks-group-hub-db --remote --config .deploy/wrangler.jsonc
   Only run against the intended production D1 database. Check the database name/config if your setup has changed.
4. Redeploy the Hub using your established Cloudflare/GitHub pipeline.
5. Check category Locks. Example codes: T001, T008, T016, T025, T026, T030.

NOTES:
- Image URLs use the static:/wholesale-products/... scheme already used by the Hub.
- Migrations use INSERT OR IGNORE and guarded UPDATE. These were tested twice against a representative catalogue_products schema without inserting duplicates.
- Front-view pictures are edited or AI-assisted approximations based on user photos, not authenticated supplier photographs. Verify product packaging/graphics when exact artwork fidelity is important.
- T006 uses a representative long-shackle photo due to the original image cropping.
- This archive prepares the Hub source; it does not deploy or modify the live website itself.
