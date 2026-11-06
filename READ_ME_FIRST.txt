MALIKS GROUP HUB — POWERBUILD STOCK DOCUMENT A4 PRINT V4
==========================================================

GOAL
Correct the existing Store Operations > Stock Control > Open document > Print
result. The sample GRV was printing on two pages with very little information
and with an A5 landscape page rule.

THIS PATCH INCLUDES ONLY:
  app/stock-operations/stock-operations.tsx
  app/stock-operations/stock-operations.module.css
  public/stock-operations/powerbuild-logo.png
  tests/stock-print-a4.test.mjs

INSTALL
1) Back up the two existing stock-operations UI files, if you customised them.
2) Extract the ZIP.
3) Copy its app, public and tests folders into the project root maliksgroupza.
4) Select Merge / Replace files. Do NOT replace the main Store Operations dashboard.
5) Commit / push, let GitHub checks pass and allow deployment.
6) Open Store Operations > Stock Control & GRVs > Open the GRV.
7) Select "Print register copy · PowerBuild A4". Print settings: A4, portrait,
   scale 100%, turn OFF "Headers and footers". Background graphics ON is
   recommended for the blue/yellow table and divider.

WHAT IS CHANGED
- Branded PowerBuild A4 document, with logo.
- Clean reference, supplier, branch, product table, delivery details,
  signatures and approval history.
- Uses the SAME recorded GRV data: no hardcoded products or quantities.
- On-screen editing/review dialog and backend are unchanged.
- A normal three-line GRV prints on one page (verified).
- Very long GRVs can legitimately continue to later pages rather than
  cutting off products, notes or the approval audit.

NOT CHANGED
No database changes, no backend migration, no permissions change,
no stock posting, and no alterations to Sales/Tills or other documents.

The browser print dialog may add its own URL and page count if the
"Headers and footers" setting is on. Turn that browser option off.
