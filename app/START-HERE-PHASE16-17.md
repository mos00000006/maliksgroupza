# MALIKS POS PROFESSIONAL — PHASES 16 & 17
## Purchasing → Receiving → GRV → Stock-on-Hand → Branch Transfers

**Project:** `mos00000006/maliksgroupza` (the existing Maliks Group Hub / department Worker repository)
**Base:** Phase 15 Master Files + its ESLint fix. **Status:** local code package; not deployed.

### What is implemented

| Menu | New workflow | Server-side control |
|---|---|---|
| Suppliers / Stock → Purchase Orders | Create PO draft with supplier and branch stock lines, submit, independent approve/reject, cancel, search and audit | Store assignment, role checks, independent approver, version checks, UUID request idempotency |
| Stock → Goods Received Vouchers (GRV) | Receiving Clerk counts accepted vs damaged/rejected goods against approved PO; independent Receiving Manager verifies; separate GRV Clerk posts | No unapproved PO, no accepted quantity above ordered, no duplicate delivery note on a PO, atomic D1 posting |
| GRV follow-up | Record who printed labels, who labelled stock, and Store Manager GRV-pack check with timestamps | Must occur after GRV posting and in order; different actors for key stages |
| Stock → Reporting → Onhands | Stock balance and movement register by branch | GRV and transfer movement ledger; no negative balances |
| Stock → Stock Transfers | Source creates draft, independent manager sends and deducts stock, destination receiving staff confirms and increases stock | Valid active destination branch, matching stock codes, separate users, no negative stock, atomic D1 batch |

**Not implemented:** supplier invoice posting, accounts payable, VAT input claims, general ledger, creditor payments, opening stock upload, stock adjustments, stock take, sales stock deduction, customer returns, POD, delivery gate release, physical label printing, document attachments, and statutory document generation. The existing Sales, Tills, Cash Office, Dispatch and Hub code is otherwise unchanged.

### Critical stock warning

The new `maliks_pos_stock_balances` table starts at **zero**. It only reflects **GRVs posted through this workflow and inter-branch transfers recorded here**. Existing store stock, prior GRVs, sales, returns and adjustments are **not** imported or deducted. Therefore the new on-hand screen **must not be treated as the company's true live stock position** until opening stock, all movement types and reconciliation are completed. This is a controlled pilot for test data, not authorisation to trade live.

PO values are estimated costs and **do not post VAT, supplier invoices or general ledger entries**. GRV posting changes the new operational balance only.

### Before deployment

1. Verify the **Phase 15** master-file patch and the `phase15-master-files.test.mjs` ESLint correction are present. Do not skip Phase 15.
2. Create a GitHub backup/branch. Back up the shared `maliks-group-hub-db` Cloudflare D1 database using a restorable method; ideally test on staging D1 first.
3. Extract this ZIP **outside** the repository, then copy its `.github/` and `maliks-operations/` contents to the matching paths in the repository root. Merge folders. Do not create a nested ZIP folder under the repo. If files changed after Phase 15, **merge the diff rather than overwrite later changes**.
4. Do not replace the original Group Hub, the `maliks-operations/src/powerbuild-logo.mjs` logo, or your GitHub secrets. Do not disable Cloudflare Access.

### Changed / new files

| File | Change |
|---|---|
| `maliks-operations/src/purchase-domain.mjs` | **New** — purchase order APIs |
| `maliks-operations/src/inventory-domain.mjs` | **New** — receiving, GRV, stock and transfer APIs |
| `maliks-operations/sql/phase16_purchase_orders.sql` | **New** — purchase orders and audit |
| `maliks-operations/sql/phase17_inventory_flow.sql` | **New** — receipt, stock and transfer schema |
| `maliks-operations/src/core.mjs` | **Update** — private API routes and permissions |
| `maliks-operations/src/frontend.mjs` | **Update** — real POS menus/screens and protected proxy routes |
| `maliks-operations/src/policy.mjs` | **Update** — receiving / GRV department roles |
| `maliks-operations/package.json` | **Update** — migration commands |
| `.github/workflows/deploy-maliks-operations.yml` | **Update** — migrate phases 16 and 17 before Core deployment |
| `maliks-operations/tests/phase16-purchase-orders.test.mjs` | **New** — PO tests |
| `maliks-operations/tests/phase17-inventory-flow.test.mjs` | **New** — inventory workflow tests |
| `maliks-operations/tests/phase13-suite.test.mjs` | **Update** — reflects activated inventory menus |
| `maliks-operations/tests/phase15-master-files.test.mjs` | **Update** — carries forward the ESLint fix |

