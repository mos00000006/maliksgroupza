EUROFIT PICTURE PATCH — IMAGES FROM YOUR TWO SUPPLIED BROCHURE PAGES

46 PNG files, matched by the supplier code.

INSTALL:
1. Copy public/eurofit/ into the root of your Hub repo.
2. Apply drizzle/0051_eurofit_local_brochure_images.sql to your Cloudflare D1 database AFTER earlier Eurofit imports (0049, 0050). Merely copying the SQL to GitHub does not run it.
3. Build/deploy your Hub (static public image paths become available).
4. Hard refresh catalogue, search E001, E073, M501 and check the actual image.

All image paths are local (/eurofit/...) and use image_key format supported by app/api/catalogue/shared.ts.
The shared Masterbatts and Polycop illustrations do not show a specific size/colour or pipe length.
Only image fields of Eurofit-named rows are updated. Existing R2/uploads are preserved. Previous external static links may be replaced.
IMPORTANT: Uploaded pages are not a full product picture catalogue, so any codes not illustrated here remain unchanged.
The supplied brochure prints CE041 for gully grid only; the image is shared with E140 and must be regarded as representative. Verify against supplier if product-specific photography is required.
