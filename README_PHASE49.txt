MALIKS POS PROFESSIONAL — PHASE 49 — GK420d STICKER ORIENTATION / SINGLE-LABEL FIX

Observed problem:
- The label was printed 90 degrees sideways; price, barcode and QR were split
  over two adjacent 40 × 24 mm physical stickers.
- This is consistent with a landscape PDF being rotated to portrait by the
  Windows Zebra printer settings. No webpage date/title/URL is in the PDF.

This patch:
- Adds Stock > Labelling > 'GK420d print orientation'.
- Default: 'Fix sideways labels (recommended for your printer)'.
  Generates a 24 × 40 mm portrait PDF page with clockwise-compensated artwork.
  A driver that rotates portrait artwork counterclockwise to the landscape roll
  should produce upright content on ONE physical 40 × 24 mm sticker.
- Alternative settings: Standard landscape / Opposite 90-degree correction.
- One PDF page still equals one product sticker (40 × 24 or 50 × 30 physical).
- Retains PowerBuild / Buster Build logos, branch price, barcode, QR token,
  quantity, and access controls.
- No date, time, POS title, or maliks-pos domain is in the sticker.
- Uses Chrome's normal PDF printing (no Zebra Browser Print installation).

INSTALL IN GITHUB
1. Replace maliks-operations/src/stock-labelling-ui.mjs from this ZIP.
2. Add maliks-operations/tests/phase49-gk420d-orientation.test.mjs.
3. Commit/push; run 'Deploy Maliks Department Applications'.
4. Refresh POS > Stock > Utilities > Labelling.

IMPORTANT ONE-TIME PRINTER SETTINGS (THE WEBSITE CANNOT SET THESE)
1. Windows > Printers & scanners > Zebra GK420d > Printing preferences.
2. Set the actual paper/stock to the physical label dimensions 40mm wide x
   24mm in feed length (or the dimensions actually measured on your roll).
   Use gap/web sensing for a roll with gaps between stickers.
3. Run the printer media-gap calibration if it feeds past one sticker.
4. Select the Zebra GK420d (not OKI) from Chrome's PDF print dialog.
5. Set 'Actual size' / 100%; disable 'Fit to page'.
6. Print one sticker with the DEFAULT correction selected.
7. If the output is rotated in the opposite direction, choose the 'Opposite
   rotation' setting. If your Windows driver is set correctly for landscape,
   choose 'Standard landscape (no correction)'.
8. If the PRINTED PAGE STILL SPANS TWO STICKERS, the Windows printer stock
   length/orientation or GK420d media calibration must be corrected; a browser
   PDF cannot force the physical printer's settings.

VALIDATION
- Focused tests: 13 passed (Phase 44/45/47/48/49 sets).
- Generated PDFs inspected: standard 40x24mm; compensated 24x40mm; one page
  per sticker; printed content is on that page and no headers/URL are embedded.
- Physical GK420d driver output must be checked with one test sticker.

No database migrations or changes to stock quantities/accounts.
