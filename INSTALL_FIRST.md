# Maliks POS Professional — Debtors Utilities (Phase 32)

## Scope
Activate the seven previously disabled entries under **Debtors → Utilities**, preserving **Debtors Master CSV/Text File Export** and all Phase 27/29/30/31 features.

### Functionality
1. **Current Agents:** audited, branch-specific directory of agents, with add, edit and active/inactive controls. This is not Member Team login administration.
2. **Block Sales:** record a manager/credit-controller sales-block flag and mandatory reason for an active debtor master account; audit all changes. **Important: Sales and Tills currently do not attach a debtor account code to walk-in sales. The flag is administrative only until the account-selection/checkout enforcement step is added. Do not assume blocked accounts are automatically refused at checkout.**
3. **Reprint Documents:** list branch quotations and confirmed internal pilot invoices, and print a copy with status and totals. Quotes are clearly marked NOT PAID; internal invoices do not automatically certify banking or statutory VAT compliance.
4. **Reprint Journals:** print copies of captured non-posting debtor journal preparations with clear `NOT POSTED` notice.
5. **Labelling:** select active debtor master records and generate an A4, eight-label-per-page filing sheet. The print layout uses the supplied Buster Build logo for Buster Build and PowerBuild for other branches.
6. **Delete Expired Quotations:** safely **archive** eligible unlinked quotations older than 90 days, with a mandatory reason and audit record. The quotation remains stored; it is NOT physically deleted or fully hidden from every legacy Sales/Tills screen. Quotes linked to any payment or invoice cannot be archived.
7. **Debtors Master CSV File Import:** download a CSV template, inspect and validate account data, create up to 50 **new** debtor master records at a time and retain master/utility audit history. Existing account codes block the entire batch; no existing customer is overwritten. The import does not create opening balances or financial transactions.

The existing **Debtors Master CSV/Text File Export** remains unchanged.

## Install into GitHub
1. Back up any uncommitted project changes.
2. Extract `Maliks_POS_Debtors_Utilities_Phase32_Activation_PATCH.zip` into the **root** of `mos00000006/maliksgroupza` (the folder containing `maliks-operations/`). Keep the directory layout intact. Replace matching files.
3. Commit and push changes to `main`.
4. Visit https://github.com/mos00000006/maliksgroupza/actions/workflows/deploy-maliks-operations.yml, run **Deploy Maliks Department Applications**, check the required worker-name confirmation, then run the workflow on `main`.
5. Verify **npm test**, **Apply Debtors utilities registers and audits (Phase 32)**, **Deploy central API**, and **Deploy Maliks POS Professional** succeed.
6. Open https://maliks-pos.moyanamoses006.workers.dev/ and select Debtors → Utilities, choose your assigned store, then test Current Agents and CSV Import using test-only account codes.

## Exact current GitHub base files checked
- `maliks-operations/src/frontend.mjs`: `300966f6ab608e85b88a4e103ab78cb4e0cc220e`
- `maliks-operations/src/core.mjs`: `1e26d46df5cda92c4ad4b67cbf5b2a2b809ce299`
- `maliks-operations/package.json`: `dd8e0f69c5cfb9094b72dc6db75b024c449cbe02`
- `.github/workflows/deploy-maliks-operations.yml`: `2fdfbc943dfbb1e9b904ed83dd6b713d326beac2`

If later edits change these files, merge them instead of blindly overwriting.

## Files included
- `maliks-operations/src/frontend.mjs` (menu activation, public proxy, Buster Build logo route, injected browser UI)
- `maliks-operations/src/core.mjs` (protected GET/POST utilities routes)
- `maliks-operations/src/debtor-utilities-ui.mjs` (seven browser workspaces)
- `maliks-operations/src/debtor-utilities-domain.mjs` (branch-scoped, server-validated utility operations)
- `maliks-operations/src/busterbuild-logo.mjs` (embedded supplied, resized PNG; no external image server)
- `maliks-operations/sql/phase32_debtor_utilities.sql` (additive migration)
- `maliks-operations/package.json` (migration command)
- `.github/workflows/deploy-maliks-operations.yml` (run migration before Core deployment)
- `maliks-operations/tests/phase32-debtor-utilities.test.mjs`
- `maliks-operations/tests/phase32-debtor-utility-ui.test.mjs`
- `PHASE32_CHANGES.diff` and this guide

## Data safety
- All mutations require POS management employee login, authorised branch and same-origin browser writes.
- Block / archive operations require a manager or credit controller.
- Database changes are additive and can be rerun.
- CSV import uses atomic D1 batches and audits; no upsert or financial posting.
- Archive is non-destructive, and no financial entry is posted.
- This patch creates **no posted debtor ledger, bank entry, invoice allocation, stock movement or general-ledger posting**.
- No new Cloudflare secrets are required.

## Testing
- Local: **44 targeted and regression tests passed, 0 failed** across the existing Phase 29–31 Debtors controls plus new Phase 32 functions.
- The entire GitHub CI suite and live Cloudflare deployment must still succeed. This ZIP has not been deployed automatically.
