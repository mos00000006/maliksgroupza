# MaliksPOS — Independent Retail Sales App (Phase 1)

**Separate installable PWA / separate Cloudflare Worker / shared existing Hub D1.**

This is a production-oriented **quotation-only foundation**, NOT a complete Touch365-equivalent POS and NOT a payment-taking till. It intentionally cannot receive a payment, issue a paid invoice, decrement inventory, transfer stock, create a debtor balance or release goods. These operations need dedicated transaction APIs, authorised roles, double-entry ledger records and reconciliation before activation.

## What is implemented

- Independent `maliks-pos` Worker, dedicated installable PWA name/icon, clean desktop/tablet/mobile interface.
- Cloudflare Access JWT verification using a **new POS application audience** plus authoritative active Maliks Hub staff lookup.
- Branch-isolated sessions, role checks and management access. Sales / Tills users see only their authorised branch.
- Search all active Hub products by code and name; published price-tag prices with branch price overrides where configured.
- Display stock on hand **only where the branch inventory ledger is active and recorded**. No fictitious zero stock display.
- Quotation basket with three-decimal quantities, customer details, live line totals and 15% VAT-inclusive calculations.
- Server-side recomputation and revalidation of prices; tamper checks; atomic quotation insert; immutable product snapshot; idempotent request identifier.
- Quote history and printable customer quotes; pending Cash Office review indication. **This is a review queue, not a paid invoice.**
- Device-local offline drafts in IndexedDB after a verified login; no offline payment posting or inventory mutation.
- Planned-modules dashboard accurately showing full enterprise-POS roadmap without enabling unbuilt features.

## IMPORTANT before first production deploy

1. Upload the **contents of this directory** as a **new GitHub repository** (recommended `maliks-pos`). Keep your existing `maliks-group-hub` repo and Worker unchanged.
2. Edit `wrangler.jsonc`: set `d1_databases[0].database_id` to the **existing Maliks Hub D1 ID**; set `CF_ACCESS_TEAM_DOMAIN` to your real team URL; set `CF_ACCESS_AUD` to the **new MaliksPOS Access application AUD**. Do not enter an arbitrary string.
3. Create a **separate Cloudflare Access self-hosted application** for this Worker's hostname and assign approved staff. The app and its API must be protected. A staff member must also be `active=1` in the existing Hub `team_members` table, have an allowed role and an assigned active Store workspace.
4. Install Node 22. Run `npm install`, `npm run check`, `npm run config:check`, then `npx wrangler deploy`. Or configure GitHub secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` and push to main to run the included GitHub Action.
5. Cloudflare Workers > `maliks-pos` > **Custom Domains**: attach your POS subdomain, e.g. `pos.maliks.co.za` **only if you own/manage that DNS zone**. This should NOT replace the existing website, MX records or main Hub domain. Keep `maliks-pos.<account>.workers.dev` for testing if desired; protect all public hostnames through Access.
6. Open the app in Chrome/Edge, check login and pricing, then use the browser menu to **Install MaliksPOS** as a separate desktop/mobile application.

## Shared database prerequisites

The existing Hub migrations **0033**, **0035**, **0054** and **0055** must have been applied to the same database. Optional inventory display uses **0057**. Verify that published PowerBuild / Buster Build price tags and store names match your actual branches. Do NOT apply a second copy of migrations or point this app at a fresh empty D1 database.

The existing `till_quotation_submissions` schema stores the quote as `AWAITING_CASH_OFFICE`. The existing Hub Cash Office review surface can read this queue through its own authorised endpoint; it does **not** take or verify payments. A separate Cash Office Desk with server-verified paid invoices must be built before treating this as a complete POS sale.

## Local development

```bash
npm install
npm run check
npx wrangler dev
```

For local-only testing, create `.dev.vars` (do not commit) and set `LOCAL_DEV_AUTH=true` and `LOCAL_DEV_EMAIL=<existing active Hub member's email>`. This bypass is hard-disabled on non-localhost hostnames by the Worker; it never works on your live domain. Never commit employee emails or credentials.

## Security notes

- Cloudflare Access authentication is independently validated **at the POS Worker** and not trusted from browser data.
- Every query is restricted to assigned branches. Browser product prices are untrusted and checked against D1 on submit.
- `origin` and JSON content type are required for POSTs. An idempotency key prevents double quote creation on retry.
- Local drafts can contain customer names and numbers. Avoid shared kiosk/browser profiles, close the signed-in app when unattended, and periodically clear offline drafts per your privacy policy. Offline reopening after a browser restart requires online login again.
- Do not treat a quote (including a REVIEWED quote) as payment proof. Dispatch must separately check actual server-issued paid invoice status.

## Project files

`src/worker.mjs`: Cloudflare API, access and DB integration; `src/domain.mjs`: financial/permission rules; `public`: standalone responsive PWA; `tests`: unit/regression suite; `docs/`: rollout controls and roadmap; `.github/workflows/deploy.yml`: independent deployment pipeline.

## Initial deployment safety checks

Run quote creation with a test item priced at R115 VAT inclusive, check R100 net + R15 VAT, verify the new Q-reference, re-submit same request and confirm no duplicate. Test a restricted user cannot read another branch. Confirm the Hub's own quotation review receives the new record. A full payment scenario is **not supported** in Phase 1.
