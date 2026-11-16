# Maliks POS — Phase 14 legacy test compatibility hotfix

## What failed
Your GitHub `npm test` job reported 187 passing and 1 failing test.
`maliks-operations/tests/phase14-separate-sales.test.mjs` asserted that POS navigation only had two branches:
`if(suiteView==='home')suiteHome();else suiteModuleView(suiteView)`.

The updated premium POS adds a separate `checkout` screen, so its actual safe routing is:
`if(suiteView==='home')suiteHome();else if(suiteView==='checkout')posPremiumCheckout();else suiteModuleView(suiteView);`

The old test assertion was outdated. This hotfix updates that assertion so it checks the new expected behavior while preserving the separate Sales security assertions.

## Install
1. Open your `maliksgroupza` repository in VS Code.
2. Extract this ZIP at the repository root, and overwrite the single matching file:
   `maliks-operations/tests/phase14-separate-sales.test.mjs`
3. Commit and push to GitHub.
4. Re-run the Actions workflow, or locally run:
   `cd maliks-operations && npm test`

## Verification
The full suite was tested locally with the prior premium Dashboard/POS source patch and the existing repository suite: **188 tests passed, 0 failed** (Node 22.16.0).

No production source, payment posting, database, receipt, logo, or stock code is changed by this hotfix.
The user's GitHub Actions run still needs to confirm success after pushing.
