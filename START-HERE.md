# Maliks Operations — Phase 5: Cash Office Shift Review & Exception Queue

This is the **next incremental update after Phase 4** for the four independent departmental Workers, **not** the management Hub. It is not a live payment, invoice, stock, bank-deposit or cash-up reconciliation feature.

## What you get

- **Cash Office** shows 75 latest branch shifts, including counts of closed shifts awaiting review and shifts flagged for follow-up.
- Cash Office can open a **closed** shift and record an independent observation: **Declaration checked (not reconciled)** or **Flag for follow-up**. A flag must include a reason (10–400 characters).
- Reviews have reviewer identity, time, comment, decision and immutable history. Additional review events do not overwrite previous ones; the most recent decision is shown in the queue.
- A Cash Office user **cannot review a shift they themselves opened**. There is no edit to the cashier's opening float or closing count.
- **Tills:** retains Phase 4 shift register and Phase 3 quotation search; no new tills transaction capability.
- **POS:** retains Phase 2 quotation workflow. **Dispatch:** remains non-transactional. PowerBuild logo remains.
- All reads/writes are branch-restricted on the central API; separate Cloudflare Access AUDs remain in use.

## Before installing (important)

1. **Verify Phase 4 was actually deployed** and its `maliks_till_shift_register` D1 table exists. An earlier chat did not confirm the Phase 4 deployment. If Phase 4 was never deployed, apply the previous Phase 4 package first, including its database migration, and confirm that Tills can display its shift register. **Do not deploy Phase 5's Core without its schema.**
2. Check that `MALIKS_GROUP_D1_DATABASE_ID` points to the existing `maliks-group-hub-db`. Do not recreate the shared database.
3. Take a restorable D1 backup or Time Travel bookmark, test in a staging environment if available, and deploy when no one is relying on prototype departmental apps.
4. Confirm names of the five department Workers. They should not overwrite the existing `maliks-group-hub` Worker.

## GitHub files in this ZIP

Place these files at the exact paths in `mos00000006/maliksgroupza` — do **not** create another `maliks-operations` directory inside it.

| Path | Action |
|---|---|
| `maliks-operations/src/core.mjs` | Replace; adds private Cash Office review API and branch enforcement |
| `maliks-operations/src/frontend.mjs` | Replace; adds Cash Office queue, review form and history |
| `maliks-operations/src/review-domain.mjs` | Add; validations and parameterised queries |
| `maliks-operations/sql/phase5_cash_office_reviews.sql` | Add; creates one table and two indexes |
| `maliks-operations/package.json` | Replace; adds `migrate:phase5` command |
| `maliks-operations/tests/phase4.test.mjs` | Replace; updates Cash Office screen expectations |
| `maliks-operations/tests/phase5.test.mjs` | Add; tests review validation, role isolation and routes |
| `.github/workflows/deploy-maliks-operations.yml` | **Reference file only**. Prefer adding the single Phase 5 step below instead of overwriting any custom workflow changes. |

Do **not** replace `maliks-operations/scripts/make-config.mjs` (your earlier working Cloudflare domain fix), `src/powerbuild-logo.mjs`, any repository secrets or any Maliks Group Hub source files.

## GitHub workflow: add ONE new step

In `.github/workflows/deploy-maliks-operations.yml`, find the existing lines around Phase 4:

```yaml
      - name: Apply additive till-shift D1 schema (Phase 4)
        run: npm run migrate:phase4
      - name: Deploy central API — private Worker
        run: npm run deploy:core
```

Insert between them:

```yaml
      - name: Apply additive cash office review D1 schema (Phase 5)
        run: npm run migrate:phase5
```

Both migrations must run **after** `npm run config`, **before** Core deployment. Phase 5 uses `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`. It does not update, delete or overwrite previously posted records.

If Phase 4's migration step is missing, **stop and install Phase 4 correctly first**. Do not skip the Phase 4 database requirements.

## Run and test

1. Commit these changes to GitHub. Confirm `npm test` is green (52 passing local tests in this package).
2. GitHub → Actions → **Deploy Maliks Department Applications** → **Run workflow**. Select `main`, confirm Worker names (these are **updates** to your departmental Workers), tick the checkbox and start a **new run**.
3. Check Phase 4 and Phase 5 migrations are green, followed by Core, POS, Tills, Cash Office and Dispatch deployments.
4. Open `https://maliks-cash-office.moyanamoses006.workers.dev/` and refresh (Ctrl+Shift+R). Look for **PHASE 5 — CASH OFFICE REVIEWS**.
5. Using **separate test accounts**, open and close a till shift in Maliks Tills as a test cashier (Phase 4); sign in as a *different* Cash Office reviewer at the same branch. Confirm the closed shift appears as **Not reviewed**.
6. Choose **Review**, select **Flag for follow-up** and write a test reason. Save, refresh and confirm the flagged status and immutable review history. Add a second review noting the outcome and confirm the first event remains in history.
7. Verify a different branch cannot see the record; the original cashier cannot review their own shift; and none of the applications now show a real payment/invoice/dispatch control.

**Do not enter live tender, customer transactions or real till cash counts.** This prototype stores review and shift records in your shared database, but has no accounting/reconciliation foundation.

## Technical checks

- 52 Node.js tests passed.
- Source and embedded browser scripts passed `node --check`.
- SQL migrations applied twice on SQLite without replacing data; tested request-id retries, branch isolation, checks against open shifts and self-review, and latest-status query.
- No Cloudflare live deployment or actual production data verification was performed by this package.

## Next architectural milestone

Implement a production payment ledger and cashier reconciliation only after agreeing on transaction states, tender types, receipt/invoice numbering, VAT posting, refunds/reversals, closing balance calculations, atomic writes, and stock/dispatch release rules. That needs a separate fully tested release.
