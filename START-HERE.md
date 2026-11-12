# Maliks Operations — Phase 7: Provisional Cash-Up & Exceptions

## What this patch does

Adds a **read-only, branch-restricted provisional cash-up worksheet** to the **separate Maliks Cash Office** Worker. It uses existing Phase 4 cashier shift declarations and Phase 6 tender **preparations**. It does **not** record actual receipts, approve a cash-up, perform bank/card/EFT reconciliation, post payments, issue tax invoices, change stock, release Dispatch, or change the Maliks Group management Hub.

**Important:** Tender preparations are not paid transactions. A `R0` difference does **not** establish that a till is balanced. Every figure is labelled provisional, including cash, card and EFT amounts. An independent Cash Office declaration review still occurs through the Phase 5 Shift Review panel.

### Phase 7 features

- Cash Office can inspect the 75 most recent shifts of **one authorised branch** (always selected by the authenticated user; no unassigned branch is allowed).
- Shows cashier, till, shift status, opening float, number of tender preparations, prepared cash/card/EFT amounts, projected cash, declared closing cash count and provisional difference.
- Calculates **projected cash = opening float + cash applied in saved, unverified tender preparations**. Cash returned as change is not double-counted.
- Shows an optional difference **only for closed shifts with at least one saved tender preparation**. An open shift or shift with no preparations displays no calculated difference.
- Distinguishes `PROVISIONAL_DIFFERENCE`, `PROVISIONAL_ZERO_DIFFERENCE`, `NO_PREPARATIONS`, and `SHIFT_OPEN`. None is a verified cash-up status.
- Existing Cash Office immutable review and follow-up flags remain available. POS, Tills and Dispatch are denied access to the new API.
- No new D1 tables or migrations. No new GitHub secrets. No changes to `maliks-group-hub` management Worker, its routes or its data.

## Deployment prerequisites

1. **Check first** that your Phase 4, 5 and 6 uploads and D1 migrations have all deployed successfully. In the Tills app, you should see Phase 6 tender preparation. In Cash Office, you should see the Phase 5 shift review and existing tender preparations.
2. Back up your D1 database and keep a rollback copy of the existing `maliks-operations/src/` files. The Phase 7 changes are read-only, but production deployment still warrants backup and a staging test where possible.
3. The source files here were built **from the Phase 6 archive previously supplied in this conversation**. If you have modified those source files since, compare and merge rather than blindly replacing them.
4. Do not run the deployment if you haven't confirmed that the existing departmental Workers are safe to update. This package only targets **Maliks department applications**, not the main management Hub.

## Files to upload at the repository root

| Relative path | Action |
|---|---|
| `maliks-operations/src/core.mjs` | Replace: read-only protected `/v1/cashup-preview` API |
| `maliks-operations/src/frontend.mjs` | Replace: Phase 7 Cash Office worksheet and route mapping |
| `maliks-operations/src/cashup-domain.mjs` | Add: query, calculation and validation logic |
| `maliks-operations/tests/phase4.test.mjs` | Replace: updated Cash Office phase label expectation |
| `maliks-operations/tests/phase5.test.mjs` | Replace: updated Cash Office phase label expectation |
| `maliks-operations/tests/phase6.test.mjs` | Replace: updated Cash Office phase label expectation |
| `maliks-operations/tests/phase7.test.mjs` | Add: Phase 7 calculation and access tests |

**No other files need changing.** In particular, do not overwrite your existing `scripts/make-config.mjs`, `package.json`, PowerBuild logo, `.github/workflows/deploy-maliks-operations.yml`, Cloudflare Access configurations, or the Maliks Group Hub.

## How to deploy

1. Download the Phase 7 ZIP, extract it, and upload/replace the files above **at those exact paths** in your `maliksgroupza` GitHub repository.
2. Commit all seven files together.
3. GitHub → **Actions** → **Deploy Maliks Department Applications** → **Run workflow** → `main`. Confirm the existing departmental Worker names are the intended targets, check the existing confirmation box and start a **new** workflow run.
4. You do **not** need a Phase 7 D1 migration step. Retain the Phase 4 → Phase 5 → Phase 6 migrations already in your workflow.
5. After the workflow is green, open `https://maliks-cash-office.moyanamoses006.workers.dev/` and hard-refresh with Ctrl + Shift + R. Verify the top badge reads `PHASE 7 — PROVISIONAL CASH-UP`. Other app labels will remain Phase 2 POS, Phase 6 Tills and Phase 1 Dispatch.
6. Choose an assigned test branch and confirm a provisional worksheet appears below the Shift Review register. Compare at least one closed test shift with its prepared tender allocations and count. No payment, stock or invoice should be posted.
7. Attempt the API from POS, Tills and Dispatch; it should be denied. Check another branch in Cash Office only if your account is assigned to that branch.

## Tested locally

- **72 Node tests passed**, including earlier Phase 1–6 tests and new Phase 7 role, query and projection tests.
- JavaScript module syntax checks passed for the Core, Frontend, projection module and extracted browser module.
- SQLite in-memory smoke test verified aggregation, the zero-preparations case and isolation between two branches.
- **No live Cloudflare deployment or production database validation has been performed** in preparing this package.

## Operational limitation / what comes next

A production-grade cash-up will need a real receipt/payments journal; independent card terminal and EFT settlement evidence; transaction reversals/refunds and paid-outs; cash drop/deposit records; cash counted by denominations and reconciled by supervisor; robust VAT invoice numbering; an atomic stock movement ledger; and a verified handover to Dispatch. Until those exist, the Phase 7 worksheet is a **projection only**. Do not use it for financial posting or balancing actual tills.
