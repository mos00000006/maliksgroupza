PHASE 54 - FIX FOR 3 GITHUB ACTIONS FAILURES

Cause: Phase 54 new files were uploaded, but the integration script was not run. This leaves 3 failures in phase54-backoffice-wiring.test.mjs.

1. Extract this ZIP into the ROOT of the CURRENT maliksgroupza GitHub checkout, not into maliks-operations itself.
2. On Windows, double-click APPLY-PHASE54-FIX.cmd (requires Node.js), or run from repo root:
   node maliks-operations/scripts/apply-phase54.mjs
3. The script updates only these FOUR EXISTING files:
   maliks-operations/src/frontend.mjs
   maliks-operations/src/core.mjs
   maliks-operations/package.json
   .github/workflows/deploy-maliks-operations.yml
4. It is idempotent and preserves other code. Review git diff.
5. Run from maliks-operations: npm test
6. Commit and push ALL modified files (including four files above); confirm GitHub Actions green.
7. The deployment applies phase54_backoffice_masters.sql to remote D1. Back up D1 before deployment.

The 8 focused Phase 54 tests passed on a local patched checkout.
IMPORTANT: This patch fixes GitHub checks. It does not enable live payment posting, and it hasn't been deployed.
If the script reports a missing anchor, don't force replace source files with old versions; send the error log instead.
