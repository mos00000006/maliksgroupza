# MALIKS POS — BRANCH SELLING PRICES + CASH-UP ACTIVATION (PHASE 22)

## Scope
This is a source-code patch for the **existing `maliks-operations/` subproject** of the `maliksgroupza` GitHub repository. It does not replace the main Group Hub and must not be uploaded to the root of the site.

### 1. Editable branch selling prices
- Main POS -> Stock -> Stock Master -> double-click a linked product.
- Authorised Store Managers, Regional Managers, Operations Managers, Owners/Admins and Developer/Technical Admins can edit **Selling price (R)**.
- Stock Controllers may still edit stock settings, but may **not** change selling prices.
- A positive selling price saves to `price_tag_branch_prices` for the exact branch and brand.
- The Stock Master register, Sales search and quotation validation all read that same branch price.
- The product's name/code are still owned by the Group Hub; the recorded quantity on hand remains read-only and requires an approved stock operation.
- Every change creates a branch master audit entry and checks the version. A stale change is rejected.

### 2. Activated Cash-Up workflows
- **Tills -> Close / Cash-Up**: cashiers open/close their assigned shifts and declare the end-of-shift counted cash; this remains the original guarded shift register.
- **Cash Office -> Cash-Up**: replaces the old provisional tender-preparation screen with a shift reconciliation register using cashier-confirmed, recorded sales.
- **Main POS -> Back Office -> Cash-Up -> Till Cash-Up**: opens the independent secured Cash Office Cash-Up screen (passes branch in a URL, but all branch access is re-checked server-side).
- Expected cash = opening float + **CONFIRMED cash sales** for that shift (cash tender net of change).
- Shows counted cash, cash difference, confirmed card totals (cashier-attested only), and unresolved payment count.
- An independent Cash Office user may record **Cash count checked** only for a closed shift with zero variance and zero pending payments, or may flag the shift for investigation with a note.
- Reviews are append-only and audited. The cashier cannot review their own shift.
- Does **NOT** issue bank deposits, bank reconciliation, GL postings, invoices, tax invoices, card-settlement confirmations, refunds, dispatch releases or stock deductions.

## Install in VS Code / GitHub
1. **Back up the repo and the Cloudflare D1 database first.** Use a branch for review.
2. Extract the ZIP and copy the `maliks-operations/` folder into the same folder in `maliksgroupza`, merging and replacing only the files listed in the ZIP. Do **not** overwrite unrelated Hub, POS or Till files.
3. Check that Cloudflare D1 already has the Phase 4 shift, Phase 9 payment, Phase 10 cashier-confirmation, Phase 15 Stock Master, `catalogue_products`, price tag tables and `price_tag_branch_prices` tables. These are prerequisites from the existing system.
4. From the repository's `maliks-operations` directory, run:
   ```powershell
   npm install
   npm test
   ```
   Tests must pass before deploying.
5. Generate worker configuration if needed using the existing project setup:
   ```powershell
   npm run config
   ```
   Do not overwrite working Cloudflare secrets or Access policies.
6. **Apply the one new ADDITIVE Phase 22 D1 migration BEFORE deploying the changed Core Worker:**
   ```powershell
   npm run migrate:phase22
   ```
   The command uses the existing remote `maliks-group-hub-db` binding and `.generated/core.json`. Verify that this configuration is the correct Cloudflare account/database. Migration creates `maliks_p22_cashup_reviews` and an index only.
7. Deploy the affected Workers in order:
   ```powershell
   npm run deploy:core
   npm run deploy:pos
   npm run deploy:tills
   npm run deploy:cashoffice
   ```
   The Sales Worker code is unchanged; its catalogue and quotation routes use the updated Core Worker.
8. Sign in with a real store-manager account, select a branch, go to Stock Master, link the active catalogue if not already linked, then double-click an unpriced item and enter a price greater than R0.00. Save and refresh the branch table. In Sales, search the product to confirm the effective branch price.
9. Open an authorised cashier till shift, complete a *test-environment* cash sale, close the shift with a counted amount, then sign in separately as Cash Office. Verify Cash-Up register figures and an independent review. Never test by posting a fictitious payment against a live customer.
10. Verify restricted users cannot edit selling prices, cannot review their own shift and cannot access another branch.

## Technical verification performed for this patch
- `npm test`: **198 passed, 0 failed** using the local source tree.
- Five new tests cover branch-price posting, role restrictions, reconciled-cash calculations, pending-payment protection, self-review and cross-department access.
- The underlying live Cloudflare D1 state and deployment are **not changed**.

## If selling price still shows R0
- Ensure you select the correct branch and the product is **linked** to the branch. Press `Link Hub catalogue to branch` in Stock Master if necessary.
- Check you have a manager role granted in the team access controls, not only Stock Controller.
- Confirm the Core Worker and POS Worker were BOTH redeployed after this patch.
- Confirm the `price_tag_branch_prices` table exists in the same D1 binding as the POS worker Core.
- If the price is changed through Hub Price Tag Studio at the same time, refresh before retrying; a stale price is rejected.

## If Cash-Up cannot load
- Confirm Phase 22 migration ran successfully on the target D1 database.
- Confirm both `maliks-core-api` and `maliks-cash-office` Workers were redeployed.
- Confirm the account is assigned to the Cash Office app and correct branch.
- Check till shifts are closed and payment records have confirmed or pending status.
- `Cash count checked` never means card/bank settlement or complete financial reconciliation.

## Rollback
- Revert the changed source code using Git if required. The Phase 22 database table is additive and can remain without affecting existing features.
- Do not delete existing payment, shift or stock records.
