# Maliks Group Hub: split into independent department applications — Phase 1

This package is an **add-on** to your current GitHub repository, not a replacement for the existing Hub.

## Files to add
- `maliks-operations/` — standalone Workers source, policy, common API, tests and comprehensive deployment README.
- `.github/workflows/deploy-maliks-operations.yml` — **manual** GitHub Actions workflow to deploy the five Workers. Keep your existing `.github/workflows/deploy.yml` unchanged.

## Quick start
1. Read `maliks-operations/README.md`.
2. Create four separate Cloudflare Zero Trust Access applications: POS, Tills, Cash Office, Dispatch.
3. Add the four new `CF_ACCESS_AUD_*` secrets to the existing GitHub repository. Retain the previously configured Cloudflare account, API token, D1 ID and team domain secrets.
4. Copy both folders into the root of your existing repo, commit and push.
5. Run **Actions > Deploy Maliks Department Applications > Run workflow** only after checking that none of the five Worker names would replace an existing deployed service.
6. Test the four new sites and their permissions; leave your existing Hub operational in the meantime.

> Important: The new POS submits **quotations, not sales**. Tills and Cash Office are read-only. Dispatch is a secure starter screen. Payment, tax invoices, stock posting and actual dispatch must not be used until later phases are completed and verified. The existing Hub is not yet converted to management-only in this package.

Cloudflare Access is a prerequisite. No passwords, secrets or real database IDs are included.
