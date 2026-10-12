# Original wholesale catalogue import - 12 October 2026

This update consolidates the original PowerBuild Wholesale Division PDF into the live Company Hub catalogue.

## Included
- 323 source-derived catalogue records represented by the original wholesale catalogue pages.
- 202 high-resolution product image crops bundled under `public/wholesale-products/`.
- Explicit Tommy Fix and aluminium-window product codes from the source are retained as catalogue codes.
- Where the source did not show a stock code, the Hub uses an import-safe `WHPDF-...` code so the product can exist in the catalogue without pretending it is an ERP stock code.
- Existing catalogue products with the same explicit code are not duplicated; a bundled source image is attached only when the live product has no image already.
- User-uploaded catalogue images continue to take priority over bundled source images.

## PDF download
- The old **Download original PDF** control has been removed.
- Only **Download wholesale division PDF** remains.
- The wholesale PDF continues to build from all active Company Hub catalogue products, so the imported source products are automatically included.

## Static images
Bundled source images use an `image_key` beginning with `static:`. The catalogue API converts those keys to the corresponding public asset URL. Editing a product and uploading a new image replaces the bundled image normally.

## Verification
A clean SQLite migration test using the existing prepared-stock migration plus this import produced 794 catalogue rows in total, with 323 products linked to bundled wholesale-source images.
