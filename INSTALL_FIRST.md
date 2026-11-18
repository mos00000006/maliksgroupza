# Maliks POS Professional — Debtors Transactions (Phase 30)

## Included
Four working Debtors > Transactions menu sections:

1. **Payments and Reversals:** capture a payment preparation or a reversal request (with an original-document reference and reason).
2. **Journals:** prepare an equal-value debit and credit journal entry for later accounting posting.
3. **PDC Register:** capture and track post-dated cheques, including bank, cheque number and maturity date.
4. **Group Accounts Invoice Settlements:** prepare a group-account invoice settlement reference for review.

Every entry is branch-scoped with a unique document reference, creator, amount, status, version, and audit history. Staff can save drafts, submit them, cancel drafts, and have a different authorised manager review or reject them. Review decisions do not post money. Rejection requires a written reason.

**IMPORTANT FINANCIAL CONTROL:** These are preparation/review registers ONLY. Even `REVIEWED` entries are **NOT** payments received, PDCs bank-cleared, posted journals, invoice allocations, credits, or changes to debtor balances, VAT or the general ledger. Real payment processing stays in authorised Tills/Cash Office applications. There is no financial posting, no stock posting and no dispatch release in this patch. Actual debit/credit posting, invoicing allocations and bank settlement require separate accounting integration and testing.

## Install in GitHub

1. Open your existing `mos00000006/maliksgroupza` project folder.
2. Extract the supplied ZIP into its **root**, merging the `.github` and `maliks-operations` folders. Do not create another nested `maliks-operations` directory.
3. Commit and push the files to `main`.
4. In GitHub Actions run **Deploy Maliks Department Applications** (workflow `deploy-maliks-operations.yml`) on `main`, checking the Worker-name confirmation.
5. The workflow runs `npm test`, creates the Worker configs, and executes `npm run migrate:phase30` before deploying the central Core and POS.
6. After all steps are green, reopen `https://maliks-pos.moyanamoses006.workers.dev/` and go to **Debtors → Transactions**. The four entries should now be clickable.

### First check

- Select an authorised branch.
- Open **Payments and Reversals**, choose **Payment preparation**.
- Enter a unique reference, debtor code, amount in Rand, date, method and description, then **Save transaction draft**.
- The record must appear as `DRAFT · NOT POSTED`.
- Click **Submit**. Another authorised manager must sign in to **Review** or **Reject** it.
- Click **Audit** to verify the recorded events. In the Core D1 database, `posted` remains `0` by enforced constraint.

### Files

- `maliks-operations/src/debtor-transaction-domain.mjs` — validation, access control, idempotency and audit workflow.
- `maliks-operations/src/core.mjs` — Core's protected transaction routes.
- `maliks-operations/src/frontend.mjs` — four POS screens and public Worker proxy.
- `maliks-operations/sql/phase30_debtor_transaction_registers.sql` — additive D1 schema.
- `maliks-operations/package.json` — new `migrate:phase30` script.
- `.github/workflows/deploy-maliks-operations.yml` — migration before Worker deployment.
- `maliks-operations/tests/phase30-debtor-transactions.test.mjs` and `phase30-ui-integration.test.mjs` — regression tests.

### Testing and safety

Locally, 16 targeted/regression tests passed (Phase 29 plus Phase 30), and the POS Worker generated module script parsed successfully. The entire GitHub test suite and live deployment are not verified yet. Changes are additive: existing orders, invoices, stock, customer master files, sessions and posted payments are untouched.

No extra Cloudflare secrets or access-audience changes are needed.
