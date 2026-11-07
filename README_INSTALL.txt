MALIKS GROUP HUB — PAIA PREMIUM PAGE V8 LINT FIX
=================================================

PURPOSE
Fixes the three react/no-unescaped-entities ESLint errors reported by GitHub
at app/paia/page.tsx lines 126, 133 and 152 in Premium PAIA V7.

CHANGED FILE
  app/paia/page.tsx

Only three text apostrophes are HTML-escaped (&apos;). No UI design, branding,
PDF, stock, sales, database, or navigation changes are included.

INSTALL
1. Extract the ZIP.
2. Copy its app folder into your existing maliksgroupza project folder.
3. Merge folders and replace app/paia/page.tsx.
4. Run npm run check in VS Code.
5. If successful, commit and push to GitHub.

TESTED LOCALLY
- TSX syntax parse: passed.
- 3 reported apostrophes corrected.
- 5 existing PAIA page layout regression tests: passed.

The full GitHub workflow was not run in this environment and needs verification.
