MALIKS GROUP HUB — PROFESSIONAL RETAIL POS WORKSTATION
=====================================================

READY-TO-PASTE UPGRADE FOR THE SALES / TILLS SCREEN THAT IS ALREADY WORKING.
Version: 2026-11-05 (preview workstation)

WHAT YOU ARE GETTING
--------------------
An original, professionally styled Maliks RetailOS till workstation benchmarked
against the advertised TOUCH365 Professional functional areas, without copying its
source code or user interface.

The application already uses your Hub's authenticated /tills page and approved
branch list. This patch replaces ONLY the checkout UI and stylesheet, and adds
local calculation utilities and a targeted test. It does not replace or modify
app/page.tsx, worker/index.ts, app/api/access.ts, any D1 data or credentials.

HOW TO INSTALL — WINDOWS FILE COPY (NO TERMINAL NEEDED TO COPY)
--------------------------------------------------------------
1) Make a backup of the complete currently working maliksgroupza folder.
2) Extract this ZIP OUTSIDE the Hub folder, for example Downloads.
3) Open the extracted ZIP and copy the 'app' and 'tests' folders.
4) Paste them into the ROOT of your current 'maliksgroupza' folder, where
   package.json is. Windows should MERGE folders. Choose REPLACE for the
   existing two UI files under app/tills only.
5) IMPORTANT: Do not create another 'new-files' folder. Older installation
   packages used new-files/app/tills as a staging folder. If it still exists,
   check that your real app/tills files exist, then remove only obsolete staging
   copies that generate the historical ESLint errors. Leave unrelated files.
6) Copying to your PC does NOT publish to GitHub or deploy the online Hub.
   You must commit/upload those FIVE updated/new files to your actual GitHub
   repository and let GitHub Actions pass before a new website deployment.

FILES IN THIS ZIP (exact paths relative to Hub root)
----------------------------------------------------
  app/tills/till-checkout.tsx        REPLACE existing checkout screen
  app/tills/tills.module.css        REPLACE existing POS styling
  app/tills/pos-preview-domain.mjs  NEW safe ZAR/VAT/tender calculations
  app/tills/pos-preview-domain.d.mts NEW TypeScript definitions
  tests/tills-premium-preview.test.mjs NEW automated preview safety tests

CURRENTLY WORKING — IN PREVIEW MODE
-----------------------------------
- Maliks-branded desktop and tablet responsive POS experience, theme changes
  for PowerBuild vs Buster Build branch.
- Cashier assignment and full-access switching remain delegated to the
  already-installed Hub authentication and route security code.
- Branch published catalogue prices / name and code search; exact code scan.
  Existing Hub price API is used; do not infer physical stock quantities.
- Basket with add/remove, fractional unit quantities, line totals and totals.
- ZAR amount handling and 15% VAT-inclusive display.
- Park/retrieve preview baskets (IN-MEMORY ONLY; erased on page refresh).
- Local demo quotation and sales order drafts (NOT issued legal documents).
- Lay-by percentage/deposit calculator (no payments or stock reservation).
- Preview split tender for cash/card/EFT, change and outstanding amount.
- Delivery vs collection selection (does not create delivery notes).
- Printable preview document marked NOT AN INVOICE / NO LIVE SALES.
- Price / product enquiry, keyboard shortcuts F2/F4/F6/F8.
- Customer, trade account, loyalty, dispatch, cash office, reports and
  permissions overview, with restricted integration status.

NOT IMPLEMENTED OR ENABLED IN THIS PATCH
----------------------------------------
Actual sale, card transaction, cash receipt, stock write, invoice numbering,
VAT journal posting, customer/trade-account lookup, real discounts/price
changes, lay-by creation, refunds, voids, dispatch/POD, stock reservation,
loyalty redemption, drawer pulses, real cash shifts/end of day or report data.
Those require authenticated server-side APIs, transactional PostgreSQL
RetailOS integration, D1/ERP migration decisions, branch certification,
printer testing and supervisor approval controls. They cannot be safely
implemented by swapping a React component or adding a button.

VERIFICATION PERFORMED
----------------------
- 15 targeted node tests passed together (10 pre-existing Hub permission tests
  and 5 preview tests) using the prior Hub patched source fixture.
- TypeScript TSX syntax parsed without errors.
- A lightweight TypeScript module check passed using local type stubs.
- CSS parsed successfully with PostCSS.
- This DOES NOT constitute a successful full 'npm run check', Vue/Next build,
  live Hub deployment or real POS transactional acceptance test.

TEST AFTER COMMITTING THE FILES
-------------------------------
  npm run check
  npm run build

REMINDERS
---------
- Do not paste 'new-files' or reapply old Sales / Tills access patches.
- If your current app/tills/page.tsx does not exist, install the earlier
  Sales / Tills permissions integration first. This ZIP is a UI overlay only.
- No Git credentials, private keys, .env or database exports are in this ZIP.
- If GitHub still reports errors under new-files/app/tills, the obsolete
  staging folder is still tracked. Copying into app/tills will not delete it.
