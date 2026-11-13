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

## Important domain verification

You requested `https://maliks-sales.moyanamoses.workers.dev`.

**Verify the Cloudflare account's actual `workers.dev` subdomain before deploying.** Previous project documentation listed `moyanamoses006.workers.dev`. Cloudflare automatically appends the account's configured subdomain to the Worker name. Deploying `maliks-sales` creates `maliks-sales.<your-actual-subdomain>.workers.dev`; a Worker config cannot independently choose `moyanamoses.workers.dev` unless that is the account's actual subdomain.

If your account is still `moyanamoses006.workers.dev`, the resulting address will be `https://maliks-sales.moyanamoses006.workers.dev` instead. Do not assume the requested hostname is live until you verify it in Cloudflare Workers & Pages.

## Required Cloudflare Access setup (before deploying)

This Phase 14 implementation intentionally **reuses the existing `CF_ACCESS_AUD_POS`** so no additional secret or Core API policy changes are required. In Cloudflare Zero Trust → Access → Applications, edit the **existing Maliks POS self-hosted application** to include the new `maliks-sales.<actual-subdomain>.workers.dev` hostname in the SAME Access application, preserving the existing identity and Sales/management access policies. Ensure the existing `maliks-pos.<actual-subdomain>.workers.dev` hostname remains protected.

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

Do not upload this README or patch file into `maliks-operations/src/`. Do not delete `maliks-pos` or the original Hub Worker. If your repository has changes since Phase 13, merge rather than overwrite the modified files.

## Deployment

After uploading and committing the files, run GitHub Actions → **Deploy Maliks Department Applications** → **Run workflow**. Confirm the Worker names are safe to deploy. The workflow will generate `.generated/sales.json` with `name: maliks-sales`, `APP_TYPE: sales`, and the existing `CORE` service binding, then deploy it alongside the other department Workers.

The worker is not live until the GitHub workflow succeeds. Cloudflare Access hostname protection must also be in place.

### Verify in browser

1. Sign into `maliks-pos.<actual-subdomain>.workers.dev`: top nav shows Home, Debtors, Suppliers, Stock, Back Office, Dispatching, Head Office, System Settings, Widget, Help, Lock, Exit. No Sales button, no Sales home card or Sales CTA.
2. Confirm POS `/api/catalogue` and `/api/quotes` return 403 (they are intentionally not accessible through the management Worker).
3. Sign into `maliks-sales.<actual-subdomain>.workers.dev`: it opens **Maliks Sales** directly (no accounting suite top menu).
4. Search a product, create a **test** quotation, and print its 80mm **NOT PAID** slip. Check the quote is branch-scoped and visible in its recent quotations.
5. Confirm existing Tills, Cash Office and Dispatch URLs still work and have their original department permissions.
6. Check Cloudflare Access prevents unauthorised visitors from viewing both application pages and unauthorised users from calling the APIs.

## Local verification performed

- 117 automated Node tests passed on the Phase 13-based workspace.
- Five generated browser module scripts passed `node --check`.
- Configuration generation dry-run created `maliks-pos`, `maliks-sales`, `maliks-tills`, `maliks-cash-office`, `maliks-dispatch` and private `maliks-core-api` Worker configurations.
- No live Cloudflare deployment or production login has been performed.

## Security notes

This change intentionally does **not** alter the Core API, D1 schema, Access JWT verification, receipt posting or department permissions. Both POS Professional and Sales use the existing POS Access audience, but only the Sales frontend proxies Sales API operations. When a separate Sales Access application/audience is desired later, it requires an explicit Core authorization update and a new `CF_ACCESS_AUD_SALES` secret.
