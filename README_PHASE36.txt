MALIKS POS PROFESSIONAL — PHASE 36 SUPPLIERS REPORTING
18 November 2026

Scope: enables SIX disabled Suppliers > Reporting options:
 Ledger, Statements, Control Account, Age Analysis, Payments and Suppliers PDC.
 Existing Master, Transactions, Purchases and Audits remain as before.

INSTALL
1. Start with repository containing Phase 35. Do not install on a pre-Phase-35 build.
2. Copy maliks-operations/src/frontend.mjs to the same relative path in GitHub,
   replacing that one file.
3. Add maliks-operations/tests/phase36-supplier-reporting.test.mjs.
4. Commit and push; the existing deployment workflow will deploy the POS Worker.
   This phase adds no SQL migration, no new API and no Core Worker changes.

REPORTING RULES
- Ledger: supplier invoice evidence and unposted journal preparations. NOT a creditor ledger.
- Statements: supplier invoice listing only; outstanding allocations/balances unavailable.
- Control Account: document counts only; no posted AP/GL control balances.
- Age Analysis: invoice dates listed; no ageing buckets or outstanding calculation.
- Payments: operational payment and reversal preparations; NOT bank cleared or posted.
- Suppliers PDC: clear notice of unavailable dedicated maintained PDC records.
- All use existing authenticated, branch-scoped, permission-controlled APIs.
- CSV export/print is available for populated evidence tables, with caveats.

TESTING
- Focused browser/script, Supplier Transactions and Debtor Reporting tests passed.
- Full suite in this environment: 299 passed; two test files could not load due to
  missing optional local 'jose' dependency. No new Phase 36 test failed.
- Deploy only after CI passes in your GitHub environment.

IMPORTANT
This phase enables read-only operational screens; it does NOT complete accounting
posting, supplier statement reconciliation, AP ledger, actual supplier payments,
actual due-ageing, bank clearance or post-dated-cheque processing.
