POWERBUILD WEBSITE BUTTON REMOVAL

This package removes the header “View Website” button and the retail/wholesale website shortcut buttons within E-Commerce Control. It does NOT delete any website routes or catalogue data.

DIRECT REPLACEMENTS:
- app/page.tsx (based on PowerBuild_Leroy_Style_Complete_PATCH.zip)
- app/ecommerce-control.tsx (based on PowerBuild_Leroy_Find_Our_Stores_PATCH.zip)

WARNING: These are based on the latest available historical patches, NOT on your live repository. Replacing newer GitHub files with these versions may overwrite recent work. PREFERRED: apply only the exact removals shown in remove-buttons.patch to the CURRENT files.

GitHub browser steps: open app/page.tsx > Edit > search 'View Website' > delete the entire <a ...>↗ View Website</a> line > Commit. Then open app/ecommerce-control.tsx and delete the one div containing View Retail Website and View Wholesale Portal > Commit. Wait for your GitHub workflow to successfully DEPLOY, not just run lint. Refresh the live Hub (Ctrl+Shift+R).

If it remains, confirm your live Cloudflare deployment is using the GitHub branch you edited, and verify the deployment completed successfully.
