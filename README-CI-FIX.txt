MALIKS HUB — SALES/TILLS CI LINT FIX (2026-11-05)
================================================

The GitHub check reported 3 errors inside the Sales / Tills addition:
- 2 Next.js no-html-link-for-pages errors for / links.
- 1 React hooks set-state-in-effect error when changing branches.

This fix:
- Uses next/link for navigation to the Hub home.
- Moves branch reset logic to the branch selector onChange handler.
- Cancels outstanding requests and resets the basket, search and cash preview on branch change.
- Prevents a cancelled product request from putting a previous branch's result into the basket.

IF YOU ALREADY INSTALLED THE SALES/TILLS FILES
----------------------------------------------
From the root of your Maliks Hub Git repository in VS Code PowerShell:
  git status
  git apply --check "C:\path\to\extracted\fix-installed-app-files.patch"
  git apply "C:\path\to\extracted\fix-installed-app-files.patch"

If you accidentally copied the whole ZIP into your project and the repository also
contains a new-files/ folder, ALSO apply:
  git apply --check "C:\path\to\extracted\fix-new-files-folder.patch"
  git apply "C:\path\to\extracted\fix-new-files-folder.patch"

The "new-files" directory is only an installation staging folder and should NOT be
tracked in your Hub repository. Confirm that its required contents were installed
before removing this staging folder from your repository.

If git apply --check fails, do not force. Your files have changed since our patch.
Send the latest app/tills/page.tsx and app/tills/till-checkout.tsx for a safe merge.

IF YOU HAVE NOT INSTALLED THE INTEGRATION
-----------------------------------------
Use "Maliks_Hub_Sales_Tills_Assignment_Integration_ESLint_FIXED.zip" instead of
last time's integration ZIP; it includes the same original assignment patch and
corrected new files.

TESTS
-----
  npm run lint
  npm run test
  npm run check
  npm run build

Only the 3 errors in the provided log were targeted. The 101 warnings are not
lint errors and may remain. This package was checked with TSX syntax parsing and
static regression checks, but a full project npm run check was not executable in
this environment because the repository's dependencies are not installed here.

The change does not enable live sales or modify stock/accounting data.
