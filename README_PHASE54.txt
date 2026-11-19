MALIKS POS PROFESSIONAL — PHASE 54
BACK OFFICE -> MASTER FILES (5 OPTIONS)

Included:
  Tills
  Till Drawings Expenses
  Payment Types
  Coinage
  Cash Sales Transaction Numbers Free Voucher

IMPORTANT SCOPE
These are branch-specific, manager-controlled CONFIGURATION REFERENCE registers with create/edit/deactivate, code uniqueness, optimistic version checks, audit and idempotency. They do not activate a physical till, issue a voucher, move cash, change the existing cashier tender engine, post VAT, or modify balances. Till Cash-Up remains in its existing separate workstation.

INSTALL IN THE CURRENT GITHUB CHECKOUT (not into an older ZIP):
1. Extract this ZIP into the repository ROOT, preserving folders.
2. In the repository root open VS Code Terminal / PowerShell.
3. Run:
     node maliks-operations/scripts/apply-phase54.mjs
   This surgically updates the CURRENT versions of:
     maliks-operations/src/frontend.mjs
     maliks-operations/src/core.mjs
     maliks-operations/package.json
     .github/workflows/deploy-maliks-operations.yml
   The script is safe to run a second time; it checks markers before inserting.
4. Run:
     cd maliks-operations
     npm test
5. If tests pass, commit and push the changed and new files to GitHub.
6. Run the existing "Deploy Maliks Department Applications" workflow. Its Phase 54 D1 migration now runs BEFORE private Core and POS deployment.
7. Sign in, choose the correct branch, open Back Office -> Master Files.

WARNING: Do not upload only the new source files and skip step 3; otherwise the options remain disabled. Do not deploy until the complete project test suite passes. Back up D1 before any production migration.

Files:
 - maliks-operations/src/backoffice-master-domain.mjs
 - maliks-operations/src/backoffice-master-ui.mjs
 - maliks-operations/sql/phase54_backoffice_masters.sql
 - maliks-operations/scripts/apply-phase54.mjs
 - maliks-operations/tests/phase54-backoffice-masters.test.mjs
 - maliks-operations/tests/phase54-backoffice-wiring.test.mjs

Focused checks: 8 passed in local smoke checkout. Full project suite and live D1 migration not run here.
