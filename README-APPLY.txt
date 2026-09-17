POWERBUILD / MALIKS GROUP HUB
STORE SPECIALS PAYLOAD TOO LARGE FIX V3

REPLACE ONLY:
  app/store-specials.tsx

WHAT THIS FIXES
---------------
The "Payload Too Large" error when creating a Store Special with large phone photos.

New behaviour:
- Promotion images are resized/compressed in the browser BEFORE upload.
- Maximum long edge: 2200px.
- Large images are converted to high-quality JPEG at 84% quality.
- Already-small PNG files can remain PNG.
- The total prepared image batch is kept below 8 MB.
- Up to 12 images can be selected at once.
- The form shows when pictures are being prepared.
- It also shows the final prepared upload size.
- Create & notify stores is disabled until image optimization finishes.

The slideshow still uses the uploaded high-resolution images and changes every 5 seconds.

No backend/API file needs replacing.
No D1 migration.
No GitHub secret.
