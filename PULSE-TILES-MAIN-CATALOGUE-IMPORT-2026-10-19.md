# Pulse Tiles → Main Catalogue Import — 19 October 2026

This update removes the need to treat Pulse tiles as a separate syncing catalogue inside the Hub.

## What changed
- Imports the **321 actual tile products** from the saved Pulse Tiles catalogue snapshot directly into `catalogue_products`.
- These products are now ordinary PowerBuild catalogue products and therefore count inside the main **Products in catalogue** total.
- All imported products use category **Tiles & Flooring**.
- Product codes, names, descriptions and product images are retained.
- The main catalogue remains D1-backed; no request-time tile sync is required.
- Product images use the Hub image endpoint, which can proxy the stored source image URL.
- The same imported products are added to B2C/B2B channel controls at zero price so Full Company users can set PowerBuild pricing.
- No Pulse supplier price is imported into PowerBuild pricing.

## Expected count
If the live catalogue currently shows **788** products and none of these 321 tile codes already exist, the total will become **1,109 products** after migration 0025.

## Migration
Run:

```bash
npx wrangler d1 migrations apply maliks-group-hub-db --remote --config .deploy/wrangler.jsonc
```

## Files
- `drizzle/0025_pulse_tiles_static_catalogue.sql`
- `app/api/catalogue/[id]/image/route.ts`
- `app/api/ecommerce/product-image/[id]/route.ts`
- `app/catalogue-pdf.ts`
- `app/catalogue.tsx` (DB-only catalogue UI; no Pulse sync UI)
