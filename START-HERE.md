# Maliks Department Applications — Phase 2 Quotation Update

**For existing repository:** `mos00000006/maliksgroupza`  
**This is an incremental patch, NOT a replacement of Maliks Group Hub.**

## What is new

**Maliks POS**
- Remove individual quotation lines or clear the basket with confirmation.
- Change quantities within the backend's supported precision.
- Display ex-VAT, included VAT (15%), and VAT-inclusive totals.
- Submit a quotation with the same unique request ID if a network error makes the result uncertain. The pending request is locked until completed or deliberately released.
- See **My recent quotations** for the selected branch (restricted on the server to the signed-in salesperson), open itemised details and print a quotation.

**Maliks Tills and Cash Office**
- View up to 50 most recent quotations for the current authorised branch.
- Filter those displayed rows by quote number, customer, contact or status.
- Expand line-item details and print a quotation.
- **Read-only**. There are still NO payment, invoicing, cash-up, stock deduction or dispatch posting actions.

**Maliks Dispatch**: remains separate and unchanged as a restricted, non-transactional starter application.

## Upload ALL five files to GitHub

Use the directory structure **inside** the ZIP and preserve the existing files that are not listed below:

1. REPLACE `maliks-operations/src/frontend.mjs`
2. REPLACE `maliks-operations/src/core.mjs`
3. REPLACE `maliks-operations/src/quote-domain.mjs`
4. REPLACE `maliks-operations/tests/frontend.test.mjs` (updates the test expectation for the new button caption)
5. ADD `maliks-operations/tests/phase2.test.mjs`

**Do not delete or replace** `maliks-operations/src/powerbuild-logo.mjs`; your PowerBuild logo remains in use. Do not overwrite `.github/workflows`, Cloudflare secrets, `wrangler` configs, or the main Hub code.

The frontend and central API are one coordinated change. **Commit all five files before deploying.** For safety, edit them on a new GitHub branch and merge only after review, or commit them together using a local git client.

## Deployment

1. Confirm all five files are present and the PowerBuild logo module still exists.
2. Open **Actions → Deploy Maliks Department Applications → Run workflow**.
3. Choose the correct branch and tick the existing safe-worker-name confirmation.
4. Run once and inspect the tests and deployment steps.
5. Visit the URLs below, sign in, and refresh the pages with **Ctrl+Shift+R**.

- POS: https://maliks-pos.moyanamoses006.workers.dev/
- Tills: https://maliks-tills.moyanamoses006.workers.dev/
- Cash Office: https://maliks-cash-office.moyanamoses006.workers.dev/
- Dispatch: https://maliks-dispatch.moyanamoses006.workers.dev/

## Post-deployment smoke test (test data only)

1. Open POS on a test branch, search an existing product and add it to the basket.
2. Increase its quantity, verify net/VAT/total, remove the line, then add it again.
3. Set a TEST customer and submit one test quotation. Record the Q-number.
4. Open **My recent quotations**, check the Q-number and print preview, which MUST say QUOTATION and NOT a tax invoice.
5. Open Tills and Cash Office for the **same branch**; confirm that quote appears and that no payment or dispatch controls are offered.
6. Try a different branch: the quotation should not appear in the other branch's queue. Check salesperson-only POS history with a second staff account if possible.

**If the data is real, do not submit test quotations into the production database without your approval and an agreed test procedure.**

## Operational restrictions

- This code uses existing D1 tables; it creates **no migration** and uses no new secrets.
- The management Hub and its user interface remain unchanged.
- Payment processing, receipts/tax invoices, credit notes, cash-up and stock postings are NOT activated.
- A failed POST can have succeeded on the server. Retry uses the same request ID within the current page session. **If you refresh the page, check history before creating a new quote**; the in-memory pending request is not persisted after reload.
- The three client-side totals mirror the server's VAT-inclusive arithmetic. The server remains authoritative for price and amount checks.

## Testing

The supplied files passed `npm test` locally: **30 passed, 0 failed**. JavaScript syntax checks passed. This is not an end-to-end verification against the live Cloudflare D1 database or live authentication; carry out the smoke test after deployment.
