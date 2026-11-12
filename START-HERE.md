# Maliks Department Applications — Phase 3 (Tills checkout preparation)

Repository: `mos00000006/maliksgroupza`. This is **an incremental patch built on top of Phase 2**, not a replacement application.

## Changes

- **Tills:** Retrieve an exact quotation number from the central API even when it is older than the 50 most recent quotations. View the original items, VAT-inclusive amounts and print the quotation.
- **Tills:** Cash change/shortfall calculator labelled **TRAINING ONLY**. This is local browser arithmetic; no payment method, amount tendered, cashier shift, paid flag, invoice, receipt, cash drawer, or stock posting is saved.
- **Cash Office:** Same exact-number lookup, with branch restrictions and quotation printing, but **no payment calculator**.
- **POS:** No visual change; the server-side lookup also enforces the logged-in salesperson if used by POS later.
- **Dispatch:** Unchanged and non-transactional.
- **Security:** Exact lookup uses prepared SQL parameters, requires the Cloudflare Access JWT and an active assigned branch, rejects malformed numbers, and keeps each application in its own role.

## Before installing

The previous Phase 2 update must be committed and deployed first. If your last Phase 2 GitHub Actions run did not finish with a **green check**, fix that deployment before using this patch. GitHub Actions' previous `NAMES_CONFIRMED` error is a manual workflow checkbox, not an app-code issue.

## Replace these four files in GitHub

1. `maliks-operations/src/frontend.mjs` **REPLACE**
2. `maliks-operations/src/core.mjs` **REPLACE**
3. `maliks-operations/src/quote-domain.mjs` **REPLACE**
4. `maliks-operations/tests/phase3.test.mjs` **ADD**

Do **not** overwrite the PowerBuild logo file, existing deployments/workflows, database files, main management Hub, or other tests. This package contains the full replacement contents for the three source files (not snippets). Commit all four together on a branch, then review and merge. The other Phase 2 test files should remain.

## Deploy

1. In GitHub Actions select **Deploy Maliks Department Applications → Run workflow**.
2. Select `main` after merging, verify names still target only the four departmental Workers plus `maliks-core-api`, tick the Worker-name safety confirmation and start a **new** workflow run.
3. Check `npm test`, core deployment, and Tills and Cash Office deployments finish green.
4. Force refresh Tills (`Ctrl+Shift+R`), and find the **Find quotation by exact number** section. Search for a known historical *quotation* number such as `Q-00000001` in the correct branch.
5. In Tills, examine the quotation and try `Cash received (R)`; confirm that it calculates change or shortfall without any server submission or paid status. Verify Cash Office lookup works and Dispatch is unchanged.
6. With a staff account assigned to another branch, confirm the quotation is not accessible. Use authorised test data only; do not operate a live till using preview arithmetic.

## Operational limits / safety

- **Not a live till**: no real payment, invoicing, fiscal receipt, cash-up, reversal, EFT/card reconciliation, bank connection or stock movement.
- This update requires **no database migrations or new secrets**. It does not alter production data when using quotation lookup and the calculator.
- The business rule remains: Sales quotations go to a separate Cash Office queue; managers monitor in the separate Hub.
- Before live sales, the next substantive phase must implement server-authoritative payment records, receipt/invoice numbering, transaction atomicity and idempotency, user permissions and shift controls, VAT/rounding, reversals, stock movements and signed dispatch authorisation with audits and tests.

## Verification performed

`npm test` and Node syntax checks run locally; generated browser `<script>` was also syntax-checked. **This does not prove the Cloudflare production deployment works**. Verify the actual deployed site with a test quote after the GitHub workflow passes.
