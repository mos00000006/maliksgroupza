COMPANY HUB — YOUR ADDITIONAL TOUCH365 PRODUCTS

Apply AFTER the previous TC0001–TC0093 store-code patch (migration 0052). Copy drizzle and data into Company Hub, commit and deploy with your normal D1 migration step. New migration: 0053_touch365_torkcraft_TC0094_TC0340.sql.
If migrations are not automatic:
npx wrangler d1 migrations apply maliks-group-hub-db --remote --config .deploy/wrangler.jsonc

Adds the 247 product codes TC0094–TC0340 and descriptions transcribed from your six quotation photographs. Prices, quantities, quotation/customer information and banking details are excluded. Previous TC0001–TC0093 records are not changed, giving 340 store-code products when both patches are applied and no pre-existing protected code conflicts exist.

Your codes are used in the catalogue; supplier codes are only a matching reference in data/touch365-products-TC0094-TC0340.json. Descriptions are kept as printed, including truncated wording and repeated descriptions assigned different store codes. Repeated descriptions are NOT collapsed into one product.

180 entries have matched supplier-hosted picture links. 67 entries are still added with no guessed picture; see data/picture-review-required.json. Incomplete descriptions or missing variant details prevent a safe match (for example rotary burr shape, belt pack size, disc hole pattern, wheel-spanner length, or toolbox size). TC0104–TC0106 specify 14-piece thread repair kits whereas the matching supplier-size listings specify 29 pieces; TC0107 specifies M10 x 1.25 whereas the listed supplier kit is M10 x 1.5. TC0339 says a 225mm 3T brushcutter blade, while the source lists 255mm. These differences were not silently corrected.

Matched records created by our earlier Tork Craft imports are renamed to the store code if that target code is unused, preserving product IDs, stored price/QR associations and uploaded pictures. Otherwise a missing store record is inserted and only an owned supplier-code duplicate is hidden. Unrelated products and custom existing records with a matching code are preserved. There is no broad deactivation in this add-on. Static downloaded JPG labels must be regenerated to show changed codes.

Pictures use the already installed Tork Craft image-host support and depend on supplier availability. This ZIP contains image links, not bundled photographs. No application, Worker, permissions or generator files are replaced. Keep earlier applied migrations in the repository.

Local SQLite validation passed: all 247 contiguous store codes and names, previous 93 records unchanged, 340 active store codes after the combined conversion, 180 image mappings on a clean import, stable IDs/prices/QR associations, own pictures preserved, existing custom records and Hamiltons protected, and safe repeated migration. No remote migration, live deployment or full application build was performed here.
