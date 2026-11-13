# Maliks Operations — Phase 11: PAID Invoice Print + Dispatch Picker Slip

## What changes

**Cash Office**
- The payment queue is at the top of the Cash Office screen.
- A confirmed paid record displays **PAID** and the button **Print PAID customer invoice**.
- Printing fetches the paid invoice again from the authenticated Core API for the current branch; unconfirmed invoices will not print.
- A clean A4 PowerBuild document shows PAID, invoice number, quotation, date, customer, items, prices, VAT, total, payment type, and balance due R0.00.
- Invoice is labelled **INTERNAL** because the app does not yet hold all statutory tax invoice details.

**Dispatch**
- When Dispatch is open, it checks its confirmed, branch-limited invoice queue every 20 seconds.
- A new **AWAITING_PICK** paid invoice causes a notification pop-up with **Print picking slip**.
- The work queue also has **Print picking slip** on every job, for reprinting after dismissing the pop-up.
- The A4 PowerBuild picking slip has customer name, invoice, dispatch number, quotation, SKU codes, product descriptions, pick quantities, and sign-off spaces.
- Picker copy has NO product prices. Printing does not automatically mark the job picked, deduct stock, release goods or replace independent checking/POD.

**No changes** to payment confirmation, D1 migrations, database tables, Worker names, GitHub secrets, or main Hub.

## Upload these three files to GitHub

Repository: `mos00000006/maliksgroupza` (branch `main`). Download and unzip this update, then upload the files with the **same paths**, replacing the old ones. Use GitHub Code → navigate to folder → Add file → Upload files (or edit/paste when replacing an existing file):

1. `maliks-operations/src/frontend.mjs` **REPLACE**
2. `maliks-operations/tests/phase9.test.mjs` **REPLACE** (only the display-label assertions change)
3. `maliks-operations/tests/phase11.test.mjs` **ADD**

Do NOT replace `src/core.mjs` or `src/payment-dispatch-domain.mjs`. Do NOT upload `START-HERE.md` to a code location unless you want it as documentation.

## Deploy

1. Ensure you are using the Phase 10 cashier checkout release shown in your screenshots. If GitHub contains later custom edits to `frontend.mjs`, MERGE these modifications rather than overwriting them.
2. Commit the three files.
3. GitHub Actions → **Deploy Maliks Department Applications** → **Run workflow** on `main`. Verify Worker names and tick the confirmation checkbox.
4. Once the workflow succeeds, refresh Cash Office and Dispatch with Ctrl + Shift + R.
5. Cash Office: for a **CONFIRMED** payment, click **Print PAID customer invoice** and check the A4 print preview.
6. Dispatch: an outstanding paid job in AWAITING_PICK should trigger the notification. Click **Print picking slip** and check the picker copy. The same button is always available on the job card.
7. To test a **new** pop-up, use a NEW test quotation, confirm a permitted test payment in Tills, and leave the Dispatch screen open. It checks every 20 seconds. The notification is not an OS notification; it works in the opened Dispatch webpage. Do not use real goods for a test.

## Safety and accounting

- CASH/CARD fast checkout is still a **cashier declaration**, not independently verified card settlement.
- This is a **paid internal invoice**, NOT a validated statutory South African VAT tax invoice. Add legal entity details, address, VAT number and tax invoice controls before using it as a SARS tax invoice.
- Printed picker slip is **not** a goods release, proof of delivery, or inventory deduction.
- No changes are made to the production database by this patch itself.

## Local verification

101 automated Node tests pass, including four new Phase 11 checks, and all four rendered browser scripts pass Node syntax checks. External browser preview was blocked by the test environment. The patch has not been deployed to live Cloudflare.
