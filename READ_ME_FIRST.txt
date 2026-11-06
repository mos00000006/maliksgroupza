MALIKS GROUP HUB — GITHUB TEST FIX V7
=====================================

WHAT FAILED
GitHub's npm run check failed in tests/stock-document-type-fields.test.mjs
because the test imported TypeScript from a hard-coded path:
/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js
That location does not exist on the GitHub runner.

WHAT THIS PATCH DOES
Changes ONLY the test file to import from the project's existing
TypeScript devDependency: import ts from 'typescript';
No application component, CSS, API, stock record or migration is changed.

INSTALL (DIRECT PASTE)
1. Extract this ZIP.
2. Copy the tests folder into your maliksgroupza repository folder.
3. Merge directories and replace tests/stock-document-type-fields.test.mjs.
4. Commit and push to GitHub.
5. GitHub should install dependencies with npm ci before npm run check.

LOCAL CHECK
npm ci
npm run check

VERIFICATION
- node --check: passed
- Stock-document test suite: 10 passed, 0 failed in isolated test workspace.
- Complete GitHub suite has NOT been re-run here. The provided log showed
  220/221 tests passing, production build passing, and this one failure.
