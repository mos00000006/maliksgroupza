POWERBUILD — REMOVE VIEW WEBSITE BUTTON (SAFE TARGETED PATCH)

This removes only the '↗ View Website' button in the Hub header.
It does not delete catalogue data, storefront code or the site's routes.

1. Copy remove_view_website.py into your GitHub repo root.
2. Run: python remove_view_website.py
3. Commit the updated app/page.tsx (the script itself need not be committed).
4. Redeploy.

If the script reports 0 removed, this exact button is not present in your version.
Do not replace app/page.tsx with an older version just to remove the button.
