MALIKS POS PROFESSIONAL — SUPPLIERS TRANSACTIONS (PHASE 35)
18 November 2026

Enables the four previously greyed-out Suppliers > Transactions options:
  - Payments and Reversals
  - Journals
  - Rebates
  - Payments Reconciliation

All are REAL branch-scoped preparation/audit registers, NOT financial postings.
There are five record types: PAYMENT, REVERSAL, JOURNAL, REBATE, RECONCILIATION.
These support draft creation, submit, independent manager review/rejection,
cancellation of drafts, and audit history. REVEIWED does not mean paid.
NO supplier balance, AP, VAT, cash, bank, GL, stock or dispatch is changed.

INSTALLATION (from your repository root):
1. Back up or commit existing changes first.
2. Extract ZIP over repository root, preserving folders. Do not delete other files.
3. The ZIP includes Phase 34 migration in the automated deployment workflow,
   so both Phase 34 and Phase 35 migrations run before Core/POS deploy.
4. Push the changes to GitHub; your existing workflow should test, migrate, deploy.
   For manual deployment from maliks-operations/ after config generation:
      npm run migrate:phase34
      npm run migrate:phase35
      npm run deploy:core
      npm run deploy:pos
5. Visit Suppliers > Transactions and test with two separately authorised managers.

CHANGED/ADDED FILES:
  .github/workflows/deploy-maliks-operations.yml
  maliks-operations/src/frontend.mjs
  maliks-operations/src/core.mjs
  maliks-operations/src/supplier-transaction-domain.mjs (new)
  maliks-operations/sql/phase35_supplier_transaction_registers.sql (new)
  maliks-operations/tests/phase35-supplier-transactions.test.mjs (new)
  maliks-operations/package.json

VALIDATION: 6 focused Phase 35 tests pass. Existing full test suite ran:
296 of 298 passing. Two unrelated suites could not run because 'jose'
node dependency is unavailable in this local runtime. GitHub installs
repository dependencies separately before running tests.

Do not treat a review as proof that the bank has paid. Do not use these
register entries for posting real payments until a separately authorised,
reconciled accounting module is implemented.
