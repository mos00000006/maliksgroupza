# Pulse Tiles catalogue sync — 19 October 2026

This update adds a controlled Pulse Tiles tile-range sync into **Our Catalogue**.

## What it imports
The sync covers the Pulse Tiles "Tiles by Type" ranges:
- Ceramic Tiles
- Porcelain Tiles
- Hardbody Tiles
- Natural Stone Cladding
- Mosaics
- Decor Tiles
- Laminate Flooring

For each source product the Hub attempts to capture:
- Source SKU / product code
- Product name
- Short description
- Tile size and other useful specifications when published
- Pulse Tiles source URL
- Source product image reference

## How it works
1. Apply migration `0025_pulse_tiles_catalogue_source.sql`.
2. Open **Our Catalogue** as a catalogue administrator.
3. Click **Sync Pulse Tiles**.
4. Keep the catalogue page open while the progress bar works through each source category and page.
5. The process is safe to run again. Existing Pulse Tiles items are refreshed rather than duplicated.

## Category mapping
- Pulse Ceramic Tiles -> `Tiles - Ceramic`
- Pulse Porcelain Tiles -> `Tiles - Porcelain`
- Pulse Hardbody Tiles -> `Tiles - Hardbody`
- Pulse Natural Stone Cladding -> `Tiles - Cladding`
- Pulse Mosaics -> `Tiles - Mosaics`
- Pulse Decor Tiles -> `Tiles - Decor`
- Pulse Laminate Flooring -> `Laminate Flooring`

## Product codes
The Hub prefers the published Pulse Tiles SKU when it does not clash with an existing PowerBuild catalogue code. If a code already exists, the sync creates a safe `PT-...` code while retaining the original Pulse SKU in the source metadata.

## Images
Source images are not copied into the deployment ZIP. The catalogue stores a Pulse Tiles source-image reference and the Hub securely proxies it for display. This keeps the deployment package small and allows the source image to remain linked to the current product.

## E-commerce
New synced products are NOT automatically published to B2C or B2B e-commerce. Their B2C/B2B settings are created disabled, so a Full Company authorised user can first set the correct PowerBuild retail/wholesale pricing and enable the required channel.

## Files added / changed
- `drizzle/0025_pulse_tiles_catalogue_source.sql`
- `app/api/catalogue/pulse-sync/route.ts`
- `app/api/catalogue/[id]/external-image/route.ts`
- `app/api/catalogue/shared.ts`
- `app/catalogue.tsx`
- `app/catalogue-pdf.ts`
- `app/globals.css`

No Pulse Tiles selling prices are imported into PowerBuild e-commerce.
