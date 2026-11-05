MALIKS GROUP HUB — SINGLE PRODUCT TAG: SIX PER A4
===================================================

What changed
------------
Under Price Tag Studio > Single product tag > 4. Print & share:
- Generate individual catalogue tags as before (product photo, pricing, branch, QR).
- New "Download A4 picture (6 tags)" button exports ONE 2480 x 3508 px JPG
  with up to six tags on an A4 portrait sheet (2 columns x 3 rows).
- Preview the A4 sheet before downloading.
- Each queued product can be set to 1-6 copies using "A4 copies".
- If you queue more than six total tags/copies, use Previous/Next A4 to
  download one JPG per sheet.
- The existing separate JPG and original 150x100mm print options remain.

Installation
------------
This ZIP is a SMALL PATCH, not the entire 337 MB website.
Extract its app/ and tests/ folders into your existing maliksgroupza project
folder, preserving paths and replacing the two existing files.

Replaced:
  app/price-tags/price-tag-generator.tsx
  app/price-tags/price-tags.module.css
New:
  app/lib/a4-single-tag-layout.ts
  tests/a4-single-tag-layout.test.mjs

Alternatively apply the separate .patch file at your project root:
  git apply price-tag-a4-six-pack.patch

No D1 migration or product database changes are required.
Use your existing build/deployment workflow to put the website update live.

Notes
-----
Because 6 tags must fit on one A4 page, each is approximately 94 x 63 mm,
smaller than the existing standalone 150 x 100 mm tag.
The exported JPG includes the product pictures, prices, logos and QR codes.
Verify QR readability with a phone on a printed sample before mass printing.
Changes have been source-checked and pagination tests passed in isolation;
full website build and live deployment were not run in this environment.
