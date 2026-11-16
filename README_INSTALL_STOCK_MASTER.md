# MALIKS POS Professional — Stock Master branch grid & double-click editing

## Installation

This is an incremental patch for the **Maliks POS All Departments Professional Redesign** version used in this conversation. It does not replace the POS, Sales, Tills, Cash Office or Dispatch applications.

1. Back up your current GitHub branch / create a separate feature branch.
2. Extract the patch at the **repository root** (`maliksgroupza`) so that the `maliks-operations/src/` and `maliks-operations/tests/` paths merge with the existing folders.
3. Replace the matching files:
   - `maliks-operations/src/master-domain.mjs`
   - `maliks-operations/src/frontend.mjs`
   - `maliks-operations/tests/phase15-master-files.test.mjs`
   - `maliks-operations/tests/phase18-stock-catalogue.test.mjs`
   - `maliks-operations/tests/stock-master-branch-grid.test.mjs` (new)
4. Run `cd maliks-operations && npm test`. This patched source passed **193 tests / 0 failures** in the local run.
5. Commit and push to GitHub and wait for the full GitHub checks. Deploy only after review.

If you have changed these files in GitHub since the earlier department redesign patch, **merge these changes** rather than overwriting them blindly. A unified diff is included for reference.

## What changes

- **Stock → Stock Master** immediately lists the selected branch's active Group Hub products with columns: Code, Description, Category, Selling price, On hand, Unit, Status and Action.
- **Selling price** is the published price from Hub's existing PowerBuild/BusterBuild price-tag and branch price tables. Unpublished prices are marked **Not published**, not shown as fake R0.00.
- **On hand** comes from the branch-matched `maliks_pos_stock_balances` table, linked to `maliks_pos_master_records` and the Hub catalogue. Quantities use **three-decimal** unit precision; values are displayed only for linked stock. Unlinked items show an em dash, not an invented zero.
- Double-click a **linked** item (or press Enter on a focused row or select **Edit settings**) to open the existing, audited branch-settings editor. It opens at the top and hides the Stock Master list until you return.
- The editor shows the currently selected branch's price and recorded on-hand, both as read-only reference values. The editable fields remain the authorised branch settings (unit, barcode, cost and minimum stock level, and active/inactive status).
- Where authorised, **Open Stock Adjustment / Stock Take** opens the existing independently approved stock-control workflow.
- Searches, pagination, role permissions, optimistic record versioning and audit trails are preserved.
- The unchanged existing PowerBuild logo and existing premium navy / gold brand theme remain in use.

## Important accounting and stock safeguards

- **No direct on-hand edits.** Quantities are changed only through posted GRV, transfer, or independently approved Stock Adjustment/Stock Take flows.
- **No price or description overwrites in POS.** Change these in Group Hub catalogue / Price Tag Studio, so the master catalogue remains authoritative.
- **POS ledger limitation:** as the current application warns, POS sales stock deductions and returns are **not yet integrated**. Displayed figures are recorded operational stock quantities, not guaranteed physical or fully reconciled stock. Existing stock that has not been counted or posted may show 0 until opening stock is properly processed.
- The existing **Phase 17 stock ledger migration** (`maliks_pos_stock_balances`) must already have been applied to the Core D1 database; this patch introduces **no new tables or migrations**.
- The preview file is a self-contained **sample-only demonstration**; no figures or prices in it should be treated as live branch data.

## Validation

- 193 local Node tests passed, including new checks for branch-specific selling prices, branch stock balances, unauthorised branch access and front-end double-click code.
- Chromium DOM interaction test passed with sample products: table rendering, price, on-hand, double click, read-only price, branch switching and no page JavaScript errors.
- **Live Cloudflare deployment and real-branch reconciliation were not performed.**
