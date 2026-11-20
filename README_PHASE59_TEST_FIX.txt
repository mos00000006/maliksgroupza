# Phase 59 — fix 2 attendance CI test failures (20 November 2026)

The GitHub Actions log reports 314 tests, 312 passed and 2 failed. Both failures cascade from tests/branch-attendance.test.mjs line 28.

The secure attendance API now rejects branch geofence configuration outside the permitted 50–150 metre range. The test incorrectly expected a 300 m setup to succeed (HTTP 200), but the API correctly returns HTTP 400. Since the first test aborts before creating a branch, the next test fails with HTTP 404 because that branch does not exist.

This patch changes ONLY tests/branch-attendance.test.mjs:
- Expect the 300 m setup to return HTTP 400 (intended security policy).
- Then set up a valid 100 m branch and expect HTTP 200.

It does NOT loosen GPS validation, change business logic, amend real attendance records or modify the database schema.

CODESPACES INSTALL (repository root /workspaces/maliksgroupza):
1. Upload this ZIP to the root of your Codespace.
2. In Terminal:
   cd /workspaces/maliksgroupza
   unzip -o Phase59_Attendance_CI_2_Failures_Fix_20261120.zip
   npm run check
3. Only after the full check passes (expect # fail 0):
   git add tests/branch-attendance.test.mjs
   git commit -m "Fix Phase 59 attendance radius test expectations"
   git push origin main
4. Run the "Deploy Maliks Group Hub" workflow on the NEW main commit.

Notes:
- The 146 ESLint WARNINGS in the supplied log are not fatal (zero lint errors); npm test is the failure source.
- This fixes exactly the reproduced assertions in the uploaded log. The full 314-test suite still needs to run in GitHub.
- The first failing test sets up the branch and later tests rely on that setup; this is why one wrong radius produces two failed tests.
