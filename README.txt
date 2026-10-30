MALIKS GROUP HUB — CATALOGUE CATEGORY + GITHUB TEST FIX

Extract into the ROOT of your existing maliksgroupza repository, preserving paths:
 app/catalogue-pdf-grouping.ts
 app/catalogue-pdf.ts
 tests/catalogue-pdf-fittings.test.mjs

This supersedes all prior catalogue category patches. Do not layer older patches over this one.

What changes:
 - The generated PDF and interactive leaflet no longer produce the old mixed Fittings page.
 - UG, SV, compression/HDPE, copper/brass, galvanised, PVC/pressure and waste/trap are separated.
 - Window blinds are displayed in Window Blinds & Treatments instead of plumbing.
 - The GitHub test expectations now match the new, intended catalogue sections.

Does NOT change: source database classifications, live site deployment or online catalogue filter logic.
After merging: npm run check, commit/push, deploy and regenerate the PDF/leaflet.