### Local checks

From the `maliks-operations` directory, use Node 22.13+:

```powershell
npm install
npm test
node --check src/core.mjs
node --check src/frontend.mjs
node --check src/purchase-domain.mjs
node --check src/inventory-domain.mjs
```

From the **repository root**, run `npm run check` if your Hub root has that script. Existing lint warnings are not fatal; any ESLint **error** must be resolved before deployment.

**Local verification of this package:** 140/140 Node automated tests passed, including independent approvals, partial receipts, damaged stock exclusion, duplicate delivery notes, idempotent retries, transfer stock rollback, and branch restrictions. A Chromium DOM smoke test opened the four new screens without JavaScript page errors. These checks do not substitute for a staging Cloudflare/D1 test.

### GitHub deployment

1. Commit the changes to a review branch and check `npm test` and root `npm run check`.
2. In GitHub Actions run **Deploy Maliks Department Applications** using a **new** workflow run. Confirm the Worker names if they are the known existing Workers.
3. The workflow runs Phase 15, Phase 16 and Phase 17 additive migrations **before** deploying the private Core Worker and frontend Workers. Do not deploy Core separately before migrations succeed.
4. Check that both migration steps succeeded, then that `maliks-pos` and `maliks-core-api` deploy successfully.
5. Verify Cloudflare Access sign-in, store assignment and permissions. Keep the original Sales Worker separate.

### Safe test sequence — use TEST products and quantities only

1. Create one Supplier Master and matching Stock Master in **Branch A**. Create the same Stock Master code in **Branch B** for transfer receipt.
2. In **Suppliers → Purchase Orders**, create PO with 5 units. Submit as Buyer; approve using a **different** manager login.
3. In **Stock → GRV**, count 3 accepted and 1 damaged against the PO, entering delivery note, driver and supplier invoice reference. Verify with a different Receiving Manager login; post with a separate GRV Clerk login.
4. Confirm Branch A **Onhands = 3** for that item; damaged stock must not be added. Confirm receipt and stock audit entries.
5. Confirm labels printed, mark labelled using a separate receiving login, then complete Store Manager pack check.
6. Create a 2-unit transfer from A to B. A different manager sends it; verify Branch A balance falls to 1. Destination receiving staff confirms receipt; verify Branch B balance rises to 2.
7. Attempt a transfer exceeding available balance and verify **no movement is posted**. Confirm the transfer stays a draft.
8. Test a user without the required branch/role: their write actions must be rejected.

**Roles:** Buyer/Purchasing Manager creates POs; Store/Operations/Purchasing Manager approves independently. Receiving Clerk counts, Receiving Manager verifies, GRV Clerk posts, receiving staff labels, Store Manager checks the pack. Stock Controller creates transfers; an independent manager sends; receiving staff at destination accepts. Owner/Admin permissions remain subject to independent-actor checks. Your Hub must have these role names available in staff assignments; if it does not, the staff role-selection interface needs updating before roll-out.

### Next stage: financial modules (not in this ZIP)

1. Supplier invoice capture and **three-way match** (approved PO, verified/posted GRV, supplier invoice), with price/quantity variances and duplicate invoice checks.
2. Creditor subledger and controlled **double-entry** postings, input VAT treatment, reversals, and supplier statement reconciliation.
3. Supplier payments, bank matching and approval; then debtors invoicing, receipts, credits and age analysis.
4. Group chart of accounts, branch GL, trial balance, VAT reporting, month-end and audit controls.

Do not enable live AP, VAT or GL posting until the legal entities, VAT registrations, chart of accounts, invoice numbering and opening balances are approved and tested.
