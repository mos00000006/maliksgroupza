# Maliks Operations — Phase 6: Tender Allocation Preparation (NOT LIVE PAYMENT)

This is the next incremental upgrade for the **four separate department Workers**, based on the **Phase 5 source**. It does not modify or deploy the main `maliks-group-hub` Worker. It introduces an accountable *tender preparation* record: Cash, Card and EFT allocations against an existing quotation and cashier shift, visible to Cash Office. The feature does **NOT** receive money, verify EFT/card authorisations, mark a quotation paid, create tax invoices, release stock or dispatch orders, or produce a paid receipt.

## Features

- **Maliks Tills:** Find an existing quotation, check cashier's OPEN till shift, calculate cash/card/EFT allocation and change, save an immutable `PREPARATION_ONLY` record with an idempotent request ID. Total allocations must match the server-saved quotation exactly. Enter only terminal approval references, never card numbers or CVV.
- **Maliks Cash Office:** Read-only branch-scoped queue of tender preparations. Existing independent reviews of closed shift declarations remain in place.
- **Maliks POS:** Existing quotations unchanged. **Dispatch:** Unchanged and not activated. Neither application may use the tender preparation API.
- **Private Core and D1:** The private Core verifies Cloudflare Access JWT and branch roles; only an open till shift owned by the signed-in cashier can save a preparation. One immutable preparation per quotation. Duplicate retries with the same request ID can be retrieved, with no duplicate records.
- **Visibility:** Explicit *NOT PAID* labels on the screen and API; quotations remain in their original status, and no payment posting happens.

## Important prerequisites

1. Verify **Phase 4 Till Shift Register** and **Phase 5 Cash Office Reviews** actually deployed, **including both D1 SQL migrations**. Past chat messages did **not** confirm their live deployment. **Do not skip these phases**. If unsure, check that Tills can open/close a shift and Cash Office shows `Shift Review & Exceptions`.
2. Check the Phase 5 code is the baseline in GitHub (or compare/merge if your branch has custom changes). This package includes complete replacement source files for Phase 6, not a replacement Maliks management Hub.
3. Back up the existing `maliks-group-hub-db` D1 database and verify it is recoverable. Prefer a staging deployment before modifying the production DB. Stop if the database ID, Worker names, branch mapping or Access AUDs differ from those expected.
4. These are *development/test* records in the shared D1. Do **not** enter real payment card details, confidential banking information, actual tender references, or live customer transactions. Use test quotations and test shift declarations only.

## GitHub files

| Path relative to repository root | Action |
|---|---|
| `maliks-operations/src/core.mjs` | Replace with Phase 6 version; new protected Core endpoints |
| `maliks-operations/src/frontend.mjs` | Replace; Cash/Card/EFT preparation and Cash Office read-only queue |
| `maliks-operations/src/tender-domain.mjs` | Add; amounts, references and branch-scoped query validation |
| `maliks-operations/sql/phase6_tender_preparations.sql` | Add; additive, guarded D1 schema |
| `maliks-operations/package.json` | Replace; adds `migrate:phase6` command |
| `maliks-operations/tests/phase4.test.mjs` | Replace; preserves Phase 4 tests with updated phase labels |
| `maliks-operations/tests/phase5.test.mjs` | Replace; preserves Phase 5 tests with updated phase labels |
| `maliks-operations/tests/phase6.test.mjs` | Add; Phase 6 validation, scoping, and API forwarding tests |
| `.github/workflows/deploy-maliks-operations.yml` | Reference workflow; merge only the Phase 6 step if you customized yours |

**Do not edit** the main Hub's source, main Hub deployment workflow, existing secrets, Cloudflare Access applications, `src/powerbuild-logo.mjs`, or your working `scripts/make-config.mjs`.

## Workflow modification

In `.github/workflows/deploy-maliks-operations.yml`, after the existing Phase 5 migration and **before** `npm run deploy:core`, insert:

```yaml
      - name: Apply additive tender preparations D1 schema (Phase 6)
        run: npm run migrate:phase6
```

Verify the order is `npm test` -> `npm run config` -> Phase 4 migration -> Phase 5 migration -> **Phase 6 migration** -> Core -> POS -> Tills -> Cash Office -> Dispatch.

Because the schema is additive (`CREATE TABLE/INDEX IF NOT EXISTS`), reapplying it does not clear records. The database includes constraints against mismatched tender totals and a unique index to prevent two preparations for the same quotation.

## Deploy and test

1. Upload/replace the files in GitHub at the exact paths above. Do not add a nested extra `maliks-operations` folder. Commit them together.
2. Run tests in the `maliks-operations` folder (`npm install` and `npm test`). This package passed **62 Node tests**; the generated browser modules passed `node --check`; SQL schema and insert guards passed local SQLite checks.
3. GitHub → Actions → **Deploy Maliks Department Applications** → **Run workflow** → choose `main` → confirm the existing department Worker names (they are existing apps being updated) → tick the confirmation checkbox → start a **new** run.
4. Look for green GitHub steps: `migrate:phase4`, `migrate:phase5`, `migrate:phase6`, deploy Core, POS, Tills, Cash Office, Dispatch. Any failed step means do not test live workflows yet.
5. In Tills (`https://maliks-tills.moyanamoses006.workers.dev/`), open a **test** shift, look up a **test** quote, and find **Prepare tender allocation — NOT PAYMENT**. Use dummy card/EFT references. Save a valid exact-total split; confirm it appears in **My tender preparations — NOT PAID**.
6. In Cash Office (`https://maliks-cash-office.moyanamoses006.workers.dev/`), confirm the same preparation is visible in the assigned branch's read-only queue and other branches cannot see it. Ensure there is no payment receipt, paid quote, tax invoice, dispatch release, or stock movement.
7. Try an over-allocated split and a second preparation for the same quote; both should be rejected. Do not test with production financial data.

## What Phase 7 needs before financial go-live

Actual payment posting needs an atomic journal, payment reference verification and POS device integrations, invoice numbering and VAT documents, tender reversal/approval controls, expected cash-up computation, bank/EFT reconciliation, inventory posting and dispatch release. None of those are implemented here. Until then, Phase 6 is a **controlled preparation/training function only**, not a POS payment system.

No live Cloudflare deployment or production database test was performed to prepare this ZIP.
