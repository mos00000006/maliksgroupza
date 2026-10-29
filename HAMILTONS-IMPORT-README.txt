COMPANY HUB — HAMILTONS CATALOGUE

Copy drizzle, data, scripts and tests into Company Hub, replacing matching files. Commit and deploy with D1 migrations. This patch is for Company Hub, not the BusterBuild sales app.

407 distinct published stock codes, including individual sizes/options, are included. Category: Hamiltons. No prices, stock quantities or barcode fields are added. Names include sizes/options where published to make variants distinguishable.

365 supplier-hosted picture links are included; 42 records have no usable resolved picture. These are links to the supplier, not downloaded image assets. Existing catalogue records with matching codes (case/space insensitive) are skipped completely, preserving names, pictures, inactive state and prices. No duplicate catalogue products are created.

IMPORTANT PICTURE LIMITATION: Hamiltons blocked direct automated retrieval from this environment with an HTTP 202 HTML challenge, even for an image URL. The web retrieval service resolved the 365 official image URLs, but that does not prove your Cloudflare Worker can fetch them. The existing authenticated supplier image route is enabled for Hamiltons. If the supplier blocks requests from Cloudflare as well, the pictures will not display until the supplier permits access or you upload product images yourself. This patch does not bypass that protection. No live Hub image-loading claim is made.

Migration: drizzle/0048_hamiltons_catalogue.sql. Use your normal migration deployment. If needed:
npx wrangler d1 migrations apply maliks-group-hub-db --remote --config .deploy/wrangler.jsonc

The previous Tork Craft image installer now chains to scripts/install-hamiltons-images.mjs, so your existing prebuild chain installs image support. If that previous installer is not part of your build, run once before building:
node scripts/install-hamiltons-images.mjs

Coverage and exceptions: product categories and product pages on https://hamiltonsbrush.co.za/products/ were checked on 27 October 2026. This is not claimed to be the supplier's complete stock file. Entries lacking a published stock code are listed in data/hamiltons-review-required.json. Some product pages could not be read. Code 1315 is shown against both 19mm and 100mm SilkPro variants on the same source page, so it is excluded pending confirmation. No invented codes or barcode-derived stock codes were used.
Unreadable category-linked pages: reflective-tape-50mm-x-5m-yellow, oval-broom-head-flagged-bristle, scrub-broom-head-260mm, s-shaped-scrub. Codes from these pages could not be verified.

Validation: two local SQLite/integration tests passed for all 407 records, image mapping, preserving existing products/pricing, repeat-safe migration, and preserving Tork Craft/Pulse image support and build hooks. No full production build, remote migration or deployment was run.
