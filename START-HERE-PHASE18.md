# MALIKS POS PROFESSIONAL — PHASE 18
## Hub Catalogue → Stock Master, plus Supplier Invoice Three-Way Matching

**Repository:** `mos00000006/maliksgroupza`  
**Expected baseline:** Phase 16–17 Purchasing / Receiving / GRV / Stock / Transfers, including Phase 15 and its ESLint fix.  
**Status:** Code package for GitHub review and staging deployment. **Nothing in this ZIP has been deployed to your Cloudflare account.**

### Why Stock Master appeared empty

The previous Stock Master screen queried `maliks_pos_master_records`, a **separate branch master table**. Your products are actually stored in the existing Group Hub's `catalogue_products` table. The earlier UI offered only a separate, limited catalogue lookup. It did not populate branch stock master records, so the Stock Master and purchase-order dropdown appeared empty.

### What this patch changes

1. **Stock → Master Files → Stock Master now reads active products directly from the Group Hub catalogue** in the same existing D1 database. It displays all active products, including products without published price tags, in 100-item pages with code/name/category search. It shows whether each item is already linked to the selected branch.
2. **Link Hub catalogue to branch** explicitly creates missing branch stock overlays for active catalogue products, preserving existing branch records, using the existing `maliks_pos_master_records` IDs needed by PO/GRV/transfers. A controlled role, branch assignment, same-origin check, idempotent insert and per-record audit are enforced. This is NOT an opening-stock import. It does NOT create new Hub products or change any stock balances.
3. Hub owns **product code, name, department and current branch selling price**. Selling price is read from the existing published PowerBuild/Buster Build price tags and branch price overrides. POS cannot rename a Hub product; branch settings such as barcode, unit, cost and reorder minimum remain editable for linked stock items. New products must be created in the Group Hub catalogue first.
4. **Purchase Orders** can search for linked stock by code or description, not only the first 100 records. **Link the Hub catalogue to each branch** before trying POs or receiving a transfer at that branch.
5. **Suppliers → Transactions → Invoices and Debit Notes** now opens **Supplier Invoice — Three-Way Match**. Finance captures a supplier invoice against an approved PO and enters invoice date/number, lines, unit costs, declared VAT and supplier invoice total. The system compares each line against approved PO unit cost and **posted** GRV accepted quantities, net of quantities already verified against other invoices. Unmatched invoices are flagged as EXCEPTION; they can be rechecked after a GRV is posted. An **independent** authorised Finance reviewer can verify a matched invoice. Repeated requests, duplicate invoice numbers and over-allocation are controlled with unique keys, transactional SQL and a database trigger.
6. The new supplier invoice register is a **matching/verification register only**. `VERIFIED` does **not** mean posted to creditors, GL, VAT or the bank. Debit notes, supplier payments, supplier statements, legal tax-document attachments, invoice corrections, reversals and month-end remain for later phases.

### Exact files changed

| Path | Action |
|---|---|
| `maliks-operations/src/master-domain.mjs` | Replace — Hub-backed stock master listing and branch link API |
| `maliks-operations/src/supplier-invoice-domain.mjs` | **Add** — supplier invoice capture, three-way match and independent verification |
| `maliks-operations/src/core.mjs` | Replace — secured private API routes and permissions |
| `maliks-operations/src/frontend.mjs` | Replace — Stock Master, purchasing stock search and supplier invoice UI |
| `maliks-operations/sql/phase18_supplier_invoice_matching.sql` | **Add** — additive matching register, allocation trigger and audit schema |
| `maliks-operations/package.json` | Replace — `migrate:phase18` command |
| `.github/workflows/deploy-maliks-operations.yml` | Replace **only if your current workflow is the Phase 16–17 baseline**; otherwise merge the new Phase 18 migration step |
| `maliks-operations/tests/phase13-suite.test.mjs` | Update menu expectations |
| `maliks-operations/tests/phase15-master-files.test.mjs` | Update Hub-backed fixture and keep the ESLint fix |
| `maliks-operations/tests/phase18-stock-catalogue.test.mjs` | **Add** |
| `maliks-operations/tests/phase18-supplier-invoices.test.mjs` | **Add** |

Do not delete or overwrite `src/powerbuild-logo.mjs`, any of your original Hub code, catalogue/price-tag pages, other SQL migrations, existing Cloudflare secrets or existing D1 data. The Sales app remains a separate Worker.

