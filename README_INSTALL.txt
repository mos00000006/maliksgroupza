MALIKS GROUP HUB - WRANGLER D1 DEPLOY FIX (V1)
================================================
FIX FOR:
  Wrangler 4.92.0: "Unexpected fields found in top-level field: access"
  Wrangler 4.92.0: "DB assigned to multiple D1 Database bindings"

APPLY TO REPOSITORY: maliksgroupza (MALIKS GROUP HUB)
DO NOT apply to the separate maliks-pos repository.

CONTENTS
  scripts/prepare-cloudflare-config.mjs  Replaces the existing file.
  tests/hub-wrangler-config.test.mjs    New tests.

INSTALL
1. Unzip this patch.
2. In GitHub, open your maliksgroupza repo (root directory), preserving all other files.
3. Replace scripts/prepare-cloudflare-config.mjs with the file supplied in this patch.
4. Add tests/hub-wrangler-config.test.mjs.
5. Commit changes to the branch used by your existing Deploy Maliks Group Hub workflow.
6. GitHub Actions will run the existing check/build, config:production, D1 migrations and deploy steps.

OPTIONAL LOCAL VERIFY (Node.js 22):
  node --test tests/hub-wrangler-config.test.mjs
  npm run build
  npm run config:production

WHAT IT DOES
- Reads the actual generated dist/server/wrangler.json after build.
- Substitutes configured D1 database ID and Access domain/audience placeholders.
- Removes the development-only top-level 'access' object from the production config.
- Removes LOCAL_DEV_AUTH from the deployed Worker vars.
- Removes repeated IDENTICAL D1 bindings sharing the same binding name, keeping the first.
- Rejects conflicting D1 definitions, wrong DB IDs or absent secrets with an explanatory error.
- Leaves the independent migration config (.deploy/wrangler.jsonc) available to the workflow.
- Retains R2 assets, cron settings and other Worker configuration.

IMPORTANT
- No live deploy is performed by this ZIP. It runs as part of your existing GitHub Actions workflow.
- No SQL migrations, database content, product records, or POS files are modified by this patch.
- This is targeted to the two Wrangler configuration errors shown in the log. It does not
  upgrade Wrangler, and does not claim to resolve unrelated build, billing or Cloudflare failures.
