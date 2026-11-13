# MALIKS POS PROFESSIONAL — PHASE 21
## Employee sign-in and Member Team temporary passwords

**Base required:** Phase 20 code (including all prior Phase 15–20 migrations and Phase 19 Member Team). This is an **overlay patch**, not a full repository. It is not installed on Cloudflare or GitHub by creating the ZIP.

### What changes

- The POS, Sales, Member Team, Tills, Cash Office and Dispatch pages show a branded **email + password sign-in** form when their private API returns HTTP 401.
- Member Team managers can **issue/reset temporary passwords** for ordinary employees assigned to their own store. Owner/Technical Admin can issue for authorised employees and bootstrap their own password using an **existing verified Cloudflare Access administrator session**.
- When a manager creates an employee, the screen immediately attempts to issue a temporary password; if that step fails, the employee is still created and the manager can click **Issue password**.
- Temporary passwords are randomly generated, displayed **once**, stored only as **salted PBKDF2-HMAC-SHA256 hashes** (600,000 iterations), and must be changed at first login. Employees choose a personal password of at least 14 characters.
- App-specific, 8-hour, `Secure; HttpOnly; SameSite=Strict` session cookies; tokens are hashed in D1; immediate revocation on reset and employee deactivation; login rate limits; origin checks; branch/role checks and audit records.
- Existing Cloudflare Access login continues to work **during migration**. A **per-application** rollout switch lets you test native sign-in for one application without locking out other departments.

**No plaintext employee passwords are saved to D1.** Store managers can reset ordinary staff credentials but cannot create management roles, reset management passwords, or manage other branches. Resetting a password revokes active sessions. Treat the temporary password as confidential; managers should deliver it directly to the employee.

### Changed files

- `.github/workflows/deploy-maliks-operations.yml` — migration and optional rollout variable
- `maliks-operations/package.json` — `migrate:phase21`
- `maliks-operations/scripts/make-config.mjs` — per-application native login setting
- `maliks-operations/sql/phase21_staff_password_login.sql` — **new**, additive credential/session/audit tables
- `maliks-operations/src/password-auth-domain.mjs` — **new**, password, session, audit, rate-limit logic
- `maliks-operations/src/core.mjs` — private authentication routes and session verification
- `maliks-operations/src/frontend.mjs` — sign-in, first-login password change, sign-out and Member Team controls
- `maliks-operations/src/team-domain.mjs` — session revocation on staff deactivation
- `maliks-operations/tests/phase21-password-login.test.mjs` — **new** tests

### Install and validate

1. **Back up** GitHub and your shared Cloudflare D1 database. Test a restore and use staging first for employee authentication changes.
2. Extract the ZIP outside your repository. Merge the included `.github` and `maliks-operations` folders into the same paths of the **existing Phase 20** repository. Do not create a second nested `maliks-operations` folder. If your code differs, review and merge the changes rather than blindly overwrite.
3. From `maliks-operations`, run `npm install`, `npm test`, `node --check src/core.mjs`, `node --check src/frontend.mjs`, and `node --check src/password-auth-domain.mjs`. From the repo root, run `npm run check` if available. Resolve **all errors**.
4. Confirm the existing GitHub Actions Cloudflare secrets, including `CF_ACCESS_AUD_MEMBER`. Keep GitHub variable `MALIKS_NATIVE_LOGIN_APPS` **unset** initially. Deploy via **Deploy Maliks Department Applications**. The workflow applies Phase 21 schema before deploying Core.
5. Sign in to Member Team with your existing Cloudflare Access admin identity. Owner/Technical Admin: click **Create / reset my own employee login** and save the temporary password privately. Use Member Team to issue credentials for store managers, then have managers issue credentials to their employees.
6. In GitHub **Settings → Secrets and variables → Actions → Variables**, set `MALIKS_NATIVE_LOGIN_APPS` to `management` to make **Maliks POS Professional** require a password login. Rerun the workflow. **Cloudflare Access still protects the hostname at this stage**, so you may temporarily see two authentication steps. Verify POS sign-in, first-login password change, sign-out, branch restrictions, invalid-password lockout, and deactivated staff rejection.
7. When ready, add application names one at a time: `management,member,pos,tills,cashoffice,dispatch` (where `pos` is the dedicated **Maliks Sales** Worker internally, and `management` is the **Maliks POS Professional** management Worker). Do not switch an app until its authorised users have passwords.
8. **Do not change any Cloudflare Access Allow/Bypass policy just to remove the Cloudflare login screen until native authentication has passed a staging security review.** Changing Access to Bypass makes the public Worker reachable without Cloudflare identity enforcement. The native login is intended to protect it, but that deployment choice requires review, WAF/rate-limit checks and a rollback plan. Keep Access during the initial rollout.

### Required acceptance tests before any live-only password switch

- Manager at Buster Build sees only Buster Build employees and can issue passwords only to allowed staff.
- Sales employee can sign in to Sales but **cannot** sign in to Member Team or management.
- New employee is required to change their temporary password; no operations work until they do.
- Resetting or deactivating an employee revokes every existing native session, even if they are later reactivated.
- Old password and expired session do not work; invalid credentials are rate-limited; no password is logged.
- Existing stock, PO, GRV, till, dispatch and other protected workflows remain branch-scoped.

### Verification performed locally

- 151 Node tests passed across the locally runnable test files, including 9 new password-auth tests. 2 existing test files import `jose` through `core.mjs` and could not be run in this isolated container because the dependency could not be downloaded. Therefore a **full `npm test` pass is not claimed**; your GitHub Actions run must pass before production deployment.
- `node --check` passed for changed JavaScript modules and extracted browser scripts.
- Chromium smoke tests displayed sign-in forms in POS, Sales and Member Team and the Member Team password-issuance interface without browser JavaScript errors.
- **No live Cloudflare Worker, Cloudflare Access policy or D1 database was changed.**

### Rollback

If the native login fails, clear the GitHub Actions variable `MALIKS_NATIVE_LOGIN_APPS` and redeploy. **Do not remove Cloudflare Access while testing**. This restores the existing Cloudflare Access login path without dropping credential tables. Never delete the D1 database or revoke all staff accounts as a rollback.

### Scope

This patch addresses **authentication and employee credential management only**. It does **not** activate unfinished financial modules, reconcile stock, or make every POS menu operational. Do not interpret the new sign-in screen as completion of the accounting ERP.
