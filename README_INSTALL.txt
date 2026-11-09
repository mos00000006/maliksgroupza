MALIKS GROUP HUB — D1 CONFLICT CONFIG PATCH V2
==============================================
Repository: maliksgroupza (original Maliks Group Hub ONLY)
Do NOT install in maliks-pos.

FIXES
- Failing command: npm run config:production
- Error: D1 binding DB is declared for conflicting databases.
- Generated dist/server/wrangler.json may contain two DB entries for the SAME
  maliks-group-hub-db, but with differing generated/local/placeholder IDs.
- This patch consolidates those DB entries into exactly one binding. The
  database UUID is always taken from the existing GitHub Actions secret
  MALIKS_GROUP_D1_DATABASE_ID (not from generated development IDs).
- It REFUSES to proceed if any DB entry names a different database.
- It preserves other unique D1 bindings, Worker assets, R2 and triggers.
- It removes the unsupported production "access" field and LOCAL_DEV_AUTH.
- The migration config .deploy/wrangler.jsonc stays separate from the
  generated Worker config and is independently checked for the intended DB.

FILES
  scripts/prepare-cloudflare-config.mjs  (REPLACE existing file)
  tests/hub-wrangler-config.test.mjs     (REPLACE old test or create new)

INSTALL
1. Open GitHub repo maliksgroupza on the SAME branch used by your existing
   "Deploy Maliks Group Hub" GitHub Actions workflow.
2. Extract the ZIP; copy both paths into the repository, preserving the
   scripts/ and tests/ folders; REPLACE previous V1 patch files.
3. Commit to the branch used for deployment (normally main).
4. In GitHub Actions, re-run "Deploy Maliks Group Hub" or trigger a new commit.

VERIFY
  node --test tests/hub-wrangler-config.test.mjs
  npm run build
  npm run config:production

The production preparation should log a line similar to:
  Production D1 bindings validated: 1 unique; 1 duplicate(s) removed.

The deploy workflow then continues with existing migrations and:
  npx wrangler deploy --config dist/server/wrangler.json

NOTES
- The build must complete before npm run config:production.
- This patch does NOT change or delete any live database records, and does
  not require a new SQL migration.
- It does NOT change or create GitHub secrets or Cloudflare Access policies.
- Do not paste your real database UUID, API token, or secrets into chat.
- If the new error says "DB targets ... instead of maliks-group-hub-db", the
  generated config references another project; STOP and inspect the source.
- Do not confuse duplicate D1 *names* with separate reporting databases:
  distinct binding names (e.g. REPORTING) are intentionally preserved.
- The live Worker has not been deployed by this local patch.
