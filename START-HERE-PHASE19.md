# MALIKS POS PROFESSIONAL — PHASE 19
## Maliks Member Team + Store-Scoped Sales Access

**Repository:** `mos00000006/maliksgroupza`  
**Expected baseline:** Phase 18 (Hub catalogue + supplier invoice three-way match), installed successfully.  
**Status:** Local code package only. **Not installed in your GitHub, Cloudflare or live D1 database.**

## What this release does

- Deploys a **new independent Cloudflare Worker** named `maliks-member-team`, expected URL: **https://maliks-member-team.moyanamoses006.workers.dev** (hyphens; never spaces).
- Adds a **Maliks Member Team** staff screen: employee list, name/email/role entry, assigned branch, activation status and recent audit history.
- **Store Managers** may create employees with approved operational roles and deactivate employees **only at their own store**. Store managers cannot assign admin, finance-manager or other privileged management roles; cannot deactivate managers; cannot manage another branch; cannot deactivate themselves.
- **Owner / Admin and Developer / Technical Admin** can create managers and other approved staff roles, manage authorised branches and reactivate inactive staff. Owner/Admin roles themselves cannot be created from this app.
- The app updates the **existing Hub `team_members` table**, not a duplicate staff list. Each new employee receives `department=store`, `access_scope='Assigned workspace'` and `workspace_access=[store]`.
- Deactivation sets `team_members.active=0`, rather than deleting history. The Core Worker checks active status on **every API request**; inactive users immediately lose access to Maliks department API data even if their Cloudflare Access login cookie is still valid. Cloudflare Access sessions/policies may need separate revocation.
- Adds an append-only **`maliks_member_team_audit`** table with action, actor, target, branch, timestamps, before/after snapshots and unique request IDs.
- The **Maliks Sales** user interface now displays the salesperson's **name and assigned store**, not their role or a branch-count indicator. Ordinary sales employees are constrained server-side to their own department/store, even if a malformed Hub workspace assignment lists other stores.
- POS **System Settings → User Permissions / Branch Access** opens the separately secured Member Team Worker. It does not bypass the Member Team login.
- Existing PowerBuild branding and independent Sales, Tills, Cash Office and Dispatch Workers remain in place.
- Corrects two stale *test fixtures* (Phase 9/10) to use the current quotation format `Q-00000001` instead of obsolete `q000000001`. **No financial posting logic is modified.**

## Important limits

This phase **does not** complete every POS button or activate all financial modules. The stock/purchasing/GRV workflows from Phases 15–18 remain as implemented, but additional POS menus (supplier payments, creditors/debtors ledger, VAT, general ledger, cash-up and month-end) require separate accounting, reconciliation and reversal controls before live use.

The Member Team app **does not send email invitations** or automatically edit a Cloudflare Access policy that contains a fixed email allowlist. The employee must have an email address permitted by the relevant Cloudflare Access application (e.g. via a controlled organisation group/domain policy) and authenticate through Access. Do not weaken your Access policy to bypass this.

## BEFORE deployment: create the Cloudflare Access application

1. In Cloudflare **Zero Trust → Access → Applications → Add application → Self-hosted**, create a new app **Maliks Member Team**.
2. Its exact public hostname must be `maliks-member-team.moyanamoses006.workers.dev`.
3. Use a controlled Allow policy covering you and authorised Store Managers / Operations / Regional Managers. Do not grant every employee staff-management access.
4. Copy the new application's **Application Audience (AUD) Tag**. It is **different** from the existing POS and Sales audience.
5. In GitHub repository **Settings → Secrets and variables → Actions → Secrets**, create **`CF_ACCESS_AUD_MEMBER`** with the new AUD tag. Do not replace `CF_ACCESS_AUD_POS` or the other existing AUD secrets.
6. Verify the new Worker name `maliks-member-team` does not conflict with another Worker. The new app will not resolve until deployment succeeds.
7. Ensure Store Managers' existing Hub `team_members` records have the exact role `Store Manager`, `department` set to their store name, an active account, and an assigned workspace matching an active `workspaces` record of type `Store`.

## Installation: apply only to Phase 18 code

**Backup** your GitHub repo and make a restorable D1 backup/Time Travel bookmark first. Test against staging if possible. Do not delete or replace the original Hub, database or PowerBuild logo.

