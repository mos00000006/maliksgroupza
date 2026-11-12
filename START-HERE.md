# FIX: Phase 8 GitHub `npm test` — 5 failures

Your pasted GitHub Actions log shows **76 tests, 71 passing, 5 failing**. I reproduced this exact result locally using the older Phase 7 tests, current Phase 8 frontend, and the missing evidence module. Applying the files in this package resulted in **87/87 passing** in the reconstructed project.

## Root causes

1. `maliks-operations/src/payment-evidence-domain.mjs` **is missing** from the repository. The Phase 8 test runner cannot import it. This is a required runtime module, not a cosmetic test issue.
2. Four older tests in `tests/phase4.test.mjs`, `phase5.test.mjs`, `phase6.test.mjs`, and `phase7.test.mjs` still check for `PHASE 7 — PROVISIONAL CASH-UP`. In Phase 8 the Cash Office header is `PHASE 8 — PAYMENT EVIDENCE CONTROL` while its Phase 7 provisional worksheet remains present. The supplied tests verify that the old features remain.

## Upload into GitHub `mos00000006/maliksgroupza` on the `main` branch

Replace or add exactly these files, preserving the shown paths:

- `maliks-operations/src/payment-evidence-domain.mjs` — **add** (required).
- `maliks-operations/tests/phase4.test.mjs` — **replace**.
- `maliks-operations/tests/phase5.test.mjs` — **replace**.
- `maliks-operations/tests/phase6.test.mjs` — **replace**.
- `maliks-operations/tests/phase7.test.mjs` — **replace**.
- `maliks-operations/sql/phase8_payment_evidence.sql` — **add only if missing**; do not manually run against your real DB without a backup.

Do **not** replace `src/frontend.mjs`, `src/core.mjs`, `src/quote-domain.mjs`, `scripts/make-config.mjs`, or your management Hub. The fix preserves the quotation lookup changes and the earlier Cloudflare domain correction.

GitHub UI: open the path to each file > pencil **Edit** > replace file contents > **Commit changes**. To add the missing module, go to `maliks-operations/src` > **Add file** > **Upload files** > select `payment-evidence-domain.mjs` > commit. Repeat in `sql` only if the SQL is absent.

## Pre-deployment checks (important)

In GitHub, also verify:

- `maliks-operations/src/core.mjs` includes Phase 8 evidence endpoints and imports the module.
- `maliks-operations/package.json` contains the `migrate:phase8` script.
- `.github/workflows/deploy-maliks-operations.yml` runs `npm run migrate:phase8` **after npm test and config, before deploy:core**.
- The Phase 4–6 migration scripts remain present.

If any check is missing, **do not deploy yet**. It means the Phase 8 upload was incomplete beyond the five failing tests; merge the missing deployment file(s) from the full Phase 8 package rather than replacing the workflow blindly.

## Verify safely

1. Commit the source, test and SQL files.
2. Run **Deploy Maliks Department Applications** as a **new run**; verify the Worker names and tick the confirmation box (do not re-run a previous failed job).
3. The `npm test` job should now advance. If tests fail after importing the missing module, send the new **first failing test**: your repository may differ from the local reconstructed Phase 8 code.
4. Before applying the Phase 8 database migration in production, back up D1 and confirm the migration is safe for your data. Prefer staging first.

**Financial safety:** Phase 8 is only manual payment-document evidence; it does not confirm a payment, issue a tax invoice or release Dispatch. Do not enable paid status or dispatch on these records.
