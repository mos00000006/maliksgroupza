MALIKS POS — PHASE 54 / DEBTORS TEST COMPATIBILITY FIX
Date: 19 November 2026

WHAT THIS FIXES
A Phase 32 Debtors utility test incorrectly expected its two API routes to
appear immediately beside each other in frontend.mjs. Activating Back Office
Phase 54 inserts an unrelated API route between them. The original test then
fails even though the Debtors APIs remain correctly available.

WHAT THIS PATCH CHANGES
Only: maliks-operations/tests/phase32-debtor-utility-ui.test.mjs
The outdated adjacent-route assertion becomes two separate assertions
requiring BOTH Debtors API routes to remain present.
All five original Debtors utility tests are preserved.

NOT INCLUDED / NOT CHANGED
No edits to live POS, Core, users, QR labelling, financial posting or D1.
The Phase 54 frontend/Core/workflow files should already be staged from the
previous apply-phase54.mjs repair. Do not overwrite those existing changes.

INSTALL ON GITHUB CODESPACES
1. Upload this ZIP into the root of the 'maliksgroupza' Codespace workspace.
2. In the terminal run:
   cd /workspaces/maliksgroupza
   unzip -o Maliks_POS_Phase54_Final_Debtors_Test_Compatibility_Fix_20261119.zip
   cd maliks-operations
   npm test > /tmp/maliks-test.log 2>&1
   grep -E '^not ok|^# tests |^# pass |^# fail ' /tmp/maliks-test.log

3. If '# fail 0', commit the staged Phase 54 changes INCLUDING this test:
   cd /workspaces/maliksgroupza
   git add maliks-operations/src/frontend.mjs maliks-operations/src/core.mjs \
     maliks-operations/package.json .github/workflows/deploy-maliks-operations.yml \
     maliks-operations/tests/phase32-debtor-utility-ui.test.mjs
   git commit -m "Fix Phase 54 Back Office wiring and Debtors route compatibility test"
   git push origin main

NOTES
- If any tests still fail, read the 'not ok' lines. This patch addresses the
  specific stale Phase 32 assertion, not every possible unrelated test issue.
- This patch was verified against the saved project snapshot plus the staged
  Phase 54 integrations. Focused result: 13 tests, 13 passing.
