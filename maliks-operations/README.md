# Maliks Operations — Phase 1 Independent Workers

This package is designed to be added to the EXISTING Maliks Group Hub GitHub repository **without replacing the Hub, changing its database schema, or modifying its current deployment**.

## What is provided

| Worker | Public address after deployment | Phase 1 activity |
|---|---|---|
| `maliks-core-api` | None (service binding only) | Verifies Cloudflare Access JWTs, checks Hub team roles and branches, uses the existing D1 database |
| `maliks-pos` | `https://maliks-pos.moyanamoses006.workers.dev/` | Branch-specific priced catalogue search; quotation basket; saves quotations to existing `till_quotation_submissions` table |
| `maliks-tills` | `https://maliks-tills.moyanamoses006.workers.dev/` | Branch-scoped quotation lookup only; **no payments** |
| `maliks-cash-office` | `https://maliks-cash-office.moyanamoses006.workers.dev/` | Branch-scoped quotations queue; **no payment authorisation** |
| `maliks-dispatch` | `https://maliks-dispatch.moyanamoses006.workers.dev/` | Separate role/branch-scoped dispatch shell; **no operational posting yet** |

The hostnames assume the existing `moyanamoses006.workers.dev` Cloudflare account subdomain, which the user supplied. They are not deployed by distributing this ZIP.

The existing Hub currently has a `Sales / Tills` demonstration at `/tills` and APIs under `/api/tills`. **Leave those in place temporarily**. A later controlled cutover will remove them from the management Hub after the standalone tools are tested by actual users. The existing original `wrangler.jsonc` at Hub repository root says `maliks-pos` even though the Hub's live deployment uses generated Vite config. Do not use or overwrite that root config to deploy these new Workers; use the generated configs under this package instead.

## Core architecture

- Five *separate Cloudflare Workers* deployed from one GitHub repository.
- The four department Workers communicate with `maliks-core-api` using a **Service Binding** (not a public HTTP API).
- Only the core Worker holds the existing Maliks D1 binding. Data remains central, not copied across four databases.
- Every API request must include a **cryptographically verified Cloudflare Access JWT**. Each application has its own audience, so a POS session cannot be reused as Cash Office access.
- The core checks `team_members.active`, department role, `workspace_access`, and active `Store` workspaces before returning branch data.
- No production shortcuts or guessed JWT identities. Invalid, unsigned, missing or expired Access assertions are rejected.
- Any quota or database error is a failure, never an empty/paid success response.

## Before deployment — Cloudflare One Access

Create **four self-hosted Access applications**, each protecting one Worker hostname. Under Cloudflare Zero Trust > Access controls > Applications:

1. `Maliks POS` => `maliks-pos.moyanamoses006.workers.dev`
2. `Maliks Tills` => `maliks-tills.moyanamoses006.workers.dev`
3. `Maliks Cash Office` => `maliks-cash-office.moyanamoses006.workers.dev`
4. `Maliks Dispatch` => `maliks-dispatch.moyanamoses006.workers.dev`

Choose restrictive **Allow** policies for real employees (and optionally a small approved test group). Retrieve each application's **Application Audience (AUD) tag** from its Access application settings. Each AUD is distinct. Do not use an "Everyone" policy for the operational systems.

Cloudflare Access is an outer login gate; the database-backed role and branch checks inside the core are also mandatory. The app will show `No active department and branch assignment` unless its signed-in email exists as an active Hub `team_members` entry with an accepted role and matching Store assignment. Supported roles are declared in `src/policy.mjs` and should be aligned with your approved HR/permissions structure before go-live.

## GitHub secrets to configure

Most existing Hub repos already have the first four. **Do not post their values in chat or add them to tracked files**.

| Secret | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare token with required Workers script & D1 deploy permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your existing Cloudflare account ID |
| `MALIKS_GROUP_D1_DATABASE_ID` | The **existing** `maliks-group-hub-db` UUID (never create a separate production DB) |
| `CF_ACCESS_TEAM_DOMAIN` | Your `https://YOUR-TEAM.cloudflareaccess.com` team domain |
| `CF_ACCESS_AUD_POS` | Access AUD for Maliks POS |
| `CF_ACCESS_AUD_TILLS` | Access AUD for Maliks Tills |
| `CF_ACCESS_AUD_CASHOFFICE` | Access AUD for Maliks Cash Office |
| `CF_ACCESS_AUD_DISPATCH` | Access AUD for Maliks Dispatch |

The generator refuses deployment when these values are not present. The `.generated` folder is ignored in Git; application audience identifiers are not authentication secrets but keeping configuration generated prevents accidental wrong deployment.

## Deploy from GitHub (preferred)

1. Download `maliks-operations-phase1-github.zip` and extract it.
2. Upload **the complete `maliks-operations/` folder** to the root of your existing Maliks Group Hub repository.
3. Upload `.github/workflows/deploy-maliks-operations.yml` to your repo's `.github/workflows/` folder.
4. Commit on a branch, review the changed files, then merge. Your existing Hub `deploy.yml` is untouched; a commit may still cause its normal Hub redeployment.
5. In Cloudflare Workers & Pages, check whether `maliks-pos`, `maliks-tills`, `maliks-cash-office`, `maliks-dispatch` or `maliks-core-api` already exist. If any existing Worker is being used, do not overwrite it; adjust the planned name after consulting your developer. Add the new Access AUD tags as GitHub Actions secrets.
6. Open **GitHub > Actions > Deploy Maliks Department Applications > Run workflow**, and check the worker-name confirmation only after completing step 5.
7. The workflow tests, generates configs, deploys the private core first, then the four department Workers.
8. Visit each new URL using an authorised employee account. Confirm another department's account is denied. Confirm assigned branch scoping, price results and quotation handover.

**Do not disable the existing `/tills` route until the new POS quote and Cash Office queue pass a real test.** Do not enable till payments or dispatch stock movements based on this Phase 1 package.

## Local testing

From `maliks-operations`:

```sh
npm install
npm test
```

Deployment configurations are generated only after the environment variables described above are provided:

```sh
npm run config
npm run deploy:core
npm run deploy:pos
npm run deploy:tills
npm run deploy:cashoffice
npm run deploy:dispatch
```

`npm test` contains isolated policy and quote arithmetic tests; it does **not** simulate production D1, a real Access login, actual payment devices or the live Cloudflare deployment. QA in the four apps remains required.

## Readiness & planned Phase 2

Current status:
- POS: **quotation document creation only**. Original Hub quote table and published branch prices reused. No sale, tender, tax invoice, stock reservation or stock decrement.
- Tills: **read-only quotation lookup**. No real payment or tax invoice.
- Cash Office: **read-only quote review queue**. No "paid" label or payment confirmation.
- Dispatch: **secured interface foundation**. No picking, bay assignment, POD or dispatch posting.
- Management Hub: **unchanged in Phase 1**. Not yet "management-only" — migrate the user interface and routes after the cutover.

Next build sequence: (1) cashier payment ledger and transaction idempotency, (2) signed invoicing / journal entries / shift cash-up, (3) dispatch pick-check-POD controls, (4) management-only Hub interface showing cross-department statuses and approving exceptions, (5) remove legacy Hub operational pages and APIs after a supervised cutover.

## Validation / safety

Never use the demo POS for real payments. Maintain backups of the existing D1 before real live workflows and test quote writes with a test account and a known branch. The quote submission route creates `till_quotation_submissions` only if absent, matching the source Hub's existing table shape. There are no other schema migrations in this package.
