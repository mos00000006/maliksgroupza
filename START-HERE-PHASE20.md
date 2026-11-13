# MALIKS POS PROFESSIONAL — PHASE 20
## Operational Stock Control: Opening Counts, Adjustments, Stock Takes & Reports

**Repository:** `mos00000006/maliksgroupza`  
**Required baseline:** Phase 19 Member Team code, plus all Phases 15–18 and the Phase 16–17 missing-files correction where applicable.  
**Status:** Local patch only. Not installed in GitHub, Cloudflare or production D1.

### What becomes functional

- **Stock → Transactions → Stock Adjustments:** branch stock controller records a signed increase/decrease and reason; an **independent** authorised manager approves/post or cancels. Negative stock is rejected; no quantity changes at draft stage.
- **Stock → Transactions / Utilities → Stock Take:** receiving/count staff capture a physical count and a stock snapshot; a different manager approves the reconciliation. If stock changes after counting, approval is rejected until recounted.
- **Stock → Utilities → Opening Stock Count:** capture a physically verified initial quantity **only for items with no previous posted movement**; an independent manager approves it. For existing items, use Stock Take instead. This does not import old stock from Kerridge/TOUCH or post financial opening balances.
- **Stock → Reporting → Onhands / Transactions:** posted GRV, transfer, adjustment, stocktake and opening-count movements are combined in the operational movement list. Branch quantities reflect those postings.
- **Stock → Reporting → Stock Valuations / Re-Order / Master:** branch-scoped operational reports. Valuations are *indicative only* using stored cost prices, and do not post GL or stock valuation accounting.
- **Stock → Master Files → Categories / Units / Barcodes:** read-only Hub-linked stock details; cost and minimum-stock settings remain branch Stock Master settings.
- **Stock search / reports:** 150-item pages, explicit page numbers and code/description search to reach items beyond the first 150.
- **Unbuilt menu options are disabled**, rather than opening the generic "function is not live yet" popup. This is not a claim those functions work.

### What is NOT live

Sales invoice stock deduction, customer returns, supplier returns/credits, stock valuation accounting, creditor payments, supplier AP posting, debtors balances/receipts, VAT claims/returns, full GL, journals, bank reconciliation, cash-up and month-end remain outside this patch. Those functions require their own ledger, approval, reversal, numbering and reconciliation implementations. Do not use POS as the authoritative trading stock system or statutory accounting system yet.

### Files

- `.github/workflows/deploy-maliks-operations.yml` — apply Phase 20 migration before Worker deploy
- `maliks-operations/package.json` — `migrate:phase20` command
- `maliks-operations/sql/phase20_stock_control.sql` — new additive stock-control tables, audits and movement ledger
- `maliks-operations/src/stock-control-domain.mjs` — secured stock-control APIs
- `maliks-operations/src/inventory-domain.mjs` — combined movement reporting and pagination
- `maliks-operations/src/core.mjs` — new Core routes
- `maliks-operations/src/frontend.mjs` — working screens and management-only proxy routes
- `maliks-operations/tests/phase17-inventory-flow.test.mjs` — existing test fixture updated for Phase 20 migration
- `maliks-operations/tests/phase20-stock-control.test.mjs` — new stock control tests
- `MALIKS-POS-PHASE20.patch` — alternative reviewable patch against Phase 19 baseline

### Safe installation

1. Confirm Phase 19 is installed, and the GitHub deployment has passed `npm test`, `npm run config`, and all previous D1 migrations. `CF_ACCESS_AUD_MEMBER` must be configured. If Phase 19 has not deployed, fix it **first**.
2. Make a backup Git commit and **restorable Cloudflare D1 backup**. Use a staging D1/Workers environment for first acceptance testing.
3. Extract this ZIP outside the repository.
4. **Option A (reviewable):** from your repository root run:

   ```powershell
   git switch -c feature/phase20-stock-control
   git apply --check "C:\Users\YOURNAME\Downloads\MALIKS-POS-PHASE20-INVENTORY-LIVE\MALIKS-POS-PHASE20.patch"
   git apply "C:\Users\YOURNAME\Downloads\MALIKS-POS-PHASE20-INVENTORY-LIVE\MALIKS-POS-PHASE20.patch"
   ```

   If `git apply --check` fails, **STOP**: your current source has diverged. Send the current repository ZIP or the failed paths for a merge. Do not overwrite newer code.

5. **Option B (manual):** merge the ZIP's `.github/` and `maliks-operations/` folder contents into the same folders at repository root. Do not create nested duplicate folders; do not overwrite newer local modifications blindly.
6. Run:

   ```powershell
   cd maliks-operations
   npm install
   npm test
   node --check src/stock-control-domain.mjs
   node --check src/core.mjs
   node --check src/frontend.mjs
   cd ..
   npm run check
   ```

7. Only if checks pass, commit/push to GitHub and run **Actions → Deploy Maliks Department Applications**. The updated workflow applies `phase20_stock_control.sql` before deploying the Core Worker.
8. Verify the migration and all Worker deployments are green. Confirm existing Member Team, Sales, Tills, Cash Office and Dispatch still operate.

### Controlled acceptance test

1. In the Hub, confirm a sample product is active. In POS **Stock Master**, link the Hub catalogue to your test branch if needed.
2. Open **Stock → Utilities → Opening Stock Count**, record 10 test units and a signed physical-count reason as a Receiving Clerk. Check that on-hand is still zero until approved.
3. Sign in as a **different** Store Manager, approve and post the count. Verify on-hand becomes 10 and an `OPENING` movement is recorded.
4. Record a Stock Take of 8 units with the counting user. Approve with another manager; on-hand becomes 8 and a `STOCKTAKE -2` movement is recorded.
5. As Stock Controller, draft a -2 Stock Adjustment; have an independent manager approve. On-hand becomes 6.
6. Try an adjustment of -20 and confirm it fails atomically without changing the balance.
7. Try to approve your own draft, use a different branch, reuse a request ID for changed content, or approve a stale stocktake; all must fail.
8. Check the Stock Valuations and Re-Order reports. They are indicative, not GL.

### Verification performed on the packaged source

- **164/164 Node automated tests passed** in the assembled Phase 19 + Phase 20 source, including seven Phase 20 stock control tests.
- New SQL migration rerun in SQLite; Node syntax checks passed.
- Chromium smoke test with mocked session/inventory API opened the new Stock Adjustments screen without browser JavaScript errors.
- `git apply --check` passed against the Phase 19 baseline.
- **Not** tested: production Cloudflare deployment, real D1 migration, authenticated Cloudflare Access end-to-end or your root repository's ESLint check.

### Rollout control

Do not perform opening-stock or stocktake postings against live operational quantities until the physical count, Hub product mapping, stock source of truth and migration/reconciliation process are approved. Sales stock deductions are not yet connected, so operational on-hand will diverge as sales happen.
