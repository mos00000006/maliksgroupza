MALIKS GROUP HUB — SALES / TILLS PRODUCT PICKER PATCH
Version: 6 November 2026

PURPOSE
When a cashier clicks QUOTATION, SALES ORDER or LAY-BY, open a searchable,
paginated list of the active products in the Maliks Group Hub catalogue.
The selected branch determines the published price. The right-hand pane
shows chosen items, editable quantity, VAT and the draft total.

WHAT IS INCLUDED
app/tills/till-checkout.tsx              — premium POS UI plus product picker
app/tills/tills.module.css               — responsive large product picker styles
app/api/tills/catalogue/route.ts         — secured, paginated browse endpoint
tests/tills-catalogue-picker.test.mjs    — regression checks

INSTALL — NO INSTALLER SCRIPT
1. Make a backup of the CURRENT GitHub-connected Maliks Hub folder.
2. Download and extract this ZIP on your computer.
3. Open the extracted patch, select the "app" and "tests" folders and COPY.
4. PASTE into the REAL maliks-group-hub / maliksgroupza project root,
   the same folder that contains package.json.
5. Let Windows MERGE matching folders and REPLACE matching files.
6. Do NOT copy the old "new-files" staging folder from earlier patches.
7. Upload/commit these changes to your GitHub repository. Just copying
   files to your PC does not update the GitHub Actions build or online Hub.
8. GitHub Actions should run "npm run check". Do not deploy if it fails.

HOW STAFF WILL USE IT
1. Sign into the Hub as an assigned Sales / Tills user, or as a full-access user.
2. Open Sales / Tills and select the authorised branch.
3. Click QUOTATION, SALES ORDER or LAY-BY.
4. The product list opens automatically, starting with ALL active items.
5. Use the search box or department filter, and Next/Previous to see more.
6. Click Add; choose quantity in the right-hand draft panel.
7. For a quotation/order, click Save draft to retain it during the session.

DETAILS & PROTECTION
* 36 products per page (prevents downloading thousands of items to each till).
* All active products are visible. Products without a published, positive
  brand/branch price are labelled 'Price not published' and cannot be added.
* Branch assignments and roles are checked BEFORE any database query.
* Quote/order/lay-by product selection uses a SEPARATE document basket,
  preventing it from accidentally altering the current checkout basket.
* The existing barcode search and full-access 'Switch back to Hub' control
  remain available.
* No new database migrations or dependencies are required.
* Refunds are NOT enabled from an arbitrary product list; an original sale
  and authorised reversal service are required for that feature.

SAFETY
These remain LOCAL, UNISSUED drafts. The patch DOES NOT enable real payments,
final quotations, invoice posting, cash drawer control, stock deductions or
customer accounts. Connecting RetailOS securely and testing end-to-end are
still prerequisites for a live till.

VERIFICATION
- 14 targeted POS and product-picker checks passed (including legacy tests).
- TypeScript/TSX parser: no syntax errors.
- CSS parser: no syntax errors.
- Paginated SQLite query: tested for branch override, unpriced items,
  category filtering, and exact code lookup on a synthetic catalogue.
- Full GitHub / Cloudflare build: not run here. Must pass in your repository.

COPY ONLY THESE PATCH FILES. DO NOT REPLACE YOUR ENTIRE HUB SOURCE ZIP.
