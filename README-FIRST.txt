MALIKS GROUP HUB — CLOUDFLARE D1 MIGRATION ERROR 7500 FIX

Problem: The prior catalogue category migration included explicit BEGIN TRANSACTION and COMMIT commands. Cloudflare D1 Wrangler migrations reject those SQL statements in this execution context, returning error code 7500.

Fix: This replacement retains all 212 original exact-stock-code UPDATE statements and removes ONLY the BEGIN TRANSACTION and COMMIT wrapper. No product codes, names, pictures, prices, permissions or other tables are changed by the SQL. Each statement still restricts updates to active products with system-maintained updated_by values.

INSTALLATION (GitHub repository)
1. Back up the live D1 database and export current catalogue_products records before applying any migration.
2. Replace the existing file at drizzle/CATALOGUE_REVIEWED_CLASSIFICATION.sql with the file from this ZIP, keeping the SAME filename. DO NOT add a second numbered migration or put the file into a different migration directory unless your migration config uses another path.
3. Commit and push the replacement file.
4. Confirm Cloudflare deployment uses this commit/branch. Re-run:
   npx wrangler d1 migrations apply maliks-group-hub-db --remote --config .deploy/wrangler.jsonc
5. Verify the migration shows success. If Wrangler reports the migration has already been applied, DO NOT manually delete migration history or force it to rerun; inspect the database first.
6. Compare before/after categories using the preview and verification queries shipped with the original catalogue cleanup package. Check a few UG, SV, blinds, locks and fastener products in the live Hub.

SAFETY
- A failed migration normally remains pending, but verify using: npx wrangler d1 migrations list maliks-group-hub-db --remote --config .deploy/wrangler.jsonc
- D1 migration management controls execution; do not wrap migration SQL in BEGIN/COMMIT. Back up first and ensure no other deployment executes migrations concurrently.
- This fix addresses ONLY SQL error 7500; it does not prove the live database schema matches the SQL or that all products are correctly classified.
- If the next run fails with a different error (missing table/column), stop and share the new error instead of modifying live schema blindly.

VALIDATION
- Verified 212 UPDATE statements retained exactly unchanged.
- Verified no explicit BEGIN, COMMIT or SAVEPOINT.
- Executed SQL twice against a synthetic SQLite table with matching required columns: worked, preserved price/image, respected manual edits.
- Not run against live Cloudflare D1 from this environment.
