MALIKS POS PHASE 37 — SUPPLIERS UTILITIES (18 NOV 2026)

Requires previously deployed Phase 35 and 36.
Copy maliks-operations/src/frontend.mjs and maliks-operations/tests/phase37-supplier-utilities.test.mjs to same repository paths. Commit and push. No migration or new API needed.

Enabled: Control Agents (supplier contacts read-only), Statement Reconciliation (invoice evidence ONLY), Reprint Documents (operational summary, not original invoice), Reprint Unallocated Balances to Unpaid Invoices (declared amounts with balances NOT AVAILABLE), Housekeeping (safe diagnostics with no deletions). Existing Supplier Master CSV File Export remains active.

Financial posting, actual statement matching, unpaid balances, independent agent registry, and record-deletion workflows are NOT implemented. No data is changed by these utility screens.

Run npm test in full repository after installing.
