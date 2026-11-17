# MALIKS PROFESSIONAL — SHARED LOGIN + RECOVERY FIX

## Applies to
The current `mos00000006/maliksgroupza` GitHub repository, `maliks-operations/` subfolder. This fix uses the latest app-login matrix (Phase 23) already present in the repository. It is NOT a separate Hub upgrade or a new database installation.

## Verified existing design / problem
- All Maliks Sales and Maliks Quote employee passwords are stored in the same D1 `maliks_pos_staff_credentials_v2` table. The Group Hub has separate authentication. A Group Hub password change alone does not update this employee password.
- Earlier 600,000-iteration Phase 21 hashes cannot be checked by the Cloudflare Worker runtime. Phase 21b stores compatible 100,000-iteration hashes. If an employee has no v2 hash, they must be given a new employee password by an authorised Member Team administrator.
- Before this patch, login failures without a known client IP entered a shared `unknown` IP rate-limit bucket; several employees could lock out one another. A legitimate admin password reset did not clear the account-specific failed-login counter. These issues are fixed here.
- Maliks Quote formerly required temporarily passworded employees to visit Sales for first-login password changes. It can now change the password itself.

## What's changed
1. Shared Maliks Core login no longer uses the global `unknown`-IP bucket; per-account rate limiting remains in force and real client IP rate limits remain in place.
2. Approved employee password issuance, self password setup and personal password changes clear the corresponding account-specific failed-login counter after successful update.
3. Correct employee credentials without app permission now return `403` with an app-access explanation, instead of counting as a bad password (`401`). Incorrect credentials still return generic `401`.
4. Missing/corrupt credential storage results in an actionable `503`, not an unexplained internal error. Maliks password lookups tolerate incidental whitespace in stored email addresses.
5. **Member Team** shows `Check my employee login` for Cloudflare Access-verified Owner / Technical Admin and `Check login status` for authorised employees in assigned stores. The check reports whether the compatible employee credential exists, if a temporary password needs changing, app grants, branch assignment and lockout status. **It never displays passwords or hashes.**
6. **Maliks Quote** can change a first-login temporary password directly, using the existing guarded Core password-change API; its camera/quotation/printing workflows are unchanged.
7. No database migrations are added. The existing Phase 21b and Phase 23 migrations are required and already included in your deployment workflow.

## Install (avoid losing current GitHub updates)
1. In VS Code, open the top-level `maliksgroupza` repository and back up or create a new Git branch. Verify the files are current before merging.
2. Extract the ZIP at the repository root. Merge its `maliks-operations` directory into the existing `maliks-operations` directory. Replace only the six files listed above (four source files, two tests); keep all other Hub and POS files.
3. From `maliks-operations`, run:
   ```powershell
   npm install
   npm test
   ```
4. Commit and push to GitHub. Open the existing **Deploy Maliks Department Applications** workflow. Check you have a backup and verified the Cloudflare Account, D1 database ID and secrets. Its existing migration steps include Phase 21b and Phase 23; no new migration is needed. Run that workflow once (it redeploys the department apps, including Core, Sales, Quote, Member Team).
5. After the green deployment, sign into **Maliks Member Team using your verified Cloudflare Access Owner / Technical Admin identity** and select **Check my employee login**.
6. If it says **Password NOT SET**, use `Set administrator password` on that same Member Team page, selecting a new 14+ character password; this updates the Maliks employee-credential v2 table. Do not assume your Group Hub password was written to the v2 table. If the page says password is set but the sign-in still rejects it, repeat the authorised reset once and read the message carefully.
7. For other employees, choose their assigned branch, click **Check login status**, then **Issue password** if necessary. If Sales + Quote shows `Not allowed`, use **Manage app logins** to authorise Sales + Quote. Give the one-time temporary password privately. The employee must change it at first sign-in; they can now do this directly in Maliks Quote as well as Sales.
8. Sign into Maliks Sales and Maliks Quote using the **same Member Team employee email and new password** (each origin has a different secure session cookie). Confirm both show the assigned branch.

## Diagnostic statuses
- `401` — incorrect employee email/password, or no compatible v2 password set; use Member Team health/reset flow.
- `403` — employee password verified, but this app is not authorised; adjust Member Team app permissions (an unauthorised branch may also give 403 on the session endpoint).
- `429` — per-user or real-IP login safety limit; wait for it to expire, or complete an authorised password reset to clear the account-specific lockout.
- `503` — credential storage/Core D1 unavailable or misconfigured. Verify the Phase 21b migration, D1 binding and Core Worker deployment.

## Security limitations
- This patch does **not** bypass passwords, impersonate a Developer, or convert the main Group Hub password into a POS credential.
- Password self-bootstrap and login health require a **verified Cloudflare Access session to Member Team**; password-only sign-in is intentionally insufficient. If `MALIKS_NATIVE_LOGIN_APPS` forces `member` to password-only, an administrator must adjust that secure deployment setting to allow Access-based recovery first.
- The account health check verifies that a compatible password record exists; it **does not verify which password the employee remembers**.
- Existing staff records, audit entries and D1 passwords are not deleted.

## Verification
- `node --test --test-concurrency=4 tests/*.test.mjs`: **219 passed, 0 failures** (local regression suite).
- App permission denial, wrong password, account rate limiting, administrator reset, session changes and Quote first-login password change tested.
- Not deployed to live Cloudflare; no live account credentials or private production database were inspected.
