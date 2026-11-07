MALIKS GROUP HUB — PAIA NAVIGATION GITHUB ESLINT FIX
================================================

FIXES ONLY:
app/paia/page.tsx

GitHub lint errors at lines 19 and 23:
@next/next/no-html-link-for-pages

CHANGES:
- Import Link from next/link.
- Replace the PAIA logo/homepage <a href="/"> with <Link href="/">.
- Replace the Back to Hub <a href="/"> with <Link href="/">.

INSTALLATION:
1. Extract this ZIP.
2. Copy its app folder into your current maliksgroupza folder.
3. Merge folders and replace app/paia/page.tsx only.
4. Run npm run check.
5. Commit and push to GitHub if checks pass.

NO CHANGES TO: PAIA manual, PDF/Word, logo, branding, stock operations, database, access policy or public routes.

Validation: Both offending links removed; all other page source content unchanged.
Full GitHub workflow has not been run in this environment. The 106 unrelated warnings in your log may remain.
