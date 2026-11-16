# Maliks POS Professional — Department Dashboards and Direct-Open Workspaces

**Version:** 16 November 2026  
**Source baseline:** User's `maliksgroupza(10).zip` + the earlier `Maliks_POS_Premium_Dashboard_Checkout_PATCH.zip`.  
**Status:** Locally tested, not pushed to GitHub or deployed to Cloudflare.

## Included updates

- Sales: Premium dashboard, New Quotation and My Quotations as two separate screens.
- Tills: Dashboard, Cashier Checkout, Till Shift Register, Paid Invoices, Recent Quotations and unposted Tender Preparations. Each opens as its own view.
- Cash Office: Dashboard, Paid Invoice Audit, Shift Reviews, Provisional Cash-Up, Payment Evidence, Tender Preparations and Submitted Quotations. Each opens as its own view.
- Dispatch: Dashboard with a direct-open paid-invoice queue. Picking, checking, printed slips and the existing 20-second in-page polling are kept.
- POS management menus: When selecting e.g. **Debtors → Debtors**, the menu cards are replaced by the Debtors Master workspace. A **Back to Debtors** control returns to that menu. No scrolling down to a second, appended view.

## Branding preserved

- The real PowerBuild PNG is served from the **existing**, unchanged `/powerbuild-logo.png` asset.
- The top-left text is **MALIKS POS**; subtitle **ACCOUNTING & POS SOLUTIONS PROFESSIONAL**.
- Navy `#0A2A3F`; gold `#D4A017`; white and neutral greys.
- Icons are already-bundled official **Lucide SVGs** — no emojis, no AI logos or icons.
- `SECURE WORKSPACE`, logged-in staff info, branch selection and the existing Core Worker Access boundaries are preserved.

## Install in your current repository

1. Open VS Code in the **root** of `maliksgroupza` and make a backup branch. Back up `maliks-operations/src/frontend.mjs` before any replacement.
2. If your GitHub checkout matches the previously delivered premium POS interface, copy:
   - `maliks-operations/src/frontend.mjs` (updated)
   - `maliks-operations/src/department-premium.mjs` (new)
   - `maliks-operations/tests/phase14-separate-sales.test.mjs` (updated check for redesigned Sales)
   - `maliks-operations/tests/department-navigation.test.mjs` (new tests)
3. **If you have newer work in `frontend.mjs`: do NOT overwrite it wholesale.** Compare the current file to `frontend.mjs.patch`. The patch was verified against the previous supplied premium frontend, but it may not apply to changed GitHub HEAD. Merge the changes with care and keep the existing newer features.
4. The earlier premium POS dependencies must already exist:
   - `maliks-operations/src/pos-lucide-icons.mjs`
   - `maliks-operations/src/pos-premium-theme.mjs`
   - `maliks-operations/src/pos-premium-screens.mjs`
   These are **not modified** in this release.
5. Run checks in the VS Code terminal:

```bash
node --check maliks-operations/src/frontend.mjs
node --check maliks-operations/src/department-premium.mjs
cd maliks-operations
npm test
cd ..
npm run check
```

6. Commit and push only if checks pass. Use the existing **Deploy Maliks Department Applications** workflow and keep the old Worker deployment available for rollback.
7. Verify authorised staff can see **only assigned branches**, and test each department in a staging environment before live financial use.

## Tests completed

- **191 / 191** Node tests passed in the Maliks operations package (including the updated legacy Sales branding test and 3 new navigation tests).
- Browser checks using Chromium passed for **every top-level department route** (2 Sales, 5 Tills, 6 Cash Office, 1 Dispatch), direct workspace entry and return navigation, and POS Debtors → Debtors Master.
- No JavaScript page errors were observed in those local mocked-session checks.
- A previous premium frontend -> this release `frontend.mjs.patch` was applied to a clean previous version and compared byte-for-byte to the updated frontend; the two matched.
- **Not verified here:** complete monorepo `npm run check`, live Cloudflare Access sessions, live payment processing, D1 reconciliation, live cash-ups or deployment.

## Existing transaction boundaries

This is a **user-interface/navigation change only**. It does not create/alter accounting entries, database migrations, service bindings, payment validation, receipt APIs, inventory posting, stock release or driver POD logic. Cash Office's provisional cash-up is **not** a completed reconciliation. Tills' cashier confirmation remains staff-attested, not bank-confirmed. Dispatch's pick/check is **not** stock deduction or signed delivery POD.

## Previews

Separate HTML previews and PNG screenshots are included in the preview ZIP. They use an **explicit demo session and empty data** and do not authenticate, save transactions, or reflect live sales.