### Option A — apply reviewed patch

1. Download and extract the Phase 19 ZIP **outside** your repository.
2. Open the **`maliksgroupza` repository root** in VS Code.
3. Create a feature branch. In PowerShell:

```powershell
git switch -c feature/maliks-member-team
# Replace the path with the actual extracted ZIP folder.
git apply --check "C:\Users\YOURNAME\Downloads\MALIKS-POS-PHASE19\MALIKS-POS-PHASE19.patch"
git apply "C:\Users\YOURNAME\Downloads\MALIKS-POS-PHASE19\MALIKS-POS-PHASE19.patch"
cd maliks-operations
npm install
npm test
npm run config
cd ..
npm run check
```

**If `git apply --check` fails, STOP.** Your code differs from the Phase 18 baseline. Send the error and your latest source ZIP so we can merge rather than overwrite.

### Option B — copy the exact changed files

Extract the ZIP and copy the `.github/` and `maliks-operations/` folder contents to the **matching paths** at the root of the repository, merging folders. Do **not** nest the extracted folder under `maliks-operations`. If you made changes since Phase 18, compare/merge before overwriting.

**Changed / new paths:**

- `maliks-operations/src/team-domain.mjs` (new)
- `maliks-operations/src/core.mjs` (updated)
- `maliks-operations/src/frontend.mjs` (updated)
- `maliks-operations/src/policy.mjs` (updated)
- `maliks-operations/scripts/make-config.mjs` (updated)
- `maliks-operations/sql/phase19_member_team.sql` (new)
- `maliks-operations/package.json` (updated)
- `.github/workflows/deploy-maliks-operations.yml` (updated)
- `maliks-operations/tests/phase19-member-team.test.mjs` (new)
- `maliks-operations/tests/policy.test.mjs` (updated)
- `maliks-operations/tests/phase9.test.mjs` (test fixture correction)
- `maliks-operations/tests/phase10.test.mjs` (test fixture correction)

## Deploy to Cloudflare

1. Commit and push your reviewed changes to GitHub. Merge into `main` after checks pass.
2. Go to GitHub **Actions → Deploy Maliks Department Applications → Run workflow** (start a **new** run, not a rerun of the old workflow).
3. The workflow runs tests, generates seven Worker configurations, applies **Phase 19** audit migration to the **existing** `maliks-group-hub-db`, then deploys Core, POS, Sales, **Member Team**, Tills, Cash Office and Dispatch.
4. Confirm the Phase 19 migration and all seven deployments are green. Do not deploy the Core before the migration.
5. Open `https://maliks-member-team.moyanamoses006.workers.dev` and log in through Cloudflare Access.
6. Select Buster Build Protea Glen, add a **TEST** staff member with `Sales / Tills`, and confirm the new account appears only in that branch. Verify that the employee can log in to Maliks Sales *if their email is covered by its Access policy*.
7. Confirm the Sales screen displays the employee name and store only, and the employee cannot select another branch or open POS management, Cash Office or Member Team APIs.
8. Deactivate the TEST employee using the Store Manager login. Confirm that any subsequent Maliks API request from that user returns access denied; the staff record and audit history remain. Reactivation is reserved for owner/admin.
9. Test manager attempts to create `Owner / Admin`, to deactivate a Store Manager and to access another store: all must fail. Confirm owner/admin can see authorised branches.
10. Check existing Sales quotation, POS Stock Master, PO, GRV, Tills, Cash Office and Dispatch functionality still works.

## Local validation performed

- **157/157 Node tests passed** in the assembled Phase 18 + Phase 19 source test environment, including eight new Member Team tests.
- `node --check` passed on updated frontend, Core, team domain and config generator, and on the extracted browser script.
- Configuration generator dry-run produced `maliks-member-team` and a private Core config with `ACCESS_AUD_MEMBER`.
- No live Cloudflare deployment, authenticated browser session, email delivery or D1 production test has been performed. The Chromium smoke-test environment blocked navigation; do not claim a full browser end-to-end test.

## Rollout warning

The system is **not ready to replace your existing live accounting/POS** until all operational and financial modules, VAT/legal seller setup, opening balances, reversal controls, backups and branch-by-branch acceptance tests are completed. Do not enable payment or ledger posting simply to make a menu appear live.
