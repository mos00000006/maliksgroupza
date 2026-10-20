# Daily-limit message update

When a confirmed Cloudflare D1 daily allowance error prevents the Hub from opening, staff see a PowerBuild page headed “Daily usage limit reached”. It displays the next allowance reset at 02:00 South African time with the actual date, a Try again button, and a Cloudflare dashboard link labelled for the Hub owner to upgrade. Staff are told they do not need to pay for their own accounts.

API requests return the same explanation with a 503 response, a reset time, no-store caching and Retry-After. Database failures during membership checks are handled. For framework routes that return a generic server error, the Worker makes a small availability check to confirm that the daily limit is the cause; unrelated failures are not labelled as quota exhaustion. This check is only made after a server error, not on healthy requests.

The catalogue shows “Catalogue unavailable” instead of a misleading zero count when loading fails. Product data is not deleted or changed by this patch.

## Install and publish the message today

Extract these files into the existing Hub project and merge/replace the included files. This is a small message patch, not the full Hub. It requires no database migration.

Your existing GitHub workflow has been updated with an optional manual input. Normal pushes and normal manual runs still run migrations. To publish this message while migrations are blocked:

1. Commit/upload the patch to the repository. An automatic run may still stop at the existing database limit.
2. Open GitHub → Actions → Deploy Maliks Group Hub → Run workflow.
3. Select the branch containing the patch and enable “Deploy daily-limit message without database migrations (temporary outage update)”.
4. Run the workflow. It validates/builds and deploys the code while skipping the blocked migration command.

Alternatively, with your usual production environment variables and credentials configured, run:

```powershell
npm run check
npm run config:production
npx wrangler deploy --config dist/server/wrangler.json
```

This publishes code only. It does not raise the limit or restore database access. After the allowance resets or the owner upgrades, run the normal deployment with migrations again to apply any previously pending schema updates. Use the manual skip option only for this temporary outage message update.

The message cannot replace a sign-in or error page produced by Cloudflare Access before a request reaches the Hub. The Hub handles confirmed D1 quota failures after requests reach its Worker. A deployment requires access to the existing Cloudflare account and has not been performed here.

## Validation

Full npm run check passed: production build and 15 tests, including nested/code-7500 error detection, correct reset date and time, no-cache HTML/JSON responses, and a simulated staff membership lookup blocked by the daily quota. Existing authentication protections and price-tag tests passed.
