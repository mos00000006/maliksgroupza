COMPANY HUB — SELECTED TORK CRAFT PRODUCTS ONLY

Copy drizzle and data into Company Hub and deploy with your usual D1 migration step. No application files are replaced.
Includes the SAME 0049 removal migration from the previous removal patch, plus NEW 0050_selected_torkcraft_blades_holesaws.sql. Already-applied 0049 is skipped by D1; keep the original migration files in the repository.
If migrations are not automatic:
npx wrangler d1 migrations apply maliks-group-hub-db --remote --config .deploy/wrangler.jsonc

Refresh the catalogue after migrations succeed.

190 products selected from the official Tork Craft catalogue snapshot collected on 27 October 2026:
78 Contractor circular-saw blades (listed sizes 150-500mm, including aluminium variants)
80 diamond blade products, including mini diamond saw blades
27 HSS holesaws: 12,13,14,16,17,18,19,20,22,24,25,28,30,32,35,38,40,42,45,48,50,55,60,64,70,75,80mm
3 boilermaker chalk options: TCBC001 holder/chalk, TCBC0012 12-piece, TCBC0144 144-piece
1 brushcutter blade: TCBCB25540, 255 x 40T, 25.4mm bore
1 four-teeth blade: TC911504, 115 x 22.23mm

Interpretation: “boiler makers” means the supplier's boilermaker chalk products; “blade for teeth” means its Blade 4 Teeth TC911504. No other interpretation is silently imported. Data/selected-torkcraft-products.json contains the exact codes, names and pictures for review.

No prices are added. All 190 products have supplier-hosted picture links. Existing Tork Craft image support from the earlier picture patch is required and is not removed by the removal migration. Pictures depend on the supplier service; these are image links, not bundled photo files.

Only selected records deactivated by our previous Tork Craft removal migration are reactivated, preserving their original IDs, saved prices and QR identity. Missing codes are inserted. Other removed Tork Craft products stay inactive. Existing custom records, photos and manually inactive products are not overwritten/reactivated. Existing saved combo compositions and downloaded JPGs are unchanged.

Checks: actual earlier full-import SQL followed by removal and selective restoration was verified in local SQLite: exactly 190 selected imported products active, all others inactive, stable IDs and prices, correct image mapping, safe repeated application, clean-database insertion and preservation of custom inactive records. No live deployment or remote migration was run here.
