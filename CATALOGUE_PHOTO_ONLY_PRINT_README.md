# PowerBuild Wholesale Catalogue — photo-only A4 print patch

**Prepared:** 16 November 2026  
**Target:** `maliksgroupza` / Maliks Group Hub catalogue  
**Scope:** the Hub catalogue, downloadable wholesale PDF and interactive leaflet. **The separate POS is not modified.**

## What changes

1. The Hub catalogue page requests `photosOnly=1`, so products without an image key do not appear in the catalogue. Product cards whose image URL fails to load are also hidden, rather than showing a broken image/placeholder.
2. The catalogue PDF **verifies each image by downloading and decoding it**. Only products with working image content are included; image failures cannot produce blank image cards or empty category sections.
3. The interactive leaflet uses the same photo-only image validation.
4. The PDF is **A4 portrait, 300 DPI (2480 × 3508 pixels)**, with **two columns and three rows (six products per page)**. Product photographs, names and stock codes are larger. Interior pages have a printer-safe footer, consistent PowerBuild branding and a multi-page, two-column contents index with accurate page numbers.
5. New catalogue products must be supplied with a picture.

## Important data safety

No catalogue products are deleted from D1. No migrations are required. The `photosOnly=1` condition is intentionally **opt-in for catalogue browsing and export**: buyer search, stock orders, POS and other uses of the catalogue API keep their existing product access. This avoids silently removing stock items that may be needed at tills.

## Files to copy

Unzip the patch into the **root of your existing `maliksgroupza` GitHub project**, keeping the folder paths and replacing the existing files:

- `app/api/catalogue/route.ts`
- `app/catalogue.tsx`
- `app/catalogue-pdf.ts`
- `tests/catalogue-photo-print.test.mjs` (new regression checks)

**Do not copy the extracted files into a second `app` folder.** The ZIP already has the correct relative paths.

## Check and push

From your project folder in VS Code terminal / PowerShell:

```powershell
npm run check
git add app/api/catalogue/route.ts app/catalogue.tsx app/catalogue-pdf.ts tests/catalogue-photo-print.test.mjs
git commit -m "Hide products without photos and improve printable catalogue PDF"
git push origin main
```

If you are working on a different branch, push that branch instead of `main`. Allow your usual Cloudflare deployment to complete; there is no database migration for this patch.

Then open **Hub → Catalogue → Download wholesale division PDF**. Choose **A4 / Portrait** and print at **Actual Size / 100%** if your printer supports the PDF's safe margins (otherwise choose **Fit to printable area**).

## Verification performed

- `tsc --noEmit` passed for the PDF module and catalogue grouping module.
- Six independent Node regression checks passed.
- A Chromium-rendered real PDF was exported from the updated TypeScript code using 15 actual image files from this archive, plus one blank and one deliberately broken image. The final PDF contained the 15 photographed products, **six A4 pages**, and no missing-image cards.
- All six PDF pages were checked for A4 dimensions; the product page, contents page and cover were visually rendered and reviewed.

## Limitation

This is a code patch, not a modification of your live Cloudflare D1 database or R2 bucket. The exact count of products hidden in production cannot be confirmed from the uploaded code ZIP alone. Existing image references that are missing from R2 or fail externally are excluded from the PDF when it runs, and broken images are hidden on the webpage when detected by the browser. The separately supplied **sample preview PDF is an example**, not an export of your complete live catalogue.
