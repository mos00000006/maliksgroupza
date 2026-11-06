MALIKS GROUP HUB — INVENTORY LEDGER GITHUB LINT FIX V10
=======================================================
FIXES: The two blocking React ESLint errors in app/stock-operations/inventory-ledger.tsx at lines 14 and 15 (react-hooks/set-state-in-effect).

INSTALL
1. Extract the ZIP.
2. Open your existing maliksgroupza project in VS Code.
3. Copy the 'app' folder from this ZIP into your existing maliksgroupza folder.
4. Merge folders and REPLACE the single matching file:
     app/stock-operations/inventory-ledger.tsx
5. (Optional) Copy the 'tests' folder as well to add three regression checks:
     tests/stock-inventory-ledger-react-effects-v10.test.mjs
6. Run 'npm run check' in your normal project environment, commit, and push to GitHub.

WHAT CHANGED
- The InventoryLedger wrapper now keys the inner inventory working area to the selected branch. That automatically resets selected products, draft opening quantities, success messages and pending search state on branch change, rather than synchronously calling React setState within an effect.
- The data-fetch effect now returns early for a missing branch without synchronously calling setCurrent.
- The existing abort controller prevents an older branch request from updating the newly mounted branch.

WHAT IS UNCHANGED
Stock documents, approval API, GRV printing, movements, opening-stock import, activation, stock ledger SQL and existing data.

VALIDATION PERFORMED
- 3 new focused regression tests passed.
- TypeScript TSX transpile diagnostics: 0 errors.
- See TARGETED_TEST_RESULTS.txt for local V9 inventory and SQLite tests.
- Full npm run check/GitHub CI has not been run in the complete project and must be rerun after install.

NO DATABASE MIGRATION REQUIRED. Do not reapply existing 0057 migration just for this fix.
