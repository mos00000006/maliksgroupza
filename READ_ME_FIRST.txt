MALIKS GROUP HUB — QUOTATION WORKSPACE V3 — LAYOUT REPAIR
06 November 2026

WHAT THIS FIXES
The quotation product list and selected items were overlapping/partly off-screen.
This patch makes the quotation window an independent centred dialog above the Hub.
The catalogue is on the LEFT and document summary on the RIGHT on desktop;
on smaller screens they stack vertically. Customer details and the Send to Cash
Office button remain. The patch does NOT grant additional permissions or
activate payments/stock posting.

INSTALL — DIRECT FILE COPY, NO GIT SCRIPT REQUIRED
1. Back up your current maliksgroupza project folder.
2. Unzip this file into a DIFFERENT temporary folder.
3. Copy the "app" folder into your existing maliksgroupza root (beside package.json).
4. Select Merge/Replace for the following TWO existing files:
   app/tills/till-checkout.tsx
   app/tills/tills.module.css
5. Optionally copy the "tests" folder (it adds ONE new regression test).
6. Do NOT copy a "new-files" folder or reinstall older Sales/Tills patches.
7. Commit/upload these exact updates to your GitHub repository. Copying the
   files into a local folder alone does not update the live GitHub/Cloudflare site.
8. Let your normal GitHub Actions build and tests run before deployment.

IMPORTANT BASELINE
These two replacement files include the quotation-to-Cash-Office handover from
"Maliks_Hub_Quotation_To_Cash_Office_Direct_Paste_Patch.zip". They should only
be applied to a Hub already using that version, with its API and D1 migration.
Do not overwrite newer source edits without reviewing the differences.

WHY SOME ITEMS SAY PRICE UNAVAILABLE
The current catalogue endpoint lists all active products, but only a positively
priced, published product tag for the selected brand/branch can be added to a
quotation. If a product has no published price, the UI keeps it unavailable
instead of creating an invoice/quotation at a made-up amount. This patch is a
layout fix; it does not create, publish or silently override prices.

VERIFICATION
- 22 existing targeted POS/quotation tests passed in an isolated combined source.
- New layout regression tests pass; TSX syntax and CSS parser checks pass.
- Browser layout preview measured at 1650x900, 1280x800 and 760x900. At desktop
  widths the catalogue and selection panels do not overlap or escape the dialog.
- The visual preview shows SAMPLE products/prices, not your actual branch data.
- A full project build and live deployment were NOT run in this environment.

SAFETY
Quotations remain a separate document workflow and can be sent to the Cash Office
D1 queue with a unique reference by authorised staff. Sending does NOT process
payment, issue a tax invoice or deduct stock. Keep live sales locked until the
RetailOS transaction backend has been verified.
