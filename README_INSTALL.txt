MALIKS GROUP HUB — CLOUDFLARE NODEJS_COMPAT DUPLICATE-FLAG FIX V3
================================================================
Repository: maliksgroupza (the existing Hub; NOT maliks-pos)
Deployment issue: Cloudflare API error 10021:
  "Compatibility flag specified multiple times: nodejs_compat"

What this patch changes
- Adds compatibility_flags normalization to the PRODUCTION config preparation step.
- Each compatibility flag occurs once per generated Wrangler config scope.
- Preserves the first occurrence and original order of all valid flags.
- Retains the required nodejs_compat flag on the existing 2026-05-22
  compatibility date; it does NOT disable Node.js APIs or change the date.
- Preserves the existing V2 D1 conflict fix, R2, assets and security checks.
- Refuses malformed flag arrays before reaching the Cloudflare API.
- No database migration or data change.

Files
  scripts/prepare-cloudflare-config.mjs (REPLACE the existing file)
  tests/hub-wrangler-config.test.mjs (REPLACE the existing V2 test file)

Install
1. Open GitHub repository "maliksgroupza", deployment branch (usually main).
2. Extract this ZIP, then copy both files into the repository, preserving paths.
3. Commit both files. Do not upload this patch to "maliks-pos".
4. GitHub Actions > Deploy Maliks Group Hub > re-run or trigger new push.

Verify
  node --test tests/hub-wrangler-config.test.mjs
  npm run build
  npm run config:production

To check generated flags (after the build and config:production):
  node -e "const c=require('./dist/server/wrangler.json'); console.log(c.compatibility_flags); if(new Set(c.compatibility_flags||[]).size!==(c.compatibility_flags||[]).length)process.exit(1)"

Existing deploy command remains unchanged:
  npx wrangler deploy --config dist/server/wrangler.json

Local test summary: 13/13 passed, plus Node.js syntax verification.
This does NOT guarantee remote deployment success; test in GitHub Actions.
If error 10021 persists, inspect the exact generated configuration and
verify the workflow is using --config dist/server/wrangler.json, without
separately passing --compatibility-flags on the CLI.

SECURITY
- The production DB binding is still validated against the existing
  MALIKS_GROUP_D1_DATABASE_ID secret and maliks-group-hub-db.
- The script still strips the development-only access and LOCAL_DEV_AUTH data.
- No credentials are bundled. Do not paste tokens or UUIDs in chat.

A separate observation from the user log: the Hub Worker still shows POS_APP_NAME
and POS_VAT_RATE variables. They are not needed for this correction. Confirm
your MaliksPOS deploy has its own Worker and GitHub repository; do not change
those variables as part of the compatibility fix without reviewing the app.
