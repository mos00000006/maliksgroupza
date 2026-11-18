MALIKS POS — SUPPLIERS MASTER FILES (3 OPTIONS) — 18 NOVEMBER 2026

This patch activates:
  Suppliers > Master Files > Claims (supplier claim type/code register)
  Suppliers > Master Files > Suppliers Returns Reasons
  Suppliers > Master Files > Statements Recon Reasons

Each is a real, branch-scoped reference register with create, edit, deactivate,
search and audited change history. Claim types are NOT supplier claim transactions;
there is no credit note, inventory, AP, VAT or general ledger posting.

REPLACE / ADD THESE FILES at the root of your existing GitHub project:
  maliks-operations/src/frontend.mjs                    REPLACE
  maliks-operations/src/reference-master-domain.mjs    REPLACE
  maliks-operations/sql/phase34_supplier_extended_masters.sql   ADD
  maliks-operations/package.json                        REPLACE (adds migrate:phase34 script)
  maliks-operations/tests/phase34-supplier-master-files.test.mjs ADD

IMPORTANT: Before using the screens, run the new additive Phase 34 database migration
from the maliks-operations directory using an authorised terminal:
  npm run config
  npm run migrate:phase34

The usual Cloudflare Wrangler environment/configuration must be available.
Do NOT run the migration if .generated/core.json points to the wrong database.
Deploy the Core worker and POS worker after the migration:
  npm run deploy:core
  npm run deploy:pos

Your existing deployment procedure may handle config and deployment separately.
GitHub committing/pushing alone does NOT automatically execute this Phase 34
migration because the new SQL file is not part of the Hub's standard migrations.

Validation: 9/9 focused reference-master tests passed. Full operations suite:
290/292 passed; the other two involve unavailable 'jose' dependency in local
execution environment, not this patch. Node --check passed for both changed JS files.

No financial posting is introduced.
