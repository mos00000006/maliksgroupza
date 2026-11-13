# MALIKS POS PROFESSIONAL — PHASE 15: Working master files

**Repository:** `mos00000006/maliksgroupza`  
**Expected baseline:** Phase 14 PowerBuild-corrected, separate Maliks Sales release.  
**Deployment status:** Code prepared and locally tested; **NOT** deployed to your GitHub, Cloudflare Workers or live D1 database.

## What now works after deployment

- **Stock → Master Files → Stock Master:** Search, create, edit, activate/deactivate branch-specific stock master records. Fields include code, name, unit, category, barcode, cost, selling price and minimum stock level. Includes a separate **read-only search of existing, published PowerBuild/Buster Build catalogue products**. It does not change those existing catalogue products or price tags.
- **Suppliers → Master Files → Suppliers:** Create, edit, search and activate/deactivate supplier master records, with contact, VAT and payment terms.
- **Debtors → Master Files → Debtors:** Create, edit, search and activate/deactivate debtor master records, with contact, credit limit and payment terms.
- **Stock/Suppliers/Debtors → Reporting → Audits:** View the last 50 append-only create/update events for the assigned branch.
- All writes use the existing Cloudflare Access JWT, **separate management app identity**, branch assignment, server-side role permission, origin validation, idempotent request IDs, record versions to prevent stale overwrites, and atomic D1 record/audit batches.
- **Maliks Sales remains separate** and cannot use these management APIs. Tills, Cash Office and Dispatch remain unchanged.

**IMPORTANT:** This is the first functional layer, not a complete ERP. Other buttons still show their not-live warning. Master records are in **new tables**; they do **not** automatically feed the Sales catalogue, purchase orders, stock-on-hand, GRVs, invoice balances, payments, VAT, GL, dispatch or month-end. Do not treat them as an operational stock ledger or receivables/payables ledger. No customer funds or inventory movements are posted by this phase.

## Database changes

The new additive migration `maliks-operations/sql/phase15_master_files.sql` creates:

- `maliks_pos_master_records` — branch-scoped records, unique type/branch/code, revision and request IDs
- `maliks_pos_master_audit` — actor, time, before/after values and request ID for each write

It does **not** modify existing Hub, catalogue, quotation, till, payment or dispatch tables. It is safe to rerun because it uses `CREATE TABLE/INDEX IF NOT EXISTS`, but **back up the existing D1 database and verify the restore procedure first**. Prefer a staging database for acceptance testing.

## How to install in your GitHub repository

### Option A — safest: review/apply the patch in VS Code

1. Make a backup/commit of your current code and create a new Git branch (for example `feature/pos-master-files`).
2. Extract the ZIP **outside** the repository.
3. Open the **actual `maliksgroupza` repository root** in VS Code. The root must contain `maliks-operations/` and `.github/`.
4. In the VS Code terminal, run the following commands, replacing the patch path with its actual location:

   ```powershell
   git apply --check "C:\Users\YOURNAME\Downloads\MALIKS-POS-PHASE15-MASTERFILES\MALIKS-POS-PHASE15.patch"
   git apply "C:\Users\YOURNAME\Downloads\MALIKS-POS-PHASE15-MASTERFILES\MALIKS-POS-PHASE15.patch"
   cd maliks-operations
   npm install
   npm test
   cd ..
   git status
   ```

   **If `git apply --check` fails, STOP.** Your deployed source differs from the Phase 14 baseline. Send the error and the current source ZIP; do not overwrite files blindly.

### Option B — copy the exact files

Extract the ZIP and copy the **contents of its `.github/` and `maliks-operations/` folders** into the matching folders at the root of the GitHub repository. Preserve all paths and merge folders. Do **not** create a second nested `maliks-operations/` directory. Review the workflow file before replacing it if you have customized it since Phase 14.

## Deploy

1. Confirm a restorable D1 backup and approved staff permissions.
2. Commit and push your new branch, then merge to `main` when reviewed.
3. Open GitHub → **Actions → Deploy Maliks Department Applications → Run workflow**. Confirm the existing Worker names as required.
4. The workflow runs `npm test`, creates the Worker configs, applies all existing migrations plus the **new Phase 15 master-file migration**, then deploys Core, POS, Sales, Tills, Cash Office and Dispatch.
5. Open `https://maliks-pos.moyanamoses006.workers.dev` and log in.
6. Select your assigned branch → Stock → Master Files → Stock Master → **New item**. Create a **test-only** record such as `TEST-P15-001`. Edit it, verify the updated version, and open **Reporting → Audits**.
7. Repeat a test record in Suppliers and Debtors. Confirm users without a matching role cannot create/edit; confirm records do not appear in another branch.
8. Confirm Maliks Sales and other department Workers still function and POS `/api/quotes` is still blocked.

**Permissions:** Owner / Admin, Developer / Technical Admin, Operations Manager, Store Manager and Regional Manager can maintain the three master files in their authorised branches. Specific Stock, Purchasing, Finance and Debtors roles are limited to their own areas. Full-company EXCO is read-only. Staff need an active Hub account and valid branch assignment.

**Cloudflare Access:** This release keeps the existing `CF_ACCESS_AUD_POS` audience for both Sales and the POS management frontend; the private Core distinguishes the two by its server-injected app identity. No new Access secrets are introduced. If you have since split POS and Sales into **different Access audience IDs**, do not deploy without reconciling that configuration first.

## Verification performed on this code package

- **129 Node tests passed**, including real SQLite tests of the new migration, create/update, branch isolation, duplicate prevention, audit, optimistic locking, role restrictions and separate POS/Sales API proxying.
- `node --check` passed on the new source modules and on the generated browser script.
- No live Cloudflare deploy, login, D1 write or end-to-end browser acceptance test has been performed.

## Next implementation sequence

1. Stock departments/categories/units and supplier links; purchase orders and approvals.
2. Blind receiving, GRV capture, manager verification, label printing, branch transfers and stock movement ledger.
3. Debtors/suppliers opening balances, allocations, journals, statements and reconciliations.
4. Double-entry GL, VAT control, cash-up, end-of-day and month-end with immutable audit and reversal rules.
5. Dispatch release/POD and Head Office branch consolidation and reports.

Do not activate financial posting by hiding a warning message. Each transaction must be implemented and tested with permissions, atomic database writes, reversal controls and reconciliation.
