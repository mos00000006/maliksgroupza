POWERBUILD HUB / MALIKS GROUP HUB — PAIA SIDEBAR BUTTON V5
=============================================================

WHAT THIS CORRECTS
The previous V4 ZIP contained an installation script only. Merely copying
it into your Hub did NOT insert the menu button. This V5 patch already
contains the PAIA button in app/page.tsx; NO installer, BAT or terminal
command is required.

HOW TO INSTALL
1. IMPORTANT: Back up your current app/page.tsx (or commit it to Git).
2. Open the ZIP. Copy its `app` folder into the project root `maliksgroupza`.
3. Merge/replace `app/page.tsx`.
4. Confirm the GitHub change view shows app/page.tsx modified with text
   `PAIA Manual` beside the navigation near Company Workspaces.
5. Commit and push, wait for GitHub check AND deployment to succeed,
   restart/reload PowerBuild Hub (Ctrl+Shift+R if needed).
6. The PAIA Manual button appears directly BELOW Company Workspaces in
   the PowerBuild Hub left sidebar. It opens /paia.

IMPORTANT ABOUT MERGING
This direct replacement is based on the supplied main Hub file with the
Sales / Tills link already integrated. If your live app/page.tsx has been
customized since then, DO NOT blindly overwrite those additional edits.
Instead copy ONLY the labelled `PAIA_MANUAL_SIDEBAR_BUTTON_V4` block from
this file into your current app/page.tsx, immediately before:
  {sidebarNavigation.map((n) => {
That is all the code required.

If the button appears but /paia is 404: the PAIA page itself needs to be
present at app/paia/page.tsx and successfully deployed.

No changes to payments, stock data, permissions or database. No migration.
