MALIKS POS — SUPPLIERS REPORTING ACTIVATION (18 NOV 2026)

Source: user-supplied maliksgroupza ZIP (18 Nov 2026 10:40).

Copy maliks-operations/src/frontend.mjs into the matching path in your GitHub repository, replacing that file. Commit and push to deploy using your established workflow.

New active menu entries:
- Suppliers > Reporting > Master (supplier register)
- Suppliers > Reporting > Transactions (purchase orders and supplier invoices)
- Suppliers > Reporting > Purchases (purchase order register)
- Suppliers > Master Files > Invoices and Debit Notes Details (invoice detail register)

Each report provides branch-based records, search, refresh, CSV and print controls.
READ ONLY. No financial ledger, statement, creditor balances or payments are posted.

Unfinished Suppliers menu options remain disabled deliberately until their server-side data models, authorisations and accounting controls are implemented; enabling their links alone would give a false appearance of working finance features.

Validation: node --check on changed source successful.

CORRECTION — 18 NOV 2026:
This corrected patch fixes the generated POS browser script syntax error in the CSV export newline separator.
Validation in supplied project: 288 of 290 tests pass. The 2 remaining tests could not run because the third-party 'jose' dependency is not installed in this isolated verification environment (offline npm cache does not contain it). All browser JavaScript parsing tests pass.
No server files, database migrations, or financial posting logic are changed.
