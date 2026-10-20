# PowerBuild price tag generator — JPG download and picture outline fix

## What this update fixes

- Automatically removes backgrounds for every product category, including tiles, during product lookup before tag generation. It uses a locally hosted U²-Net model in the staff browser instead of only removing white edges. Product pixels and artwork are retained; the model supplies a transparency mask.
- Trims excess transparent canvas, removes outside white residue, and keeps existing prepared transparent PNGs. Review delicate edges and white products: automatic segmentation cannot guarantee perfect results for every source photo. A replacement PNG upload and **Remove background again** button remain available.
- Saves the resulting product-only PNG for both the tag and the public customer page. Customer phones load the saved picture and never run or download the model. Catalogue originals stay unchanged.
- If processing fails, it requests a retry or replacement PNG instead of silently generating with the original square background. Existing tags must be looked up and generated again to save their cutout.
- Removes the grey CSS picture shadow; the customer logo remains centered with its transparent background and no slogan.
- Adds **Download latest JPG** and **Download JPG** per tag at 2700 × 1800 pixels. Product cutouts retain PNG transparency; the complete JPG tag has a white background.
- Warns when entered tile dimensions/count and box coverage disagree, without altering the figures.
- Fixes static catalogue image delivery and limits supplier redirects to approved HTTPS hosts.

The model and browser runtime are bundled: no API key, external image service or new npm dependency is needed. First use loads approximately 16 MB from this Hub; the browser can cache those assets. Processing runs in a worker to keep the interface responsive. Runtime/model license notices are included. Each file is below the Cloudflare static-asset size limit.

**Apply the database migration before deploying the updated code.** This package includes migrations 0033 and 0034; Wrangler skips migrations already applied. Migration 0034 adds the optional tag picture reference.

## Install this patch

Extract the ZIP directly into the existing Hub project folder. Merge the `app`, `public`, `worker`, `drizzle` and `tests` folders and replace the included files. Keep your existing credentials, Git directory, database configuration and all other files.

From that project folder run:

```powershell
npm run db:migrate:production
npm run deploy
```

The new migration is `drizzle/0033_powerbuild_price_tags.sql`. It adds a tag table without changing existing catalogue products or online-shop prices. No new npm dependency is required; the QR encoder, image exporter and background-removal runtime/model are bundled locally.

## Use it

1. Open **Our Catalogue → Price tag generator**, or open `/price-tags` while signed in to the Hub.
2. Enter an existing catalogue product code and choose **Find product**. The name and picture come from the catalogue.
3. Enter the selling price **including VAT**. Standard products use **each**.
4. For a tile product, enable Smart Measure if it was not automatically selected. Confirm **m² per box** from the actual carton and choose **per m²** or **per box** pricing. Tile count and dimensions are optional. Recognised pack details are filled automatically, but missing box coverage must be supplied once. Coverage is never guessed from the picture.
5. Wait for automatic background removal and check the product-only PNG preview. This applies to tools, tiles and all other product categories. Retry or upload a replacement PNG if a fine edge needs correction.
6. Confirm the **Customer website address** is the public HTTPS address of this deployment. A localhost address only works for local testing.
7. Select **Generate price tag**. It saves the tag price, publishes the QR product page and adds the tag to the print sheet.
8. Add more product codes to build a print sheet. Choose **Print / Save as PDF**, or **Download JPG** for an individual tag.

### Printing

The tag follows the supplied TEMP template: the original PowerBuild blue/yellow rail, product picture, product name, code, QR, pack information and large price. Text and QR codes are generated dynamically; the sample product and QR are not baked into the artwork.

Tags are **150 × 100 mm**, matching the template's 3:2 proportions. Use **A4 portrait**, **100% scale**, **background graphics on**, and **browser headers/footers off**. Two tags fit per page. Print one tag first and scan it with a phone before printing a batch.

The print sheet lasts for the current browser session. Saved prices and QR links remain in the Hub. Enter the same product code again to load or edit its saved tag.

## Customer experience

A scan opens `/p/<unique-token>` without requiring a Hub account. It shows only the published product name, code, picture, VAT-inclusive tag price and tile pack details. It contains no Hub navigation, stock controls, admin fields or wholesale pricing.

Tile Smart Measure supports:

