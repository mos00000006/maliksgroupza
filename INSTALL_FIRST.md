# Maliks POS Professional — Debtors Settings + Numbering (Phase 33)

## Install
1. Open `mos00000006/maliksgroupza` and use the **main** branch.
2. Extract this ZIP **at the repository root**, retaining the `maliks-operations/` and `.github/` folders. Replace existing matching files and add new files.
3. Commit and push to `main`.
4. Open GitHub Actions → `Deploy Maliks Department Applications` (`.github/workflows/deploy-maliks-operations.yml`). Click **Run workflow**, select `main`, and confirm the existing Worker names when prompted.
5. Wait for **npm test**, **npm run config**, **Apply Debtors branch settings and numbering schema (Phase 33)**, **Deploy central API**, and **Deploy Maliks POS Professional** to pass. Do not treat a failed migration as deployed.
6. Open `https://maliks-pos.moyanamoses006.workers.dev/`, sign in to POS Professional, choose an authorised branch, and go to **Debtors → Settings → Settings** or **Debtors → Settings → Numbering**.

## Activated features
### Settings
- Branch defaults: payment terms (0–365 days), default credit limit, statement cutoff day (1–28), invoice note and statement note.
- **Payment terms and credit limit prefill the New Debtor form only.** Staff can still edit those values.
- Existing debtor records and documents are never rewritten.
- Statement cutoff and saved invoice/statement note text are NOT automatically applied to statements/invoices; these require subsequent document-generation integration.
- Audited edits with optimistic version control. Authorised Debtors managers only.

### Numbering
- Six separate branch-controlled series: Debtor Account, Payment Preparation, Reversal Request, Journal Preparation, PDC Register, Group Settlement.
- Custom prefix (e.g. `DBT-`), minimum numeric width (4–10), and forward-only next-value configuration.
- **Reserve next reference** increments a series atomically in Cloudflare D1, stores who reserved it, and prevents reuse. A retried request ID returns the same reservation.
- Existing numeric IDs and Q-/invoice numbering remain untouched. Reservations must currently be entered manually into the associated records; no automatic numbering claim is made.
- Prefix and width are locked after the series has reserved a number, to preserve reference integrity.

## Safety controls
- Core API, authenticated employee context, branch scope, manager write permission and same-origin validation.
- Read-only access for authorised management staff who lack editing permission.
- No payment, VAT, debtor balance, invoice, stock or GL posting.
- Additive SQLite/D1 tables only; migration is rerunnable.
- No new Cloudflare secrets or Access policy edits.

## Files installed
- `maliks-operations/src/frontend.mjs` (POS menu, browser UI wiring and protected proxy)
- `maliks-operations/src/core.mjs` (new private API routes)
- `maliks-operations/src/debtor-settings-domain.mjs` (new)
- `maliks-operations/src/debtor-settings-ui.mjs` (new)
- `maliks-operations/sql/phase33_debtor_settings_numbering.sql` (new)
- `maliks-operations/tests/phase33-debtor-settings.test.mjs` (new)
- `maliks-operations/tests/phase33-debtor-settings-ui.test.mjs` (new)
- `maliks-operations/package.json` (migration command)
- `.github/workflows/deploy-maliks-operations.yml` (apply Phase 33 migration before Core deployment)

## Tests
- 17 new Phase 33 tests passed locally.
- 61 targeted and regression tests passed locally across Phases 29–33.
- Complete GitHub Actions test suite and production deployment must still be confirmed.

## Source/version protection
The patch was based on current `main` file revisions at creation:
- `maliks-operations/src/frontend.mjs`: `77f6ada8ab4a7bbe68709c69c9ca153b89e10409`
- `maliks-operations/src/core.mjs`: `2f0d6cbd3737671cb328c912f9f56c235352d8a9`
- `maliks-operations/package.json`: `f14df79ee02d4f81143181fd07057062cdcc68fc`
- `.github/workflows/deploy-maliks-operations.yml`: `1263f0a512c5200f0645c62ecc79dc8711e6cfa6`
If GitHub changes these files later, review the included diff and merge instead of blindly overwriting.
