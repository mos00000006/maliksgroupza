POWERBUILD — REMOVE VIEW WEBSITE BUTTON (FINAL)

The previous ZIP contained a script that was never run by simply uploading it.
This package is specifically for removing the visible Hub header button.

RECOMMENDED: In your GitHub repository root, execute:
    python remove_view_website.py

Then review and commit app/page.tsx, push and wait for your deployment to complete.
The script creates app/page.tsx.view-website-backup and does not modify any other Hub file.
If the button remains on the public deployment, check that your latest commit actually deployed and hard-refresh the browser (Ctrl+Shift+R).

ALTERNATIVE (GitHub website editor):
Open app/page.tsx and search for "View Website". Delete only the complete <a ...>↗ View Website</a> element. Commit the change.

IMPORTANT: This does NOT remove /shop routes, the customer-facing website or E-Commerce Control; it only removes the View Website button.
Do not upload this ZIP and expect GitHub to run its Python script automatically.
