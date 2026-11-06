MALIKS GROUP HUB  |  SIGNATURE POS WORKSTATION STYLE UPGRADE
Version: 2026-11-06

WHAT THIS CHANGES
- Premium navy/gold PowerBuild theme and orange-accent Buster Build theme.
- Clear, compact navigation, quick actions, barcode/product entry, basket and totals.
- Consistent SVG icons without adding npm packages.
- More polished branch and staff identity, checkout summary and responsive layout.
- The large 'demo/preview/no live sales' warning has been replaced by a compact,
  truthful 'Checkout setup required' status.
- No permissions, database migrations, APIs, price files, or real sale logic are changed.

THIS IS A STYLE + COPY PATCH ONLY.
The secure RetailOS transaction service is NOT connected by this patch.
Payment processing, stock deduction, tax invoices, live refunds, settlement,
and till cash-ups are NOT enabled. The final sale button remains disabled.

INSTALL BY COPYING FILES (NO TERMINAL OR GIT REQUIRED TO PASTE)
1. Close or back up your existing Maliks Hub project and keep a copy of:
     app/tills/till-checkout.tsx
     app/tills/tills.module.css
2. Download this ZIP, right-click it and select 'Extract All'.
3. Copy the 'app' folder from this package into the ROOT of your current
   maliksgroupza folder (where package.json is located).
4. Windows: 'Merge folders' > 'Replace files in destination'.
   Exactly these two working POS files are replaced:
     app/tills/till-checkout.tsx
     app/tills/tills.module.css
5. Copy the 'tests' folder as well if you want the optional safety tests.
6. IMPORTANT: Do not copy a 'new-files' folder. This ZIP has none.
7. The file app/tills/pos-preview-domain.mjs from your existing working POS
   installation is still required; do not delete it or its type declaration.
8. Reload /tills in your local Hub after the code is built and/or deployed.

GITHUB
Copying into a local folder does not update the online website. The changed
files must be committed to your repository and GitHub Actions must pass.
You can use the GitHub web editor/upload for the two paths above if Git is not
installed in your VS Code. Back up your original files first.

TESTING PERFORMED ON THE PATCH
- JSX/TypeScript syntax via the TypeScript transpiler
- PostCSS style sheet parsing
- Node pure POS arithmetic tests + signature theme safety tests
- Responsive layout inspected in Chromium at desktop and mobile widths

NOT PERFORMED
- Full Maliks Hub build, GitHub Actions, live deploy, payment terminal,
  live store transaction flow, or real stock/accounting reconciliation.

The screenshot is only an example of the intended design. The patch itself
uses your authorised branch, user name and published Hub price catalogue.
