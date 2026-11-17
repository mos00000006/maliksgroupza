# MALIKS QUOTE — GitHub Actions Test #136 Fix

## What failed

GitHub Actions `npm test` ran 222 tests: 221 passed, 1 failed.

The failing test was **#136** in:

`maliks-operations/tests/phase24-quote-zero-trust-aud.test.mjs`

The test used a fake token (`test-token-for:aud-quote`) when invoking the real Core JWT verifier. The local development harness previously substituted a fake `jose` verifier that accepted this token. GitHub installs the genuine `jose` library, which correctly rejects the fake token as invalid and returns HTTP 401 rather than 200.

## What the patch does

- Replaces the fake token in test #136 with an RSA-SHA256 signed JWT generated **only within the test**.
- Stubs out the public Cloudflare JWKS endpoint **only inside the test** to serve the corresponding temporary public key. There are no external network requests or production credentials.
- Confirms that a valid Quote token is accepted by the Quote audience, and a valid Sales token is accepted by the existing Sales/POS audience.
- Confirms that Quote and Sales audiences cannot be interchanged; a Quote token cannot claim management, an invalid marker is rejected, and a forged signature is rejected.
- Restores the original `fetch` handler after the test.
- Does NOT modify production `core.mjs`, `mobile-quote-frontend.mjs`, Cloudflare secrets, Worker configuration, D1 data, or login permissions.

## Install

1. Back up your working `maliksgroupza` project or make a Git branch.
2. Extract this ZIP at the **root** of your existing `maliksgroupza` repository. Merge the `maliks-operations` folder and replace ONLY this file:
   `maliks-operations/tests/phase24-quote-zero-trust-aud.test.mjs`
3. In VS Code terminal, run:
   ```powershell
   cd maliks-operations
   npm install
   npm test
   ```
4. Commit and push the changed test file to GitHub.
5. In GitHub → Actions → Deploy Maliks Department Applications, confirm the new check passes. The normal workflow will then proceed to deployments; review the configured production environment before running it manually.

## Verification

Local `npm test`: **222 tests, 222 passed, 0 failed** using the existing local test harness, enhanced solely for verification to exercise real RSA signatures and JWKS responses.

The local environment could not download the actual `jose` npm package, so final confirmation with the genuine library is the new GitHub Actions run. The `jose@6.1.0` source was inspected to confirm that `createRemoteJWKSet` fetches JWKS through `fetch`, as mocked by this test.

## Notes

This fixes **the test failing with HTTP 401**, not any separate live employee-login failure. This ZIP does not reset passwords and does not weaken authentication checks.
