# MALIKS POS — Phase 21b Cloudflare Password Fix

## Why the administrator password failed

The production `maliks-core-api` log reported `Pbkdf2 failed: iteration counts above 100...`. Phase 21 requested 600,000 PBKDF2 iterations per WebCrypto call. The deployed Cloudflare runtime enforces a 100,000-iteration ceiling. The original Phase 21 D1 credentials table also has `CHECK(iterations >= 600000)`, so changing only the JavaScript constant would still fail when saving passwords.

This patch corrects **both** issues:

- Uses PBKDF2-HMAC-SHA256 with a random per-password salt and 100,000 iterations, which fits the observed runtime ceiling. Keeps minimum 14-character passwords, app-specific sessions, role/branch checks, audit logging, and login throttling.
- Adds an **independent, additive** `maliks_pos_staff_credentials_v2` table with `CHECK(iterations = 100000)` instead of changing or dropping the original credentials table. The existing Phase 21 credentials table remains untouched for rollback/audit.
- Switches password issue, login, password change, administrator setup, and session verification to the new table.
- Adds a required Phase 21b migration **after** Phase 21 and **before** the Core Worker deployment.
- Adds a test that simulates Cloudflare rejecting any PBKDF2 request over 100,000 iterations. The full locally available test suite passed (178 tests).

**Security tradeoff:** 100,000 PBKDF2-HMAC-SHA256 iterations is below current recommended work factors for general-purpose password storage. This is a compatibility fix for the live runtime, not a long-term password-KDF upgrade. Plan to move to a reviewed, Cloudflare-compatible Argon2id implementation or another approved KDF before relying on native login as the sole authentication perimeter. **Keep Cloudflare Access enabled.**

## Installation (overlay on existing Phase 21 admin-login hotfix)

1. **Back up your GitHub repository and Cloudflare D1 database.** Do not delete or recreate the database.
2. Extract this ZIP. Copy its `.github` and `maliks-operations` folders into the corresponding paths in your `maliksgroupza` repository. Merge existing files; do not create a nested `maliks-operations` directory. If you made newer changes to any included file, merge carefully rather than blindly overwriting.
3. The patch contains these files:
   - `maliks-operations/src/password-auth-domain.mjs`
   - `maliks-operations/tests/phase21-password-login.test.mjs`
   - `maliks-operations/sql/phase21b_cloudflare_pbkdf2.sql` (new)
   - `maliks-operations/package.json`
   - `.github/workflows/deploy-maliks-operations.yml`
4. Run `npm test` inside `maliks-operations` and `npm run check` at the repository root (if that script exists). Resolve errors before deployment.
5. Commit and push to `main`. Open **GitHub Actions → Deploy Maliks Department Applications → Run workflow**. Confirm the new **Apply Cloudflare-compatible password schema (Phase 21b)** step succeeds *before* **Deploy central API — private Worker**.
6. Open `https://maliks-member-team.moyanamoses006.workers.dev`, refresh, and sign in through your verified Cloudflare Access Owner / Technical Admin account. Choose **Set my administrator password**, enter and confirm a private password (at least 14 characters), and submit. **Do not share it in chat or screenshots.**
7. Only after a successful password save, set the GitHub Actions variable `MALIKS_NATIVE_LOGIN_APPS` to `management` and rerun the deployment. Test sign-in to Maliks POS Professional using your administrator email and chosen password. Keep Cloudflare Access enabled during this rollout.

## Existing staff credentials

The old 600,000-iteration hashes cannot be verified by the deployed Worker and are **not automatically copied** into the new table. Any employee who had a password under the earlier Phase 21 implementation must be issued a fresh temporary password in Member Team; they must change it on first login. Old native sessions will not authenticate under the new table. Employee and branch records are unaffected.

## Rollback and limitations

To revert the code, restore the previous source and workflow and redeploy, leaving both credentials tables in place. If native login is unavailable, clear `MALIKS_NATIVE_LOGIN_APPS` and redeploy to retain Cloudflare Access authentication. Do not change Cloudflare Access to Bypass.

This ZIP has **not** been deployed to GitHub or Cloudflare. Tests were run against a local Node 22 / SQLite mock and a simulated Cloudflare PBKDF2 limit. The production Worker, D1 migration and end-to-end login must be verified after deployment. The patch does not activate unfinished POS financial features.
