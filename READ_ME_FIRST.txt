Maliks Group Hub — PAIA Manual sidebar button V4
=================================================

Why this patch:
The earlier PAIA update created /paia but did not add a Hub sidebar button.

What this patch does:
- Adds a visible "PAIA Manual" menu button near the TOP of the main Hub sidebar.
- Clicking it opens /paia.
- The button uses the existing PowerBuild sidebar style.
- Does NOT replace app/page.tsx, keeping your current Sales / Tills, Stock Control, and other integrations intact.
- Does NOT change stock records, permissions or databases.

How to install (Windows):
1. Extract the ZIP.
2. Copy its scripts folder and INSTALL_PAIA_BUTTON.bat into your EXISTING maliksgroupza folder.
3. Double-click INSTALL_PAIA_BUTTON.bat in that main folder. (Node.js must be installed.)
   Or run: node scripts/add-paia-sidebar-button.mjs
4. Commit the changed app/page.tsx plus the script to GitHub and deploy.
5. Restart/reload PowerBuild Hub. The PAIA Manual button will be near the top of the left menu.

Important:
- The PAIA route/page and PDF must already be installed. If you get a 404 at /paia,
  first install the previous PAIA page patch.
- The PAIA manual is a draft until company registration details, Information Officer
  appointment and legal approval are confirmed.
- This installer is idempotent; running it twice does not duplicate the button.
- If the Hub's navigation code changes significantly, the installer will fail safely
  without overwriting your existing page.

Verification:
- Installer tested against the original Hub app/page.tsx and a second time for idempotency.
- Does not require any SQL migration.
