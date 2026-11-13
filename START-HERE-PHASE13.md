# MALIKS POS PROFESSIONAL — Phase 13: Sales rename + suite home and top navigation

**Base:** Maliks Operations Phase 12 (80mm thermal slips).  
**Repository:** `mos00000006/maliksgroupza`  
**Branch:** `main`  
**Affected Worker:** `maliks-pos` only (visible application renamed to **Maliks Sales** within the **Maliks POS Professional** suite).  
**Important:** This patch does **not** change the Worker name, Cloudflare Access audience, D1 schema, database bindings, APIs or existing department permissions.

## What the user will see

After the existing Cloudflare Access login and successful branch/role verification:

- A navy/gold Maliks-branded **ACCOUNTING & POS SOLUTIONS — PROFESSIONAL** masthead and custom Maliks monogram favicon.
- Touch365-inspired top module buttons: Home, Sales, Debtors, Suppliers, Stock, Back Office, Dispatching, Head Office, System Settings, Widget, Help, Lock and Exit.
- A Maliks POS Professional landing dashboard, with links to module menu inventories.
- **Sales** opens the existing functional product search, VAT-inclusive quotation basket, quotation history and 80mm quotation printing.
- Sales navigation also shows the reference headings Sales Orders, Reprint Documents and Reporting as future functions.
- Reference menu inventories for Debtors, Suppliers, Stock, Back Office, Dispatching and Head Office, based on the provided screenshots. Some proposed entries require confirmation from deeper screenshots.
- Clear 'not yet connected' messages for functions without a live backend. They do **not** post financial or stock transactions.
- Lock/Exit request the Cloudflare Access application logout endpoint, with confirmation for unsaved Sales work.

**Already-operational separate Workers remain separate:** Maliks Tills, Maliks Cash Office, Maliks Dispatch. They are **not** silently merged into the Sales Worker and their department-specific login/security controls remain intact. The new suite displays navigation for these areas but does not provide unauthorised cross-app access.

## GitHub installation (simplest)

Open `mos00000006/maliksgroupza` in GitHub. From this ZIP upload/replace the files at the **exact repository paths**:

1. `maliks-operations/src/frontend.mjs` — replace (based on Phase 12 source)
2. `maliks-operations/tests/phase4.test.mjs` — replace (updated old Phase 2 label expectation)
3. `maliks-operations/tests/phase7.test.mjs` — replace (updated old Phase 2 label expectation)
4. `maliks-operations/tests/phase8.test.mjs` — replace (updated old Phase 2 label expectation)
5. `maliks-operations/tests/branding.test.mjs` — replace (Maliks favicon in suite, existing PowerBuild logo retained for branch receipts)
6. `maliks-operations/tests/phase13-suite.test.mjs` — add (new navigation/brand/security tests)

**Do not upload** the README or patch into the source directory. Do not overwrite other files.

If the live repository has changes after Phase 12, do **not** blindly replace `frontend.mjs`. Use the included `MALIKS-PHASE13-REVIEW.patch` as a reviewable diff and merge with any newer changes. This patch does not include backend modules, database migrations, or external URLs.

## Verify and deploy

From the repository root:

```bash
cd maliks-operations
npm test
```

All **111 tests** passed in the prepared Phase 12-based workspace. All four generated browser scripts passed `node --check`. This is not a live browser/Cloudflare deployment verification.

Then commit the changes and open GitHub Actions → **Deploy Maliks Department Applications**. Run the workflow using the same approved Cloudflare configuration. The `maliks-pos` Worker receives the new suite shell. Tills/Cash Office/Dispatch retain their existing app pages because the new suite markup is POS-only.

After deployment, log in to the POS Worker and confirm:

1. Maliks POS Professional home appears **after successful session verification**.
2. Sales opens and can search products, save a test quotation and print its **NOT PAID** 80mm slip.
3. Tills and Cash Office are still isolated and existing paid receipts/dispatch queues behave as before.
4. Stock/Back Office/Head Office reference menus display and identify non-live actions as unconnected.
5. Lock/Exit reaches the Cloudflare Access logout flow. Test this on the actual protected domain.

## What's not yet implemented

The reference menus are a **UI/navigation foundation**, not a fully functioning Touch365 replacement. Debtors ledger, supplier accounts, GRV, stock valuation, month-end posting, accounting journals, multi-branch synchronization and the other unconnected actions still require database schemas, audited server APIs, role permissions, transaction controls and dedicated functional tests. Do not use the preview menus to infer that those workflows are live.

## Files

- `MALIKS-PHASE13-REVIEW.patch`: code diff against the Phase 12 baseline.
- `MALIKS-POS-PROFESSIONAL-PREVIEW.html`: optional offline visual demo with a **mock** session; no real login, database or API transactions. It is not a deployable production application.
