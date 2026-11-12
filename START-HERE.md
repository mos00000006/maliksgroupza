# Maliks Operations — Phase 4: Till Shift Register

**This is an incremental update based on Phases 2 and 3**, not a replacement for the current Maliks Group Hub. Nothing is deployed by downloading this ZIP. Use your existing department deployment workflow.

## Result

- **Tills:** Open a shift with a till code and opening float; close it with a manually counted cash amount and optional notes. Each entry is stored in the existing central D1 database with authenticated cashier, branch and timestamps.
- **Cash Office:** Read-only branch-wide shift list (up to 75 recent). Cash Office cannot open or close a shift.
- **Security:** Cloudflare Access + server-side app roles + branch assignments. Unique SQL constraints prevent two open shifts on the same till or more than one open shift per cashier. Repeating a request with the same request ID is safe to retry.
- **POS:** Still Phase 2 visually (quotation release); not changed by this feature.
- **Tills / Cash Office:** Display Phase 4. Includes Phase 3 exact quotation search if that was not applied yet.
- **Dispatch:** Still separate and remains a non-transactional shell.

**Not live accounting:** No sales are settled; no invoice, receipt, payment, drawer event, cash-up reconciliation, GL journal, tax posting or stock movement is created. Opening float and closing count are cashiers' recorded declarations only.

## Before touching the production database

1. Check that the department workers (especially Core) are the five names you previously verified: `maliks-core-api`, `maliks-pos`, `maliks-tills`, `maliks-cash-office`, `maliks-dispatch`.
2. Confirm your GitHub secret `MALIKS_GROUP_D1_DATABASE_ID` points to the existing `maliks-group-hub-db` database. Do **not** create a new database.
3. Take a restorable D1 backup / Time Travel bookmark through Cloudflare. Prefer testing the schema in staging first.
4. Schedule this deployment when no one is using the prototype departmental apps.

## Files to upload in the GitHub repository

From the extracted ZIP, copy to the **same paths** in `mos00000006/maliksgroupza` (no extra nested directory):

| Path | Action |
|---|---|
| `maliks-operations/src/core.mjs` | Replace |
| `maliks-operations/src/frontend.mjs` | Replace |
| `maliks-operations/src/quote-domain.mjs` | Replace (includes Phase 3 exact lookup; safe if already present) |
| `maliks-operations/src/shift-domain.mjs` | Add |
| `maliks-operations/sql/phase4_till_shift_register.sql` | Add |
| `maliks-operations/package.json` | Replace to add the migration script |
| `maliks-operations/tests/phase3.test.mjs` | Add if missing |
| `maliks-operations/tests/phase4.test.mjs` | Add |
| `.github/workflows/deploy-maliks-operations.yml` | Add the single migration step described below; see reference workflow |

DO NOT replace: `maliks-operations/scripts/make-config.mjs` (your fixed team-domain config), `src/powerbuild-logo.mjs`, existing secret settings, or the separate Maliks Group Hub files.

## Workflow edit — one step only

In `.github/workflows/deploy-maliks-operations.yml`, locate:

```yaml
      - run: npm run config
      - name: Deploy central API — private Worker
```

Insert this line **between** those two steps:

```yaml
      - name: Apply additive till-shift D1 schema (Phase 4)
        run: npm run migrate:phase4
```

If your workflow uses different indentation or step names, keep its existing contents and place the migration step after config generation and before Core deployment. The included `.github/workflows/deploy-maliks-operations.yml` is a reference full file; compare carefully rather than overwriting custom changes.

The migration executes:

```bash
wrangler d1 execute maliks-group-hub-db --remote --yes \
  --file sql/phase4_till_shift_register.sql --config .generated/core.json
```

It creates only `maliks_till_shift_register` and its indexes using `IF NOT EXISTS`. It does not edit or remove existing tables. It can be executed on subsequent deployment runs without clearing shift records.

## GitHub deployment

1. Commit the files (preferably on a review branch; then merge into `main`).
2. On GitHub: Actions → **Deploy Maliks Department Applications** → **Run workflow**.
3. Select `main`, verify the worker names and tick the existing confirmation checkbox. Use a **new** workflow run, not "Re-run jobs".
4. Check that `npm test` succeeds and the **Apply additive till-shift D1 schema** step completes before Core / Tills / Cash Office are deployed.
5. If migration fails, stop: do **not** deploy the new Core separately before diagnosing the database or SQL error.

## After deployment: safe smoke test

1. Open `https://maliks-tills.moyanamoses006.workers.dev/` and refresh with Ctrl+Shift+R. Look for **PHASE 4 — TILL SHIFTS**.
2. With a **test cashier** assigned to a specific branch, enter `TILL-01`, opening float `250.00`, and click **Open my till shift**. Verify the record appears, then close with a test count such as `250.00` and note `Training test`.
3. Open `https://maliks-cash-office.moyanamoses006.workers.dev/` in an authorised Cash Office login. Confirm the branch shift record appears read-only.
4. Ensure a different branch account cannot see the shift. Check Tills cannot show another cashier's shift.
5. Confirm POS quotations remain available; Dispatch still has no transaction posting; Maliks Group Hub remains unchanged.

**Avoid entering real customer tender or cashier balances while the transaction engine is not live.** This test writes trial shift-register data, so use clearly labelled test information. There is no UI delete button to erase audit history.

## What is next

Production Tills requires an atomic payment and tax-invoice ledger, exactly-once transaction numbering, receipt printing, stock posting, reversals, cash-up expected-vs-counted reconciliation, and manager sign-off. None of these is enabled by Phase 4.

## Local verification

- `npm test`: 45 passing tests
- Browser inline JavaScript for all four workers: syntax checked
- SQL applied twice successfully in SQLite and uniqueness constraints checked
- Actual Cloudflare live deployment **not** performed or verified
