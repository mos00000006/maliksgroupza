MALIKS GROUP HUB — TEST #142 GITHUB CI FIX
======================================

The latest GitHub check passed ESLint and Vite production build, but the test suite had 310 passed, 1 failed.

Failure:
  Test #142 "Hub task window contains progress, evidence, manager actions and timeline"
  ENOENT: /home/runner/work/maliksgroupza/app/page.tsx

Cause:
  tests/hub-task-controls-phase28.test.mjs defines `root` as the repository root.
  Two UI assertion reads incorrectly used '../app/...', moving outside the checkout.

Install:
  1. Extract this ZIP into the root of your maliksgroupza repository, replacing the matching file.
  2. The only changed file is tests/hub-task-controls-phase28.test.mjs.
  3. Commit and push to GitHub main.
  4. Start or check a NEW GitHub Actions deployment run on main (not a re-run of an old commit).

Exact corrections:
  read('../app/page.tsx')       -> read('app/page.tsx')
  read('../app/phase-eight.css')-> read('app/phase-eight.css')

Validation:
  - node --check: passed
  - Phase 28 targeted tests: 12 passed, 0 failed
  - Full GitHub suite requires a new workflow run; it is not claimed as passed here.

This patch does not touch application code, DB, Cloudflare configuration, or secrets.
