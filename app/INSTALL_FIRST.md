# MALIKS MEMBER TEAM — SHARED EMPLOYEE LOGIN & APP ACCESS PATCH (Phase 23)

## What has changed

- Member Team now shows **Maliks Apps — Login & Access** links to authorised Maliks Workers.
- The employee list has **Manage app logins** (Owner / Admin or Developer / Technical Admin only).
- Assign app access individually. Six server-enforced permissions cover **Maliks POS Professional**, **Maliks Sales + Maliks Quote**, **Maliks Tills**, **Maliks Cash Office**, **Maliks Dispatch**, and **Maliks Member Team**.
- **Maliks Sales and Maliks Quote share one permission**, since they both use the existing Sales (`pos`) identity at the private Core API.
- A Developer / Technical Admin and Owner / Admin retain protected full access across all six Worker identities and their assigned company branches. They use their existing employee email/password, not a special shared password.
- Every app grant/change is audited. Changing an employee’s app permissions invalidates all that employee’s existing app sessions so they must sign in again using the **same** existing password.
- Legacy role-derived permissions remain in effect until an administrator explicitly saves an employee’s app matrix. After saving, both allowed and denied apps are explicitly stored.
- Member Team administration remains restricted to management roles, even if a non-manager somehow obtains a Member Team permission request.
- The pre-existing per-app password and secure, host-only browser sessions remain unchanged. Separate `workers.dev` origins require separate sign-ins. **This is shared credentials, not automatic one-click SSO between sites.**

## Important scope limitation

This patch shares logins across the **separate Maliks Operations Workers** listed above. It does **not** unify the main **Maliks Group Hub** identity with the Operations employee-password database. The Hub’s Cloudflare Access / Hub authentication configuration is a separate system and still applies. Cloudflare Access must allow the employee to reach each Worker hostname; granting access within Member Team does not bypass Cloudflare Access policies.

## Install the patch in your existing GitHub repository

1. Back up your `maliksgroupza` project and the `maliks-group-hub-db` Cloudflare D1 database. Prefer making a Git branch.
2. Extract this ZIP **into the root of `maliksgroupza`**, merging the included `.github/workflows/` and `maliks-operations/` folders with the existing folders. Do **not** create another nested repository folder. Replace only files contained in the ZIP; leave the main Hub and your other files unchanged.
3. From the **`maliks-operations`** folder run:
   ```powershell
   npm install
   npm test
   ```
4. The supplied `.github/workflows/deploy-maliks-operations.yml` applies the new **Phase 23** additive D1 migration **before** deploying the updated Core Worker. It also includes the Maliks Quote deployment step that was missing from the last checked GitHub workflow. Verify your Cloudflare account, worker names, secret values, D1 binding and Access policies before running the complete workflow.
5. Go to **GitHub → Actions → Deploy Maliks Department Applications → Run workflow**, and confirm the name-check requirement as prompted. This workflow redeploys the other department Workers as well.
6. For a *targeted manual deployment* instead, after supplying the existing Cloudflare environment variables and generating `.generated/` configs, run:
   ```powershell
   npm run config
   npm run migrate:phase23
   npm run deploy:core
   npm run deploy:member
   ```
   Only do this if the target D1 database is correct and your credentials/Access setup is already configured. The new migration creates two tables and indexes; it does not replace `team_members`, passwords or the Group Hub.
7. Log in to `https://maliks-member-team.moyanamoses006.workers.dev/` as the Owner / Admin or Developer / Technical Admin. Choose a branch, click **Manage app logins** for an employee, tick authorised apps and **Save app logins**.
8. Have the employee sign out and sign in at the newly authorised site using their **existing same email and password**. First-time employees still need their one-time temporary password and must change it.
9. To set your own administrator password for the first time, use the existing Member Team **Set my administrator password** function while authenticated through verified Cloudflare Access. The password reset/bootstrapping rules remain deliberately restricted.

## Tested

`npm test` on the matching project source: **214 passed, 0 failed** (including six new Phase 23 tests). The new tests verify permission grants and denials, developer all-app access, audited updates and replay, store isolation, own-account restrictions, shared-password app-specific sessions, revoked sessions, and the Member Team frontend route.

The patch is a local artifact and has **not** been committed, merged, migrated or deployed on your live Cloudflare account.

## Troubleshooting

- If app access changes do not save, confirm Phase 23 migration ran on the correct database and Core was redeployed.
- If the employee cannot open a Worker at all, check **Cloudflare Access application hostname and policy**. App permissions in D1 cannot bypass Cloudflare Access.
- If employee password login is rejected, verify credentials were issued in Member Team and the employee has changed any temporary password.
- If an employee can open Sales but not Quote, check that the `maliks-quote` Worker was deployed and covered by the required Cloudflare Access policy. They both rely on `pos` permission.
- If the employee has already signed in elsewhere, a permission change revokes those sessions by design.
- This patch is **not** single sign-on (SSO). Each distinct Worker requires a sign-in with the same credentials, unless Cloudflare Access has its own identity SSO configured separately.
