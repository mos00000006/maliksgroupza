MALIKS POS — PHASE 43 CI TEST FIX (18 November 2026)

Your GitHub Actions log showed four failures in Phase 17/20 tests:
  'no such table: catalogue_products'

CAUSE: Phase 43 enhanced the existing inventory list query to join published catalogue QR tokens and branch prices. The Phase 17 and Phase 20 isolated SQLite test databases were still created with old migration-only schemas, without the Hub catalogue / published price-tag tables. The tests therefore failed before the assertions could run.

FIX: Update ONLY two test files to give their isolated in-memory SQLite databases four minimal empty Hub tables:
  catalogue_products
  powerbuild_price_tags
  busterbuild_price_tags
  price_tag_branch_prices

No application source code, production D1 migrations, real stock data, prices, QR links or existing functionality is changed. Both old stock controls and the new label generator keep their behavior.

INSTALL:
1. Extract this ZIP.
2. Copy the two files under maliks-operations/tests/ into exactly the same paths in your GitHub repository.
3. Commit and push; GitHub Actions should execute the full suite. Do not deploy any database migration for this fix.

VERIFICATION:
15 affected Phase 17 + 20 tests passed in a local Node.js run.
A broader local suite passed 322 tests; two test files could not load without the jose dependency. Your complete GitHub environment had already loaded those files and reported 334 passing / four failing, so rerun GitHub Actions to confirm all 338.
