# MALIKS POS PROFESSIONAL — ALL DEBTORS MASTER FILES (PHASE 27 + 29)

**Cumulative replacement patch**: includes the original Phase 27 activation plus Phase 29. You do not need to install Phase 27 separately.

## What this patch activates

Within **Maliks POS Professional > Debtors > Master Files**, all eight formerly grey menu options become live:

| POS option | Stored register |
|---|---|
| Routes | Debtor Routes |
| Categories | Debtor Categories |
| Classifications | Debtor Classifications |
| Regions and Areas | Regions tab + Areas tab; each Area belongs to an active Region |
| Delivery Methods | Debtor Delivery Methods |
| Debtors Returns Reasons | Debtor Returns Reasons |
| Debtors Invoicing Classifications | Debtor Invoicing Classifications |
| Debtors Invoicing Additional Notes | Reusable note templates (up to 1,000 characters) |

Also retains Phase 27 **Suppliers > Master Files > Categories and Classifications**.

Each register supports: Add, edit, search, active/inactive, code uniqueness within each branch and register, read/write permissions, version checks and audit history. A Region cannot be deactivated while it has active Areas. **The master lists do not automatically change invoices, delivery jobs or debtor accounts**: linking selected codes to individual accounts and transaction templates is a separate feature.

## Install — from the repo root

1. Back up or commit current changes to `mos00000006/maliksgroupza`.
2. Extract this ZIP **into the repo root** so `maliks-operations/` and `.github/` match their existing folders. Merge and replace the nine listed files; do **not** create an extra nested `maliksgroupza/` folder.
3. Commit the files to `main` and push.
4. Go to GitHub Actions → **Deploy Maliks Department Applications** → **Run workflow**. Select `main`, tick the required Worker names confirmation, and run.
5. Confirm **npm test**, **migrate:phase27**, **migrate:phase29**, **Deploy central API**, and **Deploy Maliks POS Professional** all succeed (green).
6. Refresh `https://maliks-pos.moyanamoses006.workers.dev/` in Chrome. Open **Debtors > Master Files**, pick an authorised branch, and test each menu option.

## Files included

- `maliks-operations/src/frontend.mjs`: activates menu buttons, routes to record screens, includes new note editor.
- `maliks-operations/src/core.mjs`: management-only reference-master endpoints (Phase 27).
- `maliks-operations/src/reference-master-domain.mjs`: branch-scoped validation, CRUD and audits, with safe split storage for existing/new kinds.
- `maliks-operations/sql/phase27_reference_master_files.sql`: original base reference tables (additive).
- `maliks-operations/sql/phase29_debtor_extended_masters.sql`: additional debtor master table (additive; no rebuild of Phase 27).
- `maliks-operations/package.json`: migration scripts.
- `.github/workflows/deploy-maliks-operations.yml`: runs Phase 27 then Phase 29 before Core/POS deploy.
- `maliks-operations/tests/phase27-reference-master.test.mjs` and `tests/phase29-all-debtor-masters.test.mjs`: regression checks.

## Database safety / limitations

This patch **does not drop, overwrite or migrate existing debtor, supplier, posted invoice, till, stock or payment records**. Phase 29 uses a separate table because an existing Phase 27 table has a constrained kind column. Both migrations use CREATE IF NOT EXISTS and are safe to rerun.

Read and write requests are restricted to authorised `management` app users and assigned branches; debtor master permissions apply. Nothing in this patch changes employee passwords, Cloudflare Access secrets or department login settings.

## Verification and conflict prevention

In this environment, `node --test tests/phase29-all-debtor-masters.test.mjs` passed **7/7 targeted tests**. All changed JavaScript and test files passed `node --check`. The full GitHub suite and production deployment must still be confirmed by the GitHub workflow; the local npm install timed out.

The cumulative patch's existing files were based on the following *current GitHub main* blobs (checked 2026-11-18):

- `maliks-operations/src/frontend.mjs`: `608b8bb8bd45323d31c4e2a659d47a354714f1be`
- `maliks-operations/src/core.mjs`: `f31365796f164a42c9a1f0bfb592ad6be5478cab`
- `maliks-operations/package.json`: `43b1abc2d8c751c582b79a9e97d9910c0acbea3b`
- `.github/workflows/deploy-maliks-operations.yml`: `9bb3bfb85573398a719980243e57de4ee0b09c12`

If these SHA hashes changed after the patch was prepared, review and merge the latest changes rather than blindly overwriting them.
