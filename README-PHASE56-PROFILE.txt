POWERBUILD GROUP HUB - CATALOGUE PAGE 2 PROFILE PATCH

Applies to: the LIVE "Download Wholesale Division PDF" button in Hub > Our Catalogue
Also updates the interactive catalogue leaflet page order.

INSTALL
1) Extract the zip into the root of repository: mos00000006/maliksgroupza
2) Overwrite the matching two .ts/.mjs files in app/ and tests/.
3) Ensure the new PNG resides at public/powerbuild-company-profile-page.png
4) Commit, push, and deploy the MALIKS GROUP HUB workflow (not the POS Department workflow).
5) Use Hub > Our Catalogue > Download wholesale division PDF.

ORDER
Page 1: Existing catalogue cover
Page 2: Approved PowerBuild company profile (blue/yellow, introduction, mission, top-view facility photo)
Page 3 onward: Catalogue contents, then categorized product pages
Contents page references and PDF page numbers updated to match.

NOT MODIFIED: original historical PDF download, product catalogue data, prices, departments, POS.

VALIDATION: node --test tests/catalogue-company-profile.test.mjs
The build/load requires the image asset; missing artwork causes a clear error rather than silently omitting page 2.
