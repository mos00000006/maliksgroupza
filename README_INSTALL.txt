MALIKS GROUP HUB — SEMI-CIRCLE T001–T012 FRONT VIEW IMAGE CORRECTION

This is an incremental patch, intended to be applied AFTER the earlier locks patch.

CONTENTS
- 11 clean, front-facing, individual catalogue product images (white background; single lock on each brand card).
- A new image-only Cloudflare D1 migration drizzle/0063_semi_circle_front_view_v2.sql.
- Exact SKU-to-image map.

IMPORTANT: T005 is not in the verified uploaded Hub catalogue data and has not been fabricated. No other records or prices are modified.

INSTALL
1. Extract and copy public/ and drizzle/ folders into the repository root, merging (not replacing) folders.
2. Commit and push to GitHub.
3. Apply D1 migrations to the intended production database using your verified Cloudflare configuration, e.g.:
   npx wrangler d1 migrations apply maliks-group-hub-db --remote --config .deploy/wrangler.jsonc
4. Redeploy the Hub. Verify Locks catalogue T001–T004 and T006–T012.

NOTE
The photos are AI-assisted, clean product representations based on supplied SKU photographs. They are not authenticated manufacturer photos and may differ in small styling/packaging details.
The migration updates only existing matching product IMAGE fields (never names, stock, prices, or other SKUs).
