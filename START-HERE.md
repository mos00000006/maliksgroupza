# Maliks Operations — Phase 12: 80mm Thermal Printing

## Purpose

Use the Epson TM-T20III or comparable **80mm thermal receipt printer** at Sales and Tills instead of A4 paper.

- **Sales / POS:** Print a PowerBuild-branded 80mm **QUOTATION — NOT PAID** immediately after saving a quotation; reprint from My Recent Quotations.
- **Tills:** After confirming Cash/Card checkout, print a PowerBuild-branded 80mm **PAID INVOICE / RECEIPT**; reprint from My payments.
- **Cash Office:** Keeps the existing A4 **internal paid invoice** for office use.
- **Dispatch:** Keeps the existing A4 picking slip for warehouse staff. New paid-order alerts remain unchanged.

This is a **printing-only patch**. It does not post payments, change stock, update the database schema or modify the separate Maliks Group Hub. It builds directly on Phase 11 (Phase 10 checkout plus Phase 11 A4 invoice/Dispatch printing).

## What to upload to GitHub

Repository: `mos00000006/maliksgroupza`, branch `main`.

Upload or replace these exact paths from the ZIP:

1. `maliks-operations/src/frontend.mjs` — **REPLACE** (the Phase 11 version must be in the repo first)
2. `maliks-operations/tests/phase11.test.mjs` — **REPLACE** (only label expectation updated)
3. `maliks-operations/tests/phase12.test.mjs` — **ADD**

Do not replace `src/core.mjs`, `src/payment-dispatch-domain.mjs`, `src/powerbuild-logo.mjs`, the deployment workflow or the database migrations. If your live repository has custom modifications after Phase 11, use the included Git patch as a **reviewable diff** and merge changes instead of overwriting them blindly.

## Deploy

1. In GitHub, commit the three files to `main`.
2. Open GitHub Actions → **Deploy Maliks Department Applications**.
3. Start a **new** workflow run. Confirm the existing department Worker names after checking they refer to the intended applications.
4. Wait for the successful run, then refresh POS and Tills with **Ctrl+Shift+R**.
5. Sales/POS: create a **TEST** quotation; click **Print 80mm quotation slip**. You can also reprint a quotation from history.
6. Tills: use an already confirmed **TEST** invoice and click **Reprint 80mm PAID receipt**. To test the immediate print button, use a controlled test checkout; do not submit actual payments or release real goods until your deployment is approved for production.
7. Cash Office: ensure **Print A4 PAID customer invoice** remains available. Dispatch: ensure **Print picking slip** still uses A4.

## Epson TM-T20III setup — EACH Sales/Tills PC

The printer supports **80mm roll paper** with an approximately **72mm-wide printable area** (576 dots). Phase 12 uses a 72mm receipt layout and calculates the height dynamically to avoid a fixed-length A4 sheet.

In Windows, install/select the Epson printer driver, set **paper width 80mm**, and use the correct roll-paper/receipt paper profile. In Chrome/Edge's print dialog select:

- Destination: your Epson TM-T20III
- Paper size: 80mm roll or the receipt-paper option provided by its driver
- Scale: 100% (not “Fit to page”)
- Margins: None
- Headers and footers: Off
- Print in grayscale/monochrome (standard thermal printing); logo is rendered in high-contrast grayscale

The browser cannot reliably select the printer or cut paper automatically; use the installed printer/driver's settings. Print a single test receipt and adjust the driver paper profile if needed. For truly silent, direct ESC/POS printing, a separate local print agent/integration is required later.

## Print safety and legal status

- QUOTATION slips clearly say **NOT PAID**. They are not authorisation to collect goods.
- Tills' PAID slips fetch the **confirmed** invoice from the authenticated, branch-restricted `/api/invoices` endpoint; an unconfirmed quotation cannot be printed as paid by changing screen text.
- The paid receipt is an **INTERNAL PAID SALES RECEIPT**, not a statutory South African VAT tax invoice. Company registered details and VAT number must be added and reviewed before using this as an official tax invoice.
- No cash/card settlement checks, stock deductions, paid-status changes or Dispatch release actions are performed by printing.

## Verification

- **106 Node tests passed**.
- **Four generated browser scripts passed Node syntax checks**.
- Automated live-browser printing was unavailable in the execution environment; a real Epson hardware print test and live Cloudflare deployment check are still needed.
- No new Cloudflare secrets, D1 migrations or GitHub variables required.
