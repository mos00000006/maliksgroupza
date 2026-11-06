MALIKS GROUP HUB | SALES / CHECKOUT - SIGNATURE DESIGN V3
=========================================================
Direct-paste style update to the EXISTING Sales / Tills module

WHAT CHANGES
- Premium active-sale header with compact product, total and draft stats.
- Barcode/product lookup and a permanent right-hand payment summary are higher up.
- Park, Retrieve, Quotation, Sales order, Lay-by and Refund shortcuts now use compact tiles.
- Consistent navy / gold (PowerBuild) and navy / orange (Buster Build) palette.
- Better spacing and mobile/compact desktop layouts.
- Empty-basket Park action now shows an error instead of a green success notice.
- Quotation catalogue modal, Cash Office quotation number workflow, and Hub switch remain intact.

FILES THIS PATCH REPLACES
  app/tills/till-checkout.tsx
  app/tills/tills.module.css

OPTIONAL NEW REGRESSION TEST
  tests/tills-checkout-v3-layout.test.mjs

INSTALL - NO SCRIPTS, NO Git REQUIRED FOR COPYING
1. Save a backup of your current project or these two app/tills files.
2. Extract this ZIP.
3. Open your current 'maliksgroupza' folder containing 'package.json'.
4. Copy the ZIP's 'app' folder into the project ROOT and choose MERGE.
5. Confirm REPLACE ONLY the matching TWO files under app/tills.
6. (Optional) Merge the 'tests' folder.
7. To update the website, COMMIT and PUSH changes to GitHub (or upload both files via
   the GitHub website). Copying locally does NOT automatically update GitHub.
8. Confirm GitHub Actions 'npm run check' passes, then deploy to your test environment.

IMPORTANT
- This patch assumes your current app/tills screen already has the quotation catalogue
  picker, quotation-to-Cash Office workflow, and branch permissions installed.
- Do NOT replace 'worker', 'app/page.tsx', customer data, .env files or migrations.
- No 'new-files' directory is included.
- This only improves the user interface. Actual till sale posting, invoice issuance,
  receipts, stock movements and payment processing stay DISABLED until RetailOS
  financial services and hardware are securely integrated and tested.
- The design preview is static illustrative HTML using the real CSS, not a screenshot
  of a deployed live till.

VERIFICATION
- 28 targeted tests on the combined project snapshot passed.
- TypeScript/TSX parsing and CSS parsing passed.
- Static layout visually checked at 1650px, 1280px and 760px.
- Full Hub GitHub Actions / Cloudflare deployment was NOT run in this environment.
