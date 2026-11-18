PHASE 45 — GK420d SINGLE-ROLL-STICKER PRINT CORRECTION

Fixes the printout where part of the label appeared on one sticker and the QR/barcode on another.

Files
  maliks-operations/src/stock-labelling-ui.mjs
  maliks-operations/tests/phase43-stock-labelling.test.mjs
  maliks-operations/tests/phase44-stock-label-layout.test.mjs
  maliks-operations/tests/phase45-gk420d-roll-print.test.mjs

Changes
- 40 x 24 mm now prints ONE sticker per page (was incorrectly 80 x 24 mm / 2 across).
- 50 x 30 mm remains ONE sticker per page.
- Each sticker is a separate page with fixed exact media dimensions and zero CSS margins.
- Hidden POS page chrome, fixed print host flow, and unchanged price / QR / barcode data.
- Waits briefly for the branch logo to be decoded before opening Chrome Print.
- On-screen instructions for disabling Chrome's browser-generated print headers and footers.

INSTALL
1. Extract ZIP and overwrite the matching files in your current GitHub repository.
2. Commit and push; run Deploy Maliks Department Applications workflow if required.
3. Once deployed, hard-refresh Stock > Utilities > Labelling.
4. Select 40 x 24 mm for your actual roll. In Windows Zebra GK420d printer preferences set label width 40 mm and height 24 mm, Portrait.
5. In Chrome Print > More settings, switch OFF Headers and footers, select Margins = None, Scale = 100%, and the correct GK420d paper size. Chrome-generated date/time, webpage title and URL cannot be forcibly removed by webpage code while this setting is enabled.
6. Test with ONE sticker and scan the printed QR. The small 40x24 label may produce dense QR codes; if scanning is unreliable, use physically larger 50x30 stock.

No database migration, new permissions or accounting changes. No live worker deployment performed by this archive.
