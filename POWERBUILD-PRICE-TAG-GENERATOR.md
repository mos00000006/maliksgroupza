# PowerBuild price tag generator

## Install this patch

Extract the ZIP directly into the existing Hub project folder. Merge the `app`, `public`, `worker`, `drizzle` and `tests` folders and replace the included files. Keep your existing credentials, Git directory, database configuration and all other files.

From that project folder run:

```powershell
npm run db:migrate:production
npm run deploy
```

The new migration is `drizzle/0033_powerbuild_price_tags.sql`. It adds a tag table without changing existing catalogue products or online-shop prices. No new npm dependency is required; the MIT-licensed QR encoder is bundled locally.

## Use it

1. Open **Our Catalogue → Price tag generator**, or open `/price-tags` while signed in to the Hub.
2. Enter an existing catalogue product code and choose **Find product**. The name and picture come from the catalogue.
3. Enter the selling price **including VAT**. Standard products use **each**.
4. For a tile product, enable Smart Measure if it was not automatically selected. Confirm **m² per box** from the actual carton and choose **per m²** or **per box** pricing. Tile count and dimensions are optional. Recognised pack details are filled automatically, but missing box coverage must be supplied once. Coverage is never guessed from the picture.
5. Confirm the **Customer website address** is the public HTTPS address of this deployment. A localhost address only works for local testing.
6. Select **Generate price tag**. It saves the tag price, publishes the QR product page and adds the tag to the print sheet.
7. Add more product codes to build a print sheet. Choose **Print / Save as PDF**.

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

The Worker allows anonymous GET/HEAD requests only for valid public QR tokens, their image endpoints, and the required brand artwork. All management endpoints retain company authentication. Public image requests check that the tag is published and the product active, and do not expose the complete catalogue.

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

The feature is packaged for your existing project; it has not been deployed to the live site.
