MALIKS GROUP HUB — PROFESSIONAL POS LINT HOTFIX (2 ERRORS)
=========================================================

WHAT THIS FIXES
GitHub Actions > npm run check > ESLint reported exactly two
react/no-unescaped-entities errors in app/tills/till-checkout.tsx,
line 239 and line 240. The fix changes only two JSX text apostrophes:
   branch's  ->  branch&apos;s
   Hub's     ->  Hub&apos;s
No POS logic, prices, permissions, transactions, or styling changed.

DIRECT PASTE INSTALLATION (NO SCRIPT)
1) Unzip this patch somewhere OUTSIDE the Maliks Hub project.
2) In Windows File Explorer, open the extracted ZIP.
3) Copy the 'app' folder (it contains tills/till-checkout.tsx).
4) Paste 'app' into the ROOT of your existing 'maliksgroupza'
   folder (same folder as package.json). Merge the folder and
   REPLACE the existing 'app/tills/till-checkout.tsx' file.
5) Do not paste a 'new-files' folder; this patch has none.
6) To affect GitHub Actions, the change must be COMMITTED to GitHub.
   File copying alone does not update files in the GitHub repository.
   If you have no Git installed, open your GitHub repository in a
   browser, edit app/tills/till-checkout.tsx with the pencil icon,
   change only the two apostrophes shown above, and commit the edit.

VALIDATE
In the Hub folder: npm run check
NOTE: 101 existing lint warnings are not the two blocking errors.
The test stage did not execute in the supplied log because lint failed.

SOURCE COMPATIBILITY
This one-file patch is derived from the Professional Touch365-style
POS upgrade previously provided in this chat. If you edited this TSX
file since installing that upgrade, DO NOT replace it wholesale;
use the two precise text substitutions instead to preserve edits.
