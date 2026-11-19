MALIKS POS — PHASE 50: TWO-ACROSS PORTRAIT STICKER FIX

WHY THE PREVIOUS PATCH SPLIT THE PRICE:
The uploaded photograph shows TWO tall/narrow stickers side by side on one backing row.
The old 40 x 24 mm LANDSCAPE page printed the artwork across both stickers.
Rotating the page moved the problem but could not correct that mismatch.

WHAT CHANGED:
* Added a 'Two portrait stickers side by side (your roll)' format, selected by default.
* Generates a full ROW PDF and confines ONE product design to each narrow sticker.
* Packs two different product labels (or two copies) across each row. If you print
  one label, the second position stays empty.
* Added measured size controls: one sticker width, one sticker height, gap between.
* Default ESTIMATE (not measured): 24 mm wide x 40 mm high with 2 mm gap.
  This creates a full 50 mm wide x 40 mm high PDF page.
* For this format disables the previous 90-degree compensation setting.
* Price, logo, stock text, barcode and QR use portrait-specific placement.
* Chrome PDF contains no POS webpage date, POS title, domain or footer.

INSTALL:
1. Replace maliks-operations/src/stock-labelling-ui.mjs in GitHub.
2. Add maliks-operations/tests/phase50-two-up-sticker.test.mjs.
3. Commit and push. Run 'Deploy Maliks Department Applications'.
4. In Stock > Labelling select 'Two portrait stickers side by side'.
5. MEASURE one real sticker's width and height AND the gap; enter those in mm.
6. In GK420d Windows Printing Preferences create/select a stock whose PAGE WIDTH
   equals 2*(one sticker width) + gap, and PAGE HEIGHT equals one sticker height.
   E.g. 24x40mm stickers and a 2mm gap => media page 50x40mm.
   Print PDF at Actual size / 100%, with automatic rotation and fit-to-page OFF.
7. Print ONE test item. It should stay entirely inside the LEFT sticker.
   With two copies, it should fill both stickers in one row.
8. If alignment is off, correct the measured dimensions / driver media, not
   the barcode/QR code itself. Calibrate gap sensing on GK420d for row gaps.

LIMITATION:
Actual sticker/roll dimensions cannot be measured accurately from a photo.
The 24x40+2 preset is a provisional estimate. The Windows Zebra driver must
also match the full two-across roll width; web code cannot override its driver.
Barcodes/QR on very narrow media may be difficult to scan at 203 dpi and require
physical validation or omission of the barcode if necessary.

No database migration. No stock balances, invoices or user permissions changed.