- Length × width for one or multiple rooms, or direct entry of an area.
- A choice of 0%, 5%, 10%, 15%, 20% or 30% wastage allowance.
- Full-box rounding and the actual coverage those boxes supply.
- Estimated tile cost based on the chosen per-box or per-m² tag price. Per-m² cost uses the coverage of full boxes, not only the measured room area.

The current price is fetched with no-store caching, refreshed when the customer returns to the page and checked every minute while visible. Network errors show a warning. This is a tile quantity/cost calculator, not a camera or AR measurement tool.

## Updating and hiding tags

The same product keeps its QR token when the saved price changes. **Reprint shelf tags after changing a price** because the physical tag still contains the previous printed amount.

To remove customer access, find the product, untick **Make this product and tag price visible to customers who scan**, and save. The public data and picture endpoints then return unavailable. Deactivating the catalogue product also disables the customer page.

Tag prices are separate from E-Commerce Control; saving a shelf tag does not change retail/wholesale online-shop prices or enable online sales channels.

## Access and domain setup

The generator and management API require an authorised catalogue manager, the owner/technical admin, or a non-viewer Full company member. Catalogue managers see the button in Our Catalogue. Other authorised pricing managers can use `/price-tags` directly.

The Worker allows anonymous GET/HEAD requests only for valid public QR tokens, their image endpoints, and the required brand artwork. All management endpoints retain company authentication. The asset binding is now explicitly included in the Vite/Cloudflare deployment configuration. Public image requests check that the tag is published and the product active, and do not expose the complete catalogue.

**If Cloudflare Access protects the entire hostname before requests reach the Worker**, add narrowly scoped public/bypass applications or rules for these customer paths and required static assets:

- `/p/*`
- `/api/public-price-tags/*`
- `/price-tag-assets/*`
- `/powerbuild-logo-transparent.png`
- Existing public application bundles/fonts under `/assets/*` and `/_next/*`

Keep `/`, `/price-tags`, `/api/price-tags` and other Hub/API routes protected. Do not bypass the entire domain. The QR address must point to this same deployed Hub so its product endpoint and pictures exist.

After deployment, test a QR link in a signed-out/private browser on a phone. Cloudflare Access rules are account settings and are not changed by this source patch. No live hosting or Access configuration was changed while preparing the patch.

## Validation

- Full `npm run check` passed: lint (existing image warnings only), production build, authentication tests, rendered HTML and the new price-tag tests.
- The production compiler passed. Standalone `npx tsc --noEmit` still reports repository-wide missing Cloudflare binding declarations and unrelated legacy type errors; this patch does not attempt a repository-wide type cleanup.
- API tests verified manager permissions, input validation, stable tokens, public field whitelisting, unpublishing, image access checks and blocked unsafe image sources.
- Tile tests covered multiple rooms, wastage, per-box/per-m² pricing, full-box rounding and invalid measurements.
- Browser checks verified product lookup/save/preview with representative API fixtures, QR decoding, mobile layout without horizontal overflow, and a 4 × 3 m tile estimate: 10% wastage, 2.16 m²/box, 7 boxes, 15.12 m² supplied and R5,896.65 at R389.99/m².
- The browser print output was inspected as a PDF on A4. The QR was independently decoded from the generated image.
- This update passed `npm run check` with all 11 tests. Additional tests covered preserved white interiors, the pale-product safeguard, and authorised PNG uploads.
- The emitted production Wrangler configuration was checked for `assets.binding = ASSETS`.
- Browser checks confirmed the centered, transparent-background logo and removal of the slogan. A real locally seeded catalogue product was opened through the actual public data and image routes, both returning 200 without a Hub sign-in step; the real product picture was rendered successfully. This was a local deployment check, not a change to your hosted Cloudflare Access account.

The feature is packaged for your existing project; it has not been deployed to the live site.

JPG validation: browser download completed at 2700 × 1800 pixels; an independent QR decoder recovered the correct product URL from the exported JPG. All 11 checks passed.

## Automatic cutout validation

The actual browser model was run on the supplier Foster Ash tile and a Conan cordless drill kit. Both returned cropped PNGs with transparent alpha. Browser checks exercised tile lookup, PNG upload, JPG download, QR decoding and the mobile customer page. Customer rendering uses the saved PNG and does not request model/runtime assets. Automated repository checks passed (11 tests). No live deployment was performed.
