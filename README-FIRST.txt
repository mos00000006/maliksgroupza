MALIKS GROUP HUB — FIX THE OUTDATED UG CLASSIFICATION TEST

GitHub Actions reports 135 passed, 1 failed.
The failing case is in tests/catalogue-pdf-fittings.test.mjs:
  PIPE UG 110MMX6M -> EXPECTED Plumbing Pipes (incorrect)
  PIPE UG 110MMX6M -> ACTUAL Underground (UG) (correct)

HOW TO INSTALL
1. Replace ONLY tests/catalogue-pdf-fittings.test.mjs in your GitHub repository
   with the file at the same path in this ZIP.
2. Commit to the branch used by your GitHub Actions and Cloudflare deploy.
3. Run npm run check again.

OR EDIT DIRECTLY IN GITHUB
Find the row containing PIPE UG 110MMX6M inside the test and change its
expected value from 'Plumbing Pipes' to 'Underground (UG)'.

The replacement also adds two UG regression examples.
No Hub application logic, D1 migration, product codes, pictures, pricing or
other tests are changed. This only fixes an outdated test expectation.

VALIDATION: Checked source syntax/target test expectations. Full npm run check
not executed in this environment because project node_modules are unavailable.
