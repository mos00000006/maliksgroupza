MALIKS GROUP HUB — INTEGRATED STORE OPERATIONS / STOCK CONTROLS (V2)
==================================================================

IMPORTANT: Your existing "Store Operations" in Maliks Group Hub is NOT removed
or replaced. This update adds one "Stock Control & GRVs" entry INSIDE it.
Do not add a second "Stock Operations" item to your main Hub sidebar.

INSTALL — DIRECT PASTE WITH ONE SAFE NAVIGATION COMMAND
-------------------------------------------------------
1. Make a backup of your existing maliksgroupza project and D1 database.
2. Extract this ZIP. Copy the app, drizzle, tests, docs, and scripts folders into
   the corresponding folders in your existing maliksgroupza project (merge).
   This adds NEW files and does NOT overwrite app/operational-view.tsx,
   app/page.tsx, Sales/Tills, or any of your existing Store Operations tasks.
3. In VS Code terminal opened at the ROOT of maliksgroupza, run:
       node scripts/integrate-stock-into-store-operations.mjs
   The script inserts one Stock Control card inside your EXISTING Store Operations.
   Running it again does nothing. If your Store Operations source has changed,
   the script refuses to overwrite it; inspect before attempting manual changes.
4. Apply the new 0056 migration to a disposable local D1 test database FIRST:
       npm run db:migrate:local
   Verify the repository's actual package.json scripts before running production
   migrations. Do not apply any migration number that is already in production.
5. Check the project:
       npm run check
       npm run build
6. Back up remote D1, review the SQL, migrate it using your existing verified
   production workflow, then commit and deploy.

OPEN IT
-------
Existing Hub -> Store Operations -> "Open Stock Control".
Direct URL after deployment: /store-operations/stock

Owner/Admin must assign existing employees stock duties per branch inside
Stock Control -> Staff permissions before non-manager staff can use them.

FUNCTIONS
---------
Receipts/GRVs, stock adjustments, counts, returns to suppliers, transfers,
numbered control documents, review/approval, print copies and an audit register.
Original Store Operations task boards, store checklists and workspaces remain.

CRITICAL LIMITATION
-------------------
These are DOCUMENT CONTROL and APPROVAL workflows, not a live stock ledger.
Approved GRVs and adjustments DO NOT yet increase/decrease actual stock, post
supplier invoices or accounting entries, or authorize dispatch. Keep TOUCH365
as the operational stock record until proper inventory integration is completed.
Do not use this as a live GRV-posting replacement yet.

Files expected to overlap with previous Stock Operations V1 (if installed):
app/api/stock-operations/*; app/stock-operations/*;
drizzle/0056_stock_operations_control_register.sql;
tests/stock-operations-*.test.mjs
These should have the same backend migration and document controls as V1.
The V2 navigation adds only the new child route and safe integration script.
The old /stock-operations URL may remain if V1 was previously deployed, but
staff should use Store Operations -> Stock Control & GRVs instead.
