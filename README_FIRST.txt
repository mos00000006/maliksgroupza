MALIKS GROUP HUB — POWERBUILD PAIA PREMIUM PAGE V7
==================================================

This update redesigns the existing /paia page. It fixes the broken layout and logo.

WHAT THIS PATCH CHANGES
  app/paia/page.tsx           new responsive PAIA page
  app/paia/paia.module.css    isolated page styling, responsive layout
  public/legal/powerbuild-paia-logo.webp  supplied PowerBuild logo, optimised
  public/legal/Maliks_Paint_Hardware_PowerBuild_PAIA_Manual_V1_1_DRAFT.pdf
  tests/paia-page-layout-v7.test.mjs      targeted regression checks

NO CHANGES to app/page.tsx or the Hub sidebar, Sales / Tills, Stock Operations,
permissions, any database, or the actual legal content of the PAIA PDF.

INSTALL (DIRECT PASTE)
1. Back up your current app/paia folder first.
2. Extract this ZIP.
3. From the ZIP, copy only its app, public, and tests folders into your
   existing maliksgroupza project and merge/replace matching files.
4. In your project, run:
     npm run check
5. Commit and push after the check passes. Wait for your normal deployment.
6. Close/reopen PowerBuild Hub and open /paia.

WHERE TO OPEN
  https://<your actual Hub domain>/paia

WHY THE OLD PAGE WAS CLIPPED
Hub globals.css targets bare HTML <aside> elements as a fixed left-hand sidebar.
The previous /paia page had a content <aside>, which covered the page. The new
page uses a normal div for document control and safely responsive CSS.

WHY THE OLD IMAGE WAS BROKEN
The old Next.js Image needed an image optimisation route, which may not be
available in your Cloudflare deployment. The new page uses a bundled WebP with
'unoptimized' so it loads as an ordinary static file.

IMPORTANT LEGAL STATUS
The PAIA manual remains DRAFT. The CIPC legal entity, Information Officer,
contact address and final authorisation must be confirmed before final publication.

TESTS PERFORMED
  5 targeted source tests passed.
  TSX syntax compile passed (no diagnostics).
  Browser layout checked at 1650, 1280, 850, and 390px: no horizontal overflow.
  Logos loaded in the render checks.
The full GitHub build and Cloudflare deployment were NOT run here.
