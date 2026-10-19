# Pulse Tiles Kitchens Catalogue Import — 19 October 2026

Adds a controlled one-click importer to **Our Catalogue** for the Pulse Tiles Kitchens range.

## Imported source ranges
- Kitchen Sinks
- Kitchen Sink Taps
- Kitchen Sink Fittings
- Kitchen Floor / Wall Tiles (catalogued as Kitchen Tiles)
- Kitchen Mosaics

## Import behaviour
- Available only to authorised Catalogue Administrators.
- Reads the current live Pulse Tiles category pages and their pagination.
- Reads each product page to obtain the product name and SKU.
- Uses the source SKU as the catalogue product code where available.
- Downloads product imagery to the Hub R2 catalogue storage.
- Imports in small batches to protect Cloudflare Worker stability.
- Prevents duplicates by checking both source SKU and product name.
- Previously imported Pulse items can be refreshed by running the import again.
- Existing manually managed catalogue products are not overwritten.
- New products are inserted into E-Commerce Control as disabled for B2C/B2B with zero prices, so they are not accidentally published before PowerBuild pricing is entered.

## How to use
1. Open **Our Catalogue** as an authorised catalogue administrator.
2. Click **Import Pulse Kitchens**.
3. Leave the catalogue page open while the progress bar runs.
4. When complete, the catalogue refreshes automatically and shows the updated product total.

No D1 migration is required for this update.
