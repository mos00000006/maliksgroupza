# MALIKS PHASE 14 — Split Maliks Sales into its own Cloudflare Worker

**Repository:** `mos00000006/maliksgroupza` (`main`)
**Baseline:** The Phase 13 Maliks POS Professional release. This is a **code package**, not a live deployment.

## Outcome

| Worker | Role | Application |
|---|---|---|
| `maliks-pos` | Main Maliks POS Professional suite | Accounting/stock/debtors/suppliers/back office/head office reference menus, no Sales button or Sales home shortcut |
| `maliks-sales` | Separate Sales workstation | Product lookup, VAT-inclusive quotations, quotation history, 80mm NOT PAID quotation slips |
| `maliks-tills` | Unchanged | Cashier payments and receipts |
| `maliks-cash-office` | Unchanged | Cash Office review |
| `maliks-dispatch` | Unchanged | Dispatch operations |
| `maliks-core-api` | Unchanged | Private shared API and database access |

**The Sales and POS Workers have separate URLs and UI surfaces.** Sales continues to use the existing POS Access audience and server-side Sales role/branch checks. The Professional suite is blocked at its own frontend API from accessing quotation/catalogue/payment endpoints. Neither app bypasses the private Core's JWT verification.

## Confirmed Sales hostname and PowerBuild branding

The correct Sales address is **`https://maliks-sales.moyanamoses006.workers.dev`**. The Worker name is `maliks-sales`, deployed under the existing Cloudflare account's `moyanamoses006.workers.dev` subdomain. The previous `moyanamoses.workers.dev` address was a typo and is **not** used in this package.

**Both Maliks POS Professional and Maliks Sales use the original PowerBuild logo** in their application header/sidebar and browser favicon. The gold `M` logo has been removed; the Professional home hero uses a subtle PowerBuild watermark. Existing PowerBuild-branded documents and thermal receipts are unchanged.

The hostname will only resolve after the `maliks-sales` Worker is deployed and its Workers.dev route is enabled. Confirm it in Cloudflare Workers & Pages; the Worker configuration uses the account's subdomain automatically.

## Required Cloudflare Access setup (before deploying)

This Phase 14 implementation intentionally **reuses the existing `CF_ACCESS_AUD_POS`** so no additional secret or Core API policy changes are required. In Cloudflare Zero Trust → Access → Applications, edit the **existing Maliks POS self-hosted application** to include the new `maliks-sales.moyanamoses006.workers.dev` hostname in the SAME Access application, preserving the existing identity and Sales/management access policies. Ensure the existing `maliks-pos.moyanamoses006.workers.dev` hostname remains protected.

If your Cloudflare Access configuration cannot protect both hostnames in the same application, **do not deploy Sales without first adapting the Core and adding a separate Sales AUD**. A new Access application with a different AUD will fail verification with this package; do not disable Access as a workaround.

The `maliks-sales` Worker must be protected by Cloudflare Access before staff use it. The frontend alone does not authenticate the static HTML route.

## Upload these files to GitHub at their exact paths

1. `maliks-operations/src/frontend.mjs` — replace
2. `maliks-operations/scripts/make-config.mjs` — replace
3. `maliks-operations/package.json` — replace
4. `.github/workflows/deploy-maliks-operations.yml` — replace **only if the current workflow matches the Phase 13 baseline**; otherwise merge the added `Deploy Maliks Sales` step
5. `maliks-operations/tests/frontend.test.mjs` — replace
6. `maliks-operations/tests/phase4.test.mjs` — replace
7. `maliks-operations/tests/phase7.test.mjs` — replace
8. `maliks-operations/tests/phase8.test.mjs` — replace
9. `maliks-operations/tests/phase12.test.mjs` — replace
10. `maliks-operations/tests/phase13-suite.test.mjs` — replace
11. `maliks-operations/tests/phase14-separate-sales.test.mjs` — **add**
12. `maliks-operations/tests/branding.test.mjs` — replace (new PowerBuild branding checks)
13. `maliks-operations/src/powerbuild-logo.mjs` — include/verify (original PowerBuild artwork served locally, no external image dependency)

Do not upload this README into `maliks-operations/src/`. Do not delete `maliks-pos` or the original Hub Worker. If your repository has changes since Phase 13, merge rather than overwrite the modified files.

## Deployment

After uploading and committing the files, run GitHub Actions → **Deploy Maliks Department Applications** → **Run workflow**. Confirm the Worker names are safe to deploy. The workflow will generate `.generated/sales.json` with `name: maliks-sales`, `APP_TYPE: sales`, and the existing `CORE` service binding, then deploy it alongside the other department Workers.

The worker is not live until the GitHub workflow succeeds. Cloudflare Access hostname protection must also be in place.

### Verify in browser

1. Sign into `maliks-pos.moyanamoses006.workers.dev`: top nav shows Home, Debtors, Suppliers, Stock, Back Office, Dispatching, Head Office, System Settings, Widget, Help, Lock, Exit. No Sales button, no Sales home card or Sales CTA.
2. Confirm POS `/api/catalogue` and `/api/quotes` return 403 (they are intentionally not accessible through the management Worker).
3. Sign into `maliks-sales.moyanamoses006.workers.dev`: it opens **Maliks Sales** directly (no accounting suite top menu).
4. Search a product, create a **test** quotation, and print its 80mm **NOT PAID** slip. Check the quote is branch-scoped and visible in its recent quotations.
5. Confirm existing Tills, Cash Office and Dispatch URLs still work and have their original department permissions.
6. Check Cloudflare Access prevents unauthorised visitors from viewing both application pages and unauthorised users from calling the APIs.

## Local verification performed

- 119 automated Node tests passed on the updated local workspace, including checks for PowerBuild logo and favicon in both applications.
- `node --check` passed for the updated frontend and deployment scripts.
- Configuration generation dry-run created `maliks-pos`, `maliks-sales`, `maliks-tills`, `maliks-cash-office`, `maliks-dispatch` and private `maliks-core-api` Worker configurations.
- No live Cloudflare deployment or production login has been performed.

## Security notes

This change intentionally does **not** alter the Core API, D1 schema, Access JWT verification, receipt posting or department permissions. Both POS Professional and Sales use the existing POS Access audience, but only the Sales frontend proxies Sales API operations. When a separate Sales Access application/audience is desired later, it requires an explicit Core authorization update and a new `CF_ACCESS_AUD_SALES` secret.
