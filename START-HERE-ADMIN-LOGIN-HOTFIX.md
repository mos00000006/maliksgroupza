# MALIKS POS PROFESSIONAL — PHASE 21 ADMIN LOGIN HOTFIX

**Purpose:** Repair the "Unexpected service response" during **Create / reset my own employee login** and let a verified Owner / Technical Admin choose a **permanent administrator password directly**. This is an **overlay on Phase 21**, not a new standalone POS.

## What this fixes

- Replaces the temporary-password administrator bootstrap button with **Set my administrator password** (password + confirmation).
- Uses the **existing verified Cloudflare Access identity** and the active **Owner / Admin** or **Developer / Technical Admin** Hub role. No hard-coded admin credentials, no public registration, and no ability to set another account's password.
- Stores only a salted PBKDF2 password hash in the existing Phase 21 D1 credentials table, invalidates older native sessions, and records an audit entry. No plaintext password is returned.
- Fixes a possible database failure for global administrators whose `department` is NULL/blank: the audit uses `Group Administration` instead of inserting a NULL branch.
- Checks that Phase 21 credential, session and audit tables exist; a missing migration now gives a specific **JSON 503** response instead of an uncaught HTML error.
- Handles private Core service-binding errors with JSON responses and displays the HTTP status when a non-JSON response occurs.

## Install on your existing Phase 21 GitHub repository

1. **Back up** the repository and the Cloudflare D1 database before changing authentication.
2. Extract the ZIP. Copy the included `.github` and `maliks-operations` directories into the corresponding folders at the root of your **existing** `maliksgroupza` repository. Merge changes, **do not create nested folders**. The four changed source/test files are listed below. If you have newer changes to these files, review/merge rather than overwriting them blindly.
3. The included Phase 21 SQL file is **idempotent** (`CREATE TABLE IF NOT EXISTS`). The workflow applies `npm run migrate:phase21` **before** deploying the Core Worker. Keep the workflow's other deployment settings and GitHub secrets.
4. Run `npm test` from `maliks-operations` and `npm run check` at the repository root (if available). Fix errors before deployment.
5. Commit and push. In GitHub Actions, run **Deploy Maliks Department Applications**. Verify **Apply employee password and session schema (Phase 21)**, **Deploy central API**, and **Deploy Maliks Member Team** all succeed.
6. Open `https://maliks-member-team.moyanamoses006.workers.dev` in Chrome and hard refresh (`Ctrl+Shift+R`). Sign in through your **existing Cloudflare Access Owner / Technical Admin** identity. In **Employees and store access**, find **Set my administrator password**, enter and confirm a strong personal password (14–128 characters), then submit.
7. Once it confirms the password was saved, in GitHub **Settings → Secrets and variables → Actions → Variables**, set `MALIKS_NATIVE_LOGIN_APPS` to `management` (if you have not already). Redeploy. Sign in to Maliks POS Professional with the **same administrator email** and the password you chose.

**Keep Cloudflare Access enabled** throughout the rollout. You may temporarily see Cloudflare Access and employee sign-in as two steps. **Do not set `MALIKS_NATIVE_LOGIN_APPS=member` before the initial administrator password is created**, because the bootstrap endpoint requires a verified Access session.

## Troubleshooting

- **403 Administrator access required:** your Cloudflare Access email must match an **active** `team_members` record with role **Owner / Admin** or **Developer / Technical Admin**. Check the existing Hub assignment; do not add a new unrestricted admin from a store-manager form.
- **503 Phase 21 password tables are missing:** the Phase 21 migration was not applied to the same D1 database used by Core. Confirm GitHub's migration step and the D1 binding. Do not delete or recreate your production database.
- **503 Core service unavailable:** check the central API Worker deployment and Cloudflare logs.
- **Non-JSON response (HTTP code):** a Cloudflare Access page, upstream failure or stale Worker may be returning HTML. Check the reported HTTP code and the latest deployment.
- **Password set but POS still shows Cloudflare Access login required:** verify the `management` rollout variable was set and the latest workflow redeployed both Core and the POS Worker. Refresh the browser/desktop wrapper.

## Changed files

- `maliks-operations/src/password-auth-domain.mjs`
- `maliks-operations/src/core.mjs`
- `maliks-operations/src/frontend.mjs`
- `maliks-operations/tests/phase21-password-login.test.mjs`

## Included deployment support (unchanged from Phase 21)

- `.github/workflows/deploy-maliks-operations.yml`
- `maliks-operations/package.json`
- `maliks-operations/sql/phase21_staff_password_login.sql`

## Validation performed

- `npm test`: **177 passed, 0 failed** in the local Phase 21 source tree.
- `node --check`: changed source files passed.
- Chromium browser smoke: administrator password form submitted, success message displayed, no JavaScript errors.
- **Not deployed to live GitHub/Cloudflare** and no production D1 data was changed. This hotfix cannot establish the precise cause of the live error without the failed HTTP response or Worker logs; it addresses the unhandled error path and a concrete nullable-branch issue.

## Rollback

Revert the changed source files to the previous Phase 21 commit and redeploy. Keep the D1 tables; they are additive. If native sign-in fails, unset `MALIKS_NATIVE_LOGIN_APPS` and redeploy, retaining Cloudflare Access.
