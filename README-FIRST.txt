MALIKS GROUP HUB — UG MUST HAVE ITS OWN DEPARTMENT (2026-11-03)

ROOT CAUSE
The previous classifier tested PIPE first. Example PIPE UG 110MMX6M was deliberately
placed under Plumbing Pipes; its test also required that incorrect behaviour.
Further, the Hub category filter searches D1 stored categories directly, not PDF labels.

FIX IN THIS ZIP
1. app/catalogue-pdf-grouping.ts: UG (including pipes) takes precedence over Plumbing Pipes.
2. drizzle/CATALOGUE_UG_DEDICATED_DEPARTMENT.sql: updates every active clearly marked UG
   product in the live DB, not just the old 212-code imported subset.
3. app/catalogue-ug-category.ts + scripts/install-ug-category-guard.py:
   prevents future new/edited UG products from being saved under Plumbing.
4. tests/catalogue-ug-exclusive.test.mjs: regression tests for UG, UG pipes, other products.
5. tests/catalogue-deep-classification.test.mjs: replaces the obsolete assertion that UG
   pipes belong in Plumbing Pipes (this test is only appropriate if the previous deep
   classification test is currently installed).
6. audit/: SQL for before/after checks and examples of identifiable UG stock codes.

GITHUB INSTALLATION
A. Backup current GitHub code and your live D1 database.
B. Copy app/catalogue-pdf-grouping.ts and app/catalogue-ug-category.ts into app/.
C. Copy scripts/install-ug-category-guard.py into scripts/ then run from repo root:
      python scripts/install-ug-category-guard.py
   Script modifies only category assignment in app/api/catalogue/route.ts and
   app/api/catalogue/[id]/route.ts; reruns are safe. Do not replace latest API files.
D. Copy tests/catalogue-ug-exclusive.test.mjs into tests/. Replace the previous
   tests/catalogue-deep-classification.test.mjs with the supplied test IF present.
E. Run npm run check. Resolve any pre-existing lint/build failures separately.
F. Before applying SQL: inspect audit/UG_BEFORE.sql on the live D1 database.
G. Copy drizzle/CATALOGUE_UG_DEDICATED_DEPARTMENT.sql into drizzle/ once.
   Migration tooling may automatically apply ALL files in drizzle. Backup first.
   To apply directly using Wrangler instead of migrations, use the SQL file with
   wrangler d1 execute --file against your database (but do NOT also install it
   as a migration if already executed directly).
H. Run audit/UG_AFTER.sql: the first query MUST return ZERO rows.
I. Reload Hub, select Underground (UG); check PIPE UG 110MMX6M appears there,
   not under Plumbing or Plumbing Pipes, and regenerate the PDF and leaflet.

LIMITS: This classification deliberately matches whole-word UG / UNDERGROUND in the
product name or an explicitly UG category. Unknown abbreviations not in product name
need a current D1 export to classify safely. Changes to the live database cannot be
performed from this ZIP alone. Pricing/images are not touched.
