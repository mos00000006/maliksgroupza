# Maliks Operations — SIMPLE CASH/CARD CHECKOUT → DISPATCH

## The user-facing change

**Tills now asks for only:**
1. **Paid by:** Cash or Card
2. **Amount received (R)**
3. **Confirm Paid & Send to Dispatch**

On a successful confirmation, the private API records which cashier confirmed receipt, creates **one numbered INTERNAL sales invoice**, writes the internal balanced journal lines, and creates **one Dispatch job** for the same branch. The Dispatch Worker sees that job in its existing **Paid invoices — Dispatch work queue**. Cash Office can see and audit cashier-confirmed payments; it is NOT a required second-approval step for these Cash/Card transactions.

- CASH: enter the physical cash received; change is calculated automatically. Cash must cover the quotation.
- CARD: enter the exact quoted amount, **only after the card terminal actually displays APPROVED**. This is a cashier-attested terminal result, not direct confirmation from a bank/card processor.
- **EFT and split tenders are NOT in the simple confirmation path**. Older pending Cash Office payment requests retain their existing independent confirmation workflow.
- Requires an OPEN till shift and the employee's existing Access/branch permissions.

**This remains a controlled pilot.** Its internal invoice is not a statutory/SARS-compliant tax invoice, and no actual stock deduction, exit-gate release, signed POD, external accounting/settlement reconciliation or processor/bank integration occurs. Do not release actual goods based only on the pilot without your store's approved verification and security procedure. Card chargebacks, reversals, credits, and payments that fail at the terminal still need full handling.

## GitHub files to add / replace

Upload these paths from the ZIP into the **root** of `mos00000006/maliksgroupza`:

| File | Action |
|---|---|
| `maliks-operations/src/payment-dispatch-domain.mjs` | Replace |
| `maliks-operations/src/core.mjs` | Replace |
| `maliks-operations/src/frontend.mjs` | Replace |
| `maliks-operations/sql/phase10_simple_cashier_checkout.sql` | Add |
| `maliks-operations/package.json` | Replace |
| `.github/workflows/deploy-maliks-operations.yml` | Replace |
| `maliks-operations/tests/phase9.test.mjs` | Replace (updates one display-string assertion) |
| `maliks-operations/tests/phase10.test.mjs` | Add |

The files are based on the **Phase 9 payment-to-dispatch package** provided earlier. **Do not overwrite newer custom changes** if your live GitHub differs: merge these changes instead. Do not delete `powerbuild-logo.mjs`, old migrations, or the Hub app. The four public app names and the internal Core Worker names are unchanged.

## Deploy steps

1. **Back up the Cloudflare D1 database**, and keep your currently working GitHub commit available for rollback. Prefer a staging D1 for first tests; this workflow targets the configured database.
2. Confirm the Phase 9 SQL migration is already installed. The workflow re-runs its additive `CREATE TABLE IF NOT EXISTS` statements, followed by the new Phase 10 schema.
3. Upload the eight listed files, then commit.
4. Go to **GitHub → Settings → Secrets and variables → Actions → Variables**. This is an *Actions variable*, not a secret. Find or create **`MALIKS_P9_APPROVAL_ENABLED`**. For testing with controlled fake/test transactions, set it to **`true`**. The existing workflow maps it into the private Core Worker. If false/missing, the `Cashier checkout is disabled` error persists. Do not enable this on a real trading setup until your management team accepts cashier responsibility, audit and release controls.
5. Go to **Actions → Deploy Maliks Department Applications**, start a **new** workflow run, and check the Worker-name safety confirmation. Do not rerun an old failure without rechecking settings.
6. Confirm the new D1 migration and Worker deployments are green. Open [Maliks Tills](https://maliks-tills.moyanamoses006.workers.dev/) and refresh (`Ctrl+Shift+R`).
7. Under an approved test cashier, open a till shift if not already open. Retrieve a **new test quotation** by number. Choose Cash or Card; enter amount. Use the **Confirm Paid & Send to Dispatch** button *only when the test receipt condition is satisfied*. Confirm a single new internal invoice and Dispatch queue item; review it at [Maliks Dispatch](https://maliks-dispatch.moyanamoses006.workers.dev/).
8. Verify a second attempt with the same quotation cannot create a second payment/invoice/Dispatch item; test another branch cannot retrieve that invoice. Verify Cash Office can audit the cashier-confirmed payment.

**If a quotation already has an old `AWAITING_VERIFICATION` payment request, the unique quotation constraint blocks this quick-payment path.** Do not force another payment or delete production data. Resolve the old pending record through the existing controlled path or use a fresh test quotation.

## Technical controls and results

- The API route is `POST /api/payments/quick-confirm` and is restricted to the **Tills** Worker, same-origin access and Cloudflare Access JWT, with a second permission check in the private Core Worker.
- The code verifies user/branch, exact quotation total, open till shift, card amount, cash change, and cashier attestation. D1 `batch()` atomically writes payment, cashier confirmation record, invoice, journal and dispatch job.
- Database constraints enforce unique quotation/payment/invoice/dispatch records. Repeating the **same request ID with identical data** returns the same invoice, avoiding double dispatch. Changing the request content fails.
- `maliks_p10_cashier_confirmations` is append-only; payment source is explicitly `CASHIER_DECLARATION`. Cash Office may audit, not retrospectively approve the fast path.
- **No new Cloudflare Access applications or secrets.** The Phase 9 Actions variable is reused.
- Local verification: **97 Node tests passed**, four generated browser-script syntax checks passed. Local SQLite transaction checks passed. **Not tested on live Cloudflare D1 or a real card terminal.**

## Important financial limitations

Cashier confirmation is a trusted staff action, **not proof of card settlement**. Management must decide and document cash handling, approved-terminal evidence, limits, exception follow-up, refunds, chargebacks, statutory tax invoice requirements and physical dispatch handover before use for real customers. Cash Office's older *provisional cash-up worksheet* is still based on tender preparations, not reconciled checkout receipts; do not use it as a final cashbook.
