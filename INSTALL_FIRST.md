MALIKS QUOTE — CLOUDFLARE ZERO TRUST AUDIENCE INTEGRATION

WHAT THIS PATCH DOES
- Adds the existing GitHub secret CF_ACCESS_AUD_QUOTE to the GitHub Actions deployment environment.
- Requires that value when generating the Cloudflare Worker configuration and supplies it privately to maliks-core-api.
- Keeps Maliks Sales and Maliks POS on their existing CF_ACCESS_AUD_POS setting.
- Allows Maliks Quote's independently configured Cloudflare Access application to authenticate using CF_ACCESS_AUD_QUOTE.
- Continues to use the same Employee / Member Team account and branch permissions as Maliks Sales (app=pos).
- Adds isolated tests for correct audiences and denied mismatches.
- No new D1 migration, database edits, or employee password changes.

BEFORE INSTALL
You already saved the application audience tag as the GitHub Actions repository secret CF_ACCESS_AUD_QUOTE.
The value must be copied from Zero Trust > Access controls > Applications > Maliks Quote > Additional settings > Application Audience (AUD) Tag, not from Maliks POS or Maliks Sales.
Do not put the secret value into source files, screenshots or chat messages.
Confirm Maliks Quote has an Allow policy for approved staff. Do not use Bypass or Everyone.

INSTALL
1. Open your existing maliksgroupza project in VS Code. Create a backup / Git branch.
2. Extract this ZIP at the repository ROOT (the folder containing .github and maliks-operations).
3. Merge only the five listed paths; do NOT replace the complete maliks-operations directory with this ZIP.
4. In a terminal, from maliksgroupza/maliks-operations:
     npm install
     npm test
   The Phase 24 test is included with the patch.
5. Commit and push to the main GitHub repository after reviewing your changes.
6. In GitHub > Actions > Deploy Maliks Department Applications > Run workflow, select main and confirm the Worker names.
7. Check that the steps named npm run config, Deploy central API — private Worker and Deploy Maliks Quote succeed.
   NOTE: This existing workflow also deploys other department Workers and re-applies additive schema files; confirm production settings and back up the database before running.
8. Open https://maliks-quote.moyanamoses006.workers.dev/ in a fresh browser window. Complete Cloudflare Access authentication for the Quote application.
9. If Maliks Quote displays a SECOND employee sign-in, use your Maliks Member Team employee email and password. Do not use your Cloudflare password on this second form.

IF IT DOES NOT OPEN
- Cloudflare Access rejection: check the Quote application Allow policy and the AUD tag saved under CF_ACCESS_AUD_QUOTE.
- GitHub `npm run config` fails: the new secret was not supplied or is empty.
- Cloudflare Access passes but Maliks employee sign-in fails: use Member Team > Check my employee login and check Core logs. This patch is the Access audience alignment, not an employee password reset.
- GitHub deployment completed but the old site is cached: close and reopen the installed Maliks Quote app, or open a fresh Chrome Incognito window.
- DO NOT share passwords, verification codes, access tokens, JWTs or AUD secret values.

TESTING
Local `npm test`: 222 passed, 0 failed, using the self-contained local test harness. The Phase 24 tests simulate JWT validation to verify audience selection; live Cloudflare authentication must still be tested after deployment.

Included files:
  .github/workflows/deploy-maliks-operations.yml
  maliks-operations/scripts/make-config.mjs
  maliks-operations/src/core.mjs
  maliks-operations/src/mobile-quote-frontend.mjs
  maliks-operations/tests/phase24-quote-zero-trust-aud.test.mjs
