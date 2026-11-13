# Maliks POS — Phase 16–17 missing dependencies recovery

This add-only recovery package repairs the Phase 18 GitHub test error:

`ENOENT: no such file or directory, open 'maliks-operations/sql/phase16_purchase_orders.sql'`

Your pasted CI output showed **141 tests, 136 passed, 5 failed**. All five failures were in `phase18-supplier-invoices.test.mjs` and stopped because Phase 16's migration was missing. Phase 18's supplier-invoice test also depends on the Phase 17 migration. Your 141-test count also suggests the eight Phase 16/17 tests were not included in your checkout.

## Install safely

1. **Do not reapply an entire earlier Phase 16–17 patch over Phase 18 or Phase 19.** That could overwrite newer files.
2. Back up/commit your current repository first.
3. Extract this ZIP **outside** your GitHub repository.
4. Copy the **contents of** `maliks-operations/` into the existing `maliks-operations/` folder in your `maliksgroupza` repository, **preserving folder paths**. Only add files that are missing. If any target file already exists, compare before overwriting; do not replace a modified file blindly.
5. Verify that these exact paths exist in your repository:

   - `maliks-operations/sql/phase16_purchase_orders.sql`
   - `maliks-operations/sql/phase17_inventory_flow.sql`
   - `maliks-operations/src/purchase-domain.mjs`
   - `maliks-operations/src/inventory-domain.mjs`
   - `maliks-operations/tests/phase16-purchase-orders.test.mjs`
   - `maliks-operations/tests/phase17-inventory-flow.test.mjs`

6. In VS Code PowerShell at your repository root, run:

   ```powershell
   cd maliks-operations
   npm test
   cd ..
   npm run check
   git status
   ```

7. Commit and push. Inspect GitHub Actions. **Do not deploy** until both checks are green and the required D1 migrations are included in the deployment workflow.

## Important

- This package **does not execute database migrations** or deploy any Worker.
- It does not replace your Phase 18 catalogue linkage, supplier-invoice code, or Phase 19 Member Team code.
- If `npm test` reports another error, send the **new first failing error** rather than repeatedly copying old files.
- Verify your `.github/workflows/deploy-maliks-operations.yml` runs `migrate:phase15`, `migrate:phase16`, `migrate:phase17`, `migrate:phase18` (and `migrate:phase19` if Phase 19 is installed) **before** deploying Core.
- These SQL migrations create tables; test them on staging and back up D1 before live deployment.
