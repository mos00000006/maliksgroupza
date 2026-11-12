# MALIKS — Phase 8 Core API single-file correction

## Why GitHub fails

The GitHub output says **86 passed, 1 failed**, specifically:

`Core endpoints require Cash Office, cross-branch guard and other employee`

The failing test expects Phase 8 payment-evidence endpoints and independent-review controls in `maliks-operations/src/core.mjs`. The Core source printed in the test failure is the older Phase 7 version. The Phase 8 tests and payment-evidence domain file are already present; only `core.mjs` is out of sync.

## Simple GitHub fix (recommended)

1. Open your `mos00000006/maliksgroupza` repository on GitHub.
2. Go to `maliks-operations/src/core.mjs`.
3. Click **Edit** (pencil icon).
4. Open this package's `maliks-operations/src/core.mjs` in a text editor; copy **all its contents** and replace the contents of the file on GitHub.
5. Commit directly to the `main` branch, or make a pull request if you prefer review.
6. Check that `maliks-operations/src/payment-evidence-domain.mjs` and `maliks-operations/sql/phase8_payment_evidence.sql` exist in your repo. Do **not** run a new migration solely to fix this test; ensure the phase 8 migration is applied before enabling the Phase 8 feature in production.
7. Run a **new** `Deploy Maliks Department Applications` workflow run and confirm the Worker names only after verifying the target Workers are correct.

If you use git locally and your existing file matches the Phase 7 baseline, `git apply maliks-phase8-core-only.patch` can apply the narrower insertion without replacing the entire file.

## What changed in Core

- Added the Phase 8 payment-evidence domain import.
- Added Cash Office-only observation listing, history and write handlers.
- Enforced assigned branch, different preparer/reviewer, immutable evidence and idempotent writes.
- Added the three `/v1/payment-evidence` routes.
- Updated Cash Office's session mode string from Phase 7 to Phase 8.

**No actual money, invoice, stock or Dispatch posting is enabled.** This is manual payment-evidence control only.

## Local verification

A reconstructed Phase 8 project, with previous four test-expectation updates, this Core file, and the existing quotation lookup test was run with `npm test` on Node.js. Result: **87 tests passed, 0 failed**. This is not a test of your deployed Cloudflare account or your exact current GitHub branch.

Avoid replacing `src/frontend.mjs`, `src/quote-domain.mjs` or other application files for this fix. If `core.mjs` has newer changes than the failing log, merge the three Phase 8 route additions rather than overwriting new features.
