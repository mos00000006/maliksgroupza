COMPANY HUB — REMOVE IMPORTED TORK CRAFT PRODUCTS

Copy the drizzle folder into Company Hub, then commit and deploy with your normal D1 migration step.
New migration: 0049_remove_imported_torkcraft_products.sql.

If migrations are not automatic in your deployment, run:
npx wrangler d1 migrations apply maliks-group-hub-db --remote --config .deploy/wrangler.jsonc

Refresh the catalogue after the migration succeeds. Products created by the previous Tork Craft import are marked inactive and disappear from the active catalogue and price-tag product searches. Their database IDs and associated history remain available for record keeping. The number removed depends on how many products that import actually created.

Products that existed before that import were skipped by the import and are left intact, including any existing Tork Craft items. Hamiltons, paint variants, tiles and other supplier imports are unaffected. No prices, photos, saved combo compositions or history records are deleted. Previously generated JPG tags are static files and are not recalled by this migration.

Keep migrations 0046 and 0047 in the repository if already applied. Do not edit or delete applied migrations: this new migration reverses product visibility. No application/Worker files need replacing.

Validation: checked against the actual earlier Tork Craft import in local SQLite, including pre-existing matching codes, an unrelated Hamiltons record, stored prices and repeat application. No remote database or live deployment was changed here.
