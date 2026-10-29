COMPANY HUB — YOUR TOUCH365 TORK CRAFT CODES

Copy drizzle and data into Company Hub. Commit and deploy with the usual D1 migration step. New migration: 0052_torkcraft_touch365_store_codes.sql.
If migrations are not applied automatically:
npx wrangler d1 migrations apply maliks-group-hub-db --remote --config .deploy/wrangler.jsonc

This replaces our earlier broad Tork Craft selection with the 93 store codes TC0001–TC0093 from your two photographed Touch365 sheets. The crossed-out TC0010 cutting-kit line is excluded; TC0010 is the 190X40T Contractor blade shown immediately below it. Descriptions are transcribed from your sheets, including truncated wording. No pricing is imported.

Matched supplier records are renamed to your store code where possible, preserving the original product ID, existing saved QR/price associations and uploaded pictures. No saved JPG file can be retroactively changed: regenerate labels to print the new code. Supplier codes remain in data/torkcraft-touch365-codes.json for reference only.

The other products created by our October Tork Craft imports are marked inactive so the catalogue follows your sheets rather than retaining the broader 257-item selection. Hamiltons and unrelated products are unaffected. Pre-existing records owned by you, including any already using a matching store code, are left untouched. If a store code already exists, it wins over the imported supplier record; the duplicate imported record is hidden. Separate record IDs and historical price associations are never merged.

91 entries have supplier picture links. Two descriptions do not identify a unique supplier variant, so no picture is guessed:
TC0005 BLADE CONTRACTOR 185X24T — confirm bore size (16, 20 or 30mm).
TC0027 PLANER BLADES 82MM TUNGSTEN — confirm exact blade/holder type or supplier code.
These two products are still added using your store codes and descriptions. Pictures can be uploaded in the catalogue later. Existing pictures are preserved.

All picture links depend on the supplier image service and the previously installed Tork Craft image support. This ZIP contains links, not bundled photo files. The migration does not replace application, Worker, price-tag generator or designer sign-in files. Do not delete previously applied migration files.

Validation: local SQLite checks used the real earlier full import, removal and both selection migrations, then this conversion: exactly 93 store-code records active, 91 picture mappings, all sheet names checked, stable IDs/QR/prices/own pictures on renamed records, no duplicates on repeat, clean install, existing store-code collisions protected and Hamiltons preserved. No remote migration, live deployment or full app build was run here.
