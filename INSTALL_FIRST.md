# Maliks POS Professional — Debtors Reporting (Phase 31)

## Purpose
Activate all eight previously grey options under POS → Debtors → Reporting. Preserve the existing Audits option and all Phase 27/29/30 master and transaction records.

## Included files
- `maliks-operations/src/frontend.mjs` — eight report buttons, responsive table interface, date/account search, paging, export current page as CSV, print current page.
- `maliks-operations/src/core.mjs` — read-only management route `/v1/debtor-reports`.
- `maliks-operations/src/debtor-report-domain.mjs` — eight branch-protected, parameterized, read-only reports.
- `maliks-operations/tests/phase31-debtor-reporting.test.mjs` — 8 data, security and financial-integrity tests.
- `maliks-operations/tests/phase31-report-ui-integration.test.mjs` — 4 UI/router/security tests.

## Install into GitHub
1. Back up any new work you have not pushed yet.
2. Extract this ZIP into the **root** of your existing `maliksgroupza` project (the directory containing `maliks-operations/`). Preserve all folders and overwrite matching files.
3. Commit these five files and push to the `main` branch.
4. Open https://github.com/mos00000006/maliksgroupza/actions/workflows/deploy-maliks-operations.yml and run the workflow on `main` if it did not start automatically.
5. Confirm `npm test` and the private Core and Maliks POS deployments have succeeded.
6. Open https://maliks-pos.moyanamoses006.workers.dev/ and go to Debtors → Reporting; select a branch and open a report.

## Tested against GitHub versions before installation
- `maliks-operations/src/frontend.mjs`: `b75a9b8fe8ecb7057020b112bc756c5a3c400172`
- `maliks-operations/src/core.mjs`: `2492d5531dddf61fde8de4d49090974308770005`

**If your repo has newer versions of these files, do not blindly overwrite the newer work.** Ask for an updated merge patch.

## Report coverage
- Master — live debtor master list. Credit limits shown separately, NOT balances.
- Transactions — all captured Phase 30 register entries (unposted).
- Sales — confirmed pilot internal invoices plus a clearly separated quotations list, which is not revenue.
- Ledger — internal pilot sales invoice journal lines, NOT a complete ledger.
- Statements — debtor master account and unposted-request readiness; real balance unavailable until posted AR integration.
- Control Account — internal pilot journal summary only; NOT reconciled debtor control.
- Age Analysis — account/terms readiness; no fabricated ageing buckets or customer receivables.
- Debtors PDCs — PDC register and cheque due dates; no false bank clearance.

All data stays branch-scoped, read-only and behind the existing management login. Use Run report, account/reference search, optional dates, Previous/Next, Export CSV, and Print current page. CSV and print are clearly marked as reports for the selected page.

## Data safety
- No new database migration or Cloudflare secret is required.
- The earlier Phase 15, 9, 30 tables must already exist; the standard deploy workflow applies them before deploying Core.
- The new report code performs `SELECT` only. It never posts money, reconciles accounts, writes a GL, or changes balances/invoices/stock.
- The new screens have a clear disclaimer where the underlying accounting records are incomplete.

## Tests
12 new Phase 31 tests plus 16 Phase 29/30 tests pass locally (28 passed total). The fully connected GitHub CI suite still needs to pass after installation. The separate old Phase 27 test could not run in the standalone lightweight patch workspace because its full-repository `jose` dependency was not installed here; this does not indicate a regression in the current code.
