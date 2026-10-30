MALIKS CATALOGUE — CORRECTION TO ORIGINAL MIXED FITTINGS PAGE

The previous patch was incomplete: it still produced a generic Fittings section.
This version REMOVES that section from the generated PDF and page-turning leaflet.

UG and SV are separate. Identifiable compression/HDPE, copper/brass, galvanised, PVC/pressure, and waste/trap products are separated. Window blinds belong to Window Blinds & Treatments. Unclassified plumbing components are placed in Plumbing Accessories, not a mixed Fittings page.

Copy these two files into your app folder, replacing the existing files, and redeploy:
  app/catalogue-pdf-grouping.ts
  app/catalogue-pdf.ts

Then REGENERATE the catalogue PDF or refresh the page-turning leaflet. Existing downloaded PDFs will not change automatically.

This patch does not update saved category values or category filters in the main online product list. The saved source records should be audited separately if that view is also incorrect.
