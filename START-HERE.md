# Maliks Operations — Tills Payment → Cash Office Approval → Internal Invoice → Dispatch

## What this update installs

Four **separate** Worker websites remain in place. This patch adds the missing transaction flow, and keeps the existing management Hub unchanged.

1. POS creates a VAT-inclusive quotation (existing Phase 2).
2. A Tills employee opens their assigned shift, retrieves the quote by number, and **submits the exact cash/card/EFT tender values**. This records `AWAITING_VERIFICATION`. It is **not paid yet**.
3. A **different** Cash Office employee independently counts/checks the cash and/or checks a terminal approval / verifies an EFT credit in the bank. They can `CONFIRM` or `REJECT` the payment. A rejected request creates **nothing** in Dispatch.
4. On Cash Office confirmation, the private Core Worker atomically: confirms the internal receipt, creates one numbered **internal sales invoice**, records balanced internal debit/credit posting lines, and adds one branch-specific **Dispatch job**.
5. Dispatch staff see the job on their separate website and can record **Picked** and **Checked** (by a different employee), with an append-only audit trail. This does **not** automatically deduct inventory, open a security exit gate, or constitute a signed POD.

## Important — financial and legal limits

- This is a **controlled pilot**, disabled by default. It can be enabled explicitly after testing by adding the GitHub Actions **repository variable** `MALIKS_P9_APPROVAL_ENABLED=true`, then deploying again. It is OFF if not set or set to any other value. Keep it **OFF** in production until accepted by your finance team and the end-to-end test passes.
- Card/EFT references are **not** a processor or bank API integration. They require an actual independent Cash Office check. Do NOT confirm EFT until the bank account shows the received credit. A terminal reference alone does not prove settlement.
- The generated document is an **INTERNAL SALES INVOICE**, not a validated SARS/VAT-compliant tax invoice. Before issuing statutory tax invoices, configure/verify your correct legal seller details (VAT registration, address, invoice numbering policy, customer information, etc.), test VAT treatment, and approve invoice layout with your accountant.
- No integration with the management Hub's official general ledger, VAT reporting, inventory movement, returns, refunds, chargebacks, or signed POD has been implemented. The internal sales journal is not a replacement for those controls.
- A **rejected payment blocks that quotation from being submitted again** in this pilot. Create a new quotation for the corrected transaction. A proper reversal and retry workflow remains a prerequisite for real production use.
- Manually changing the phase label does not enable payment. The explicit Core Worker feature flag gates all payment submission, independent approval and dispatch-status writes.

## Prerequisites

- Existing Maliks Operations Phases 1–8 code and SQL migrations already installed. Do not skip existing migrations.
- Existing Cloudflare Workers and Access applications: POS, Tills, Cash Office and Dispatch.
- Shared D1 database binding `DB` to the same intended Maliks Group Hub database.
- A **fresh D1 backup** and a tested restoration plan. Prefer a **separate staging D1** for initial testing. The included workflow applies an additive migration to the configured D1 database; this does not change earlier tables.
- Two different approved user emails (cashier and independent Cash Office reviewer) with correct role and branch assignments, plus two Dispatch users for independent checking.

## Repository file changes

Upload all supplied files to their paths at the root of `mos00000006/maliksgroupza`. Keep original directory names.

| Path | Action |
|---|---|
| `maliks-operations/src/payment-dispatch-domain.mjs` | Add new transactional module |
| `maliks-operations/src/core.mjs` | Replace with Phase 8 core + new routes |
| `maliks-operations/src/frontend.mjs` | Replace with updated UI and API proxy |
| `maliks-operations/sql/phase9_paid_sales_dispatch.sql` | Add additive schema |
| `maliks-operations/scripts/make-config.mjs` | Replace (retains your previous Cloudflare domain fix; adds disabled-by-default flag) |
| `maliks-operations/package.json` | Replace (adds Phase 9 migration script) |
| `.github/workflows/deploy-maliks-operations.yml` | Replace (adds Phase 9 migration and feature-variable mapping) |
| `maliks-operations/tests/phase2.test.mjs` through `phase9.test.mjs` | Update Phase 2–8 expectations; add Phase 9 integration tests |

**Do not delete** `src/powerbuild-logo.mjs`, any existing GitHub secrets, the previous SQL migrations, or the management Hub source. This package intentionally does not include those unchanged files. If you have made additional edits since the Phase 8 core fix, merge instead of overwriting them.

## Deploy safely

1. Back up D1. Make a copy of the current GitHub code.
2. Add the files from this ZIP in **one commit**, on a branch first if practical.
3. In GitHub **Settings → Secrets and variables → Actions → Variables**, add `MALIKS_P9_APPROVAL_ENABLED` with value `false` initially (or leave it absent). The Core Worker defaults to OFF. This is a **variable**, not an AUD secret.
4. From **GitHub → Actions → Deploy Maliks Department Applications**, start a new manual run. Check the Worker-name confirmation. The workflow will apply `sql/phase9_paid_sales_dispatch.sql` and deploy Core, POS, Tills, Cash Office, Dispatch.
5. Confirm all workflows are green and visit each app. Check **Payment pilot DISABLED** on Tills, Cash Office and Dispatch.
6. In a **test/staging setup**, set the variable to `true` and run the workflow again. Never test with actual customer funds or real goods until the controls are signed off.
7. In POS, create a small TEST quotation. In Tills, open a shift under a test cashier, lookup that quotation, and use the new **Submit payment to Cash Office** control. You should see **AWAITING_VERIFICATION**, not PAID.
8. Under a *different* Cash Office user's email, check the source evidence. Confirm via the independent verification panel. The result should show a numbered **INTERNAL SALES INVOICE** and **Dispatch queued**. Reject a second TEST payment and verify it does **not** create an invoice or dispatch job.
9. In Dispatch, select the same branch, refresh **Paid invoices — Dispatch work queue**, mark picked, and have a *different* assigned checker mark checked. Verify there is no inventory stock movement, POD, security release or statutory tax invoice.
10. Keep `MALIKS_P9_APPROVAL_ENABLED=false` for live trade until proper POS acceptance, statutory invoice configuration, accounting integration, reversal controls and stock/dispatch control are completed. Do not enable live customer trading on the strength of automated tests alone.

## Local verification

- `node --test tests/*.test.mjs`: **92 tests passed, 0 failed** in the reconstructed source tree.
- Node `node:sqlite` integration tests exercise pending/rejected/confirmed payments, independent reviewer checks, duplicate guards, balanced internal journal, invoice and dispatch creation, branch guards and pick/check independence.
- Four generated browser scripts passed `node --check` syntax validation.
- Cloudflare configuration generation tested with flag OFF by default and explicitly ON.
- Tested in a local SQLite model, **not** against your production Cloudflare D1 or payment processor.

## What is still missing for full production-ready tills and dispatch

- PSP/card-terminal integration or controlled independent settlement verification; EFT bank feed integration.
- Official legal/VAT invoice profile, receipt-number policies, credit notes/returns, refunds/reversals.
- Synchronisation with the company financial system, genuine cash-up/cashbook, stock reservations/deductions and physical security/POD workflow.
- Staging-to-production acceptance, resilience/concurrency stress testing, management sign-off, backups and restore drills.