### Install with the patch (recommended)

1. Back up the **actual** GitHub repository and the shared D1 database, with a verified restore method. Use a separate staging D1 database for initial acceptance.
2. Extract the ZIP **outside** the repository, and open the actual repository root in VS Code. Create a review branch, for example `feature/pos-phase18-catalogue-finance`.
3. Run from the repository root, replacing the path with your extracted folder:

```powershell
git apply --check "C:\Users\YOURNAME\Downloads\MALIKS-POS-PHASE18\MALIKS-POS-PHASE18.patch"
git apply "C:\Users\YOURNAME\Downloads\MALIKS-POS-PHASE18\MALIKS-POS-PHASE18.patch"
cd maliks-operations
npm install
npm test
cd ..
npm run check
```

**If `git apply --check` fails, stop.** Your code has diverged from the baseline; do not force-apply or replace whole folders. Share the error and your current `maliks-operations` source ZIP for a targeted merge.

**Alternative:** Copy only the files from the ZIP's `.github/` and `maliks-operations/` folders into the matching repository paths, reviewing existing-file diffs first. Never create a second nested `maliks-operations` folder.

### Deploy

1. Confirm all tests and the root lint/check are green. **Do not deploy if either fails.**
2. Commit/push the reviewed branch, merge to `main` when approved.
3. GitHub → Actions → **Deploy Maliks Department Applications** → **Run workflow**. Confirm the existing Worker names.
4. The workflow applies `sql/phase18_supplier_invoice_matching.sql` after Phase 17 and **before** the Core Worker deploy. All earlier migrations must already be present.
5. Verify `maliks-pos` and `maliks-core-api` deployments, Access login and branch permissions. The Sales, Tills, Cash Office and Dispatch Workers must still be accessible and isolated.

### Safe acceptance test (staging / TEST records only)

1. Open Maliks POS → Stock → Master Files → **Stock Master**. The list should show your active Group Hub catalogue products **before** any branch link. Search by an existing Hub product code.
2. Click **Link Hub catalogue to branch**. Verify the count and that linked items now have branch stock IDs. Repeat; it must create **zero new** records. Switch branch and repeat only for authorised branches. No stock quantity must change.
3. Confirm that changing a product's name or selling price in Hub (test product only) appears in the POS Stock Master after refreshing, without duplicating the product.
4. Open Suppliers → Purchase Orders; search for a linked Hub product. Create/approve a **TEST** PO with an independent approver.
5. Count, verify and post a TEST GRV with different authorised staff, confirming damaged goods are excluded from accepted stock.
6. Open Suppliers → Transactions → **Invoices and Debit Notes**. Capture a TEST supplier invoice with the correct posted GRV quantity and PO cost. Check status **MATCHED**, then verify using a **different Finance user**. Confirm status **VERIFIED** and exactly one allocation, with no creditor/VAT/GL entry.
7. Attempt an invoice exceeding the posted GRV or at a different unit cost: it must be **EXCEPTION** and cannot be verified. Try duplicate invoice number, cross-branch access and a second invoice that would exceed remaining posted GRV quantity.

### Verification and limitations

- **38 targeted tests passed** for the Phase 13/15/16/17/18 menu and domain flows in the reconstructed local workspace. Node syntax checks passed for all changed `.mjs` files.
- The reconstructed local workspace was assembled from previous ZIPs rather than fetched from your current GitHub repository. Its **full** historical test suite includes six older Phase 9/10/policy test failures due to mismatches between old fixtures and later code. Therefore **a clean full-suite result has NOT been established for your current repository**. The deployment must wait until `npm test` and root `npm run check` pass in your real checkout.
- No live Cloudflare/D1 migration, live browser sign-in or production posting was performed. Browser automation was unavailable in this environment.
- **Opening stock, sales stock deduction, stock adjustments, returns and physical stock takes are still missing.** On-hand values are NOT reconciled company stock.
- **No supplier creditor balance, input VAT claim, double-entry GL journal, payment or statutory tax invoice is created.** These require the next financial phase, approved legal-entity/VAT details, opening balances and reversal controls.

**Next planned phase:** Creditors ledger and controlled AP/GL postings, supplier payments and reconciliations, then debtors/GL/VAT and month-end. This Phase 18 patch must be accepted first.
