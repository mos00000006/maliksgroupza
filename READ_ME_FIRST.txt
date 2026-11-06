MALIKS GROUP HUB — LIVE INVENTORY ENGINE V9
===========================================

WHAT THIS PATCH CHANGES
-----------------------
Inside your EXISTING Store Operations > Stock Control & GRVs workspace,
a new "Live inventory ledger" menu item provides:
- Verified opening-stock loads, one SKU at a time or up to 100 at a time pasted from Excel.
- Separate branch balances per catalogue SKU (to 3 decimal places).
- Live, audited balance changes ONLY after an authorised document approval.
- GRV: received quantity minus rejected quantity increases source-branch stock.
- Stock count and adjustment: approved physical quantity reconciles on-hand balance;
  a stale system quantity causes approval to fail. Do not double-adjust the same variance.
- Supplier return: approved quantity reduces stock, never below zero.
- Transfer: approval removes sending branch stock and marks goods in transit;
  a distinct authorised receiving person acknowledges receipt, then stock is added
  to the receiving branch. Both branches must be activated and their SKUs initialised.
- Immutable ledger of opening entries, approvals and transfer receipts.
- Failure/duplicate protection: a failed posting rolls back the document approval
  and stock changes together. Approvals cannot be replayed.

IMPORTANT: Not connected to existing ERP balances, Tills/Sales stock deductions,
external TOUCH365, purchasing accounts, cost values, VAT, GL or invoicing. This is a
new INDEPENDENT inventory ledger inside the Hub. Do not use it as the official
financial inventory source until reconciled and integrated. Units are per catalogue
SKU base unit; verify box/each/m2 and other units before importing.

INSTALLATION — DIRECT PASTE
---------------------------
1. BACK UP your existing maliksgroupza folder. BACK UP the D1 database separately.
2. Extract the ZIP, open the top-level folder, and COPY these into maliksgroupza:
       app/
       drizzle/
       tests/
       public/
   Merge folders and replace the matching Stock Operations files.
   DO NOT replace other screens, and DO NOT delete existing files.
3. Run npm run check and npm run db:migrate:local on a development copy.
   Check the stock module at /stock-operations and import TEST SKU balances.
4. Review the migration drizzle/0057_stock_inventory_ledger.sql and take a
   Cloudflare D1 production backup/snapshot BEFORE running the remote migration.
5. When authorised to deploy, apply migration 0057 using your EXISTING remote
   migrations workflow (npm run db:migrate:production) then deploy the Hub.
6. After deployment, open Store Operations > Stock Control & GRVs >
   Live inventory ledger. Choose a store and verify opening balances first.

ACTIVATING A BRANCH IS A SEPARATE CONTROLLED STEP. Migration 0057 does not
turn on live posting for any branch and does not back-post historic documents.

HOW TO LOAD OPENING STOCK
-------------------------
- Use the signed physical count / verified opening system report as your source.
- Admin enters one SKU, or pastes lines from Excel (max 100 rows per batch):
      PRODUCT CODE,QUANTITY
      TC0298,50
      TC0301,12.5
- Both commas and TAB-separated columns are accepted.
- Enter the signed opening count/import reference, then save the batch.
- Opening records cannot be altered or imported twice for the same branch/SKU.
- For genuine corrections AFTER opening, create a Stock Adjustment request,
  submit it, then have a different authorised manager approve it.
- Once opening stock is complete and reconciled for the branch, use the phrase
  ACTIVATE LIVE STOCK with the signed source reference to activate the branch.
- After activation, missing SKU opening records BLOCK approval; import those SKUs
  before resubmitting. A missing SKU is never silently assumed to be zero.
- Only Owner / Admin or Developer / Technical Admin can import or activate.
- Other authorised stock staff can view branch ledger and do their assigned work.

STAFF WORKFLOW
--------------
Receiving staff: create and submit GRV. Different authorised manager approves:
GRV increases on-hand quantity ONLY for an activated branch.
Stock Controller: create count/adjustment with correct system qty.
Manager: approve; stale counts and stock shortages reject the transaction.
Transfers: sending branch approves shipment -> source decreases; receiving branch
acknowledges -> destination increases. Only relevant assigned receiving/transfer
staff or branch managers can accept a transfer; creator/reviewer cannot receive it.

WHAT IS NOT INCLUDED
--------------------
- No sales invoices or automatic deductions from Sales / Tills.
- No legacy stock import/reconciliation from TOUCH365 (manual verified baseline only).
- No supplier invoice/PO matching, accounting or stock valuation.
- No role-based financial GL posting, barcode scan integration or UOM conversions.
- No partial receipt of a transfer. Do not activate stores without operational
  agreement on base quantity and unit-of-measure conventions.
- No deployment was performed by this patch.

VERIFICATION
------------
42 targeted Node.js checks passed locally (including the original printed A4,
stock-specific document templates, permission contracts and SQLite posting logic).
TypeScript/TSX syntax transpilation passed. The FULL GitHub npm run check and
actual Cloudflare D1 migration must still run in your project.
