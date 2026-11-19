MALIKS POS — PHASE 48 — CHROME PRINTING (NO WEBSITE DATE, TITLE OR URL)

Why this patch:
- Chrome printed an A4 webpage with extra date/time, POS title and URL.
- The 40×24 mm content was split over two physical labels.
- Phase 47 required Zebra Browser Print, which is not desired.

Change:
- Stock > Utilities > Labelling now creates a REAL, correctly-sized PDF in Chrome.
- One PDF page = one 40×24 mm (or 50×30 mm) label.
- Each page contains only the branch logo, description, price, stock code/unit, barcode and published Hub QR.
- No browser page headers, page footer, date/time, or maliks-pos URL is in the PDF.
- Works without Zebra Browser Print or any new local installation.
- Stock prices/Hub token and branch access are unchanged.

Installation:
1. Replace maliks-operations/src/stock-labelling-ui.mjs in GitHub.
2. Include maliks-operations/tests/phase48-chrome-label-pdf.test.mjs.
3. Commit/push and run the Deploy Maliks Department Applications GitHub Actions workflow.
4. Open Stock > Utilities > Labelling and search for a product.
5. Click 'Print GK420d Labels (Chrome)'. A PDF opens in a Chrome tab.
6. In Chrome's PDF viewer click Print and select your ZEBRA GK420d (NOT OKI).
7. Set paper to the matching label dimensions and use Actual size / 100%, not Fit.
8. Print ONE test label and scan the QR before bulk jobs.

This is not silent printing: Chrome still displays the PDF and print dialog.
Silent printing requires a local trusted printer bridge or kiosk policy.
A standard PDF has no Chrome webpage headers/footers. If the printer still
spreads one page over multiple physical stickers, verify Zebra driver media
size, calibration and gap detection.

No D1 migrations, secrets or changes to balances.
