# Catalogue stock update — 10 October 2026

The Company Hub **Our Catalogue** module now contains **495 prepared in-store stock records** from the supplied stock-list screenshots across the first and second capture batches.

## Catalogue behaviour
- Stock code, product name/description and category remain in the live catalogue structure.
- Catalogue administrators retain **Add**, **Edit**, **Remove/Delete**, and manual product-image upload.
- Product images can be uploaded when adding or editing a product. The browser optimises large images before upload.
- Catalogue-specific AI image generation has been removed. There is no **Generate picture** button, no bulk **Generate missing pictures** panel, and no `/api/catalogue/ai-image` endpoint.
- Other Hub AI features, including the Sidekick/SOP features, are unchanged.

## Prepared stock seed
- Seed key: `2026-10-10-instore-batch-2`
- Prepared stock file: `app/api/catalogue/prepared-stock.ts`
- Reference export: `docs/catalogue-prepared-stock-2026-10-10.csv`

## Deployment note
This seed adds the new stock lines to the existing catalogue seeding workflow. Because the catalogue insert logic uses `INSERT OR IGNORE`, existing live records are preserved and only missing stock codes are added when this seed version is applied.
