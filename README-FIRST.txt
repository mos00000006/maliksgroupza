MALIKS GROUP HUB — CATALOGUE DEPARTMENT CLEANUP (2026-11-03)

WHAT CAUSED THE MIX-UP
Older imports saved entire supplier pages into a single broad department: Plumbing,
Roofing, Fasteners & Ironmongery or Homeware. The PDF grouping patches only changed
how the pages rendered; the actual D1 database remained mixed.

WHAT THIS PATCH CORRECTS
- Separates UG, SV, plumbing pipes, waste, HDPE, copper/brass and galvanised fittings.
- Puts Alco window blinds in their own department; blind rivets remain Fasteners.
- Separates locks, fasteners, tools, roofing, waterproofing, ceiling boards and timber.
- Removes the original mixed Fittings PDF grouping.
- Uses category labels consistently in the Hub's online category navigation.
- Keeps all stock codes, pictures, prices and product status unchanged.

SAFE INSTALLATION — USE YOUR CURRENT GITHUB REPOSITORY
1. BACK UP your repository and Cloudflare D1 database.
2. Copy app/catalogue-pdf-grouping.ts into app/ (replacing that file only).
3. Copy tests/catalogue-pdf-fittings.test.mjs into tests/ (replacing its outdated expectations).
4. Copy scripts/align_catalogue_ui.py into scripts/.
5. Run: python scripts/align_catalogue_ui.py
   This updates only the category lists in your CURRENT catalogue.tsx and catalogue-pdf.ts.
   It DOES NOT overwrite any other recent feature or the single-cover PDF layout.
6. Run npm run check; review errors before publishing.
7. BEFORE touching D1, review audit/proposed_changes.csv (212 proposed known-code
   corrections) and audit/needs_review.csv (1 undecidable entry).
8. Run audit/PREVIEW_CURRENT_DATABASE.sql on a copy of your CURRENT D1 database.
   Compare the actual active products with the proposed changes. There can be
   additional products not in the old ZIP, because the latest live database
   has not been exported in this conversation.
9. Apply drizzle/CATALOGUE_REVIEWED_CLASSIFICATION.sql to a D1 staging database;
   verify records and backups. Then apply on production once approved.
   DO NOT run the SQL merely by adding it to the migration folder if your
   deployment auto-runs migrations without prior review.
10. Run audit/VERIFICATION_AFTER.sql; regenerate the PDF/leaflet and spot-check.

IMPORTANT
- The 212 SQL updates are exact-code and only affect rows whose 'updated_by'
  indicates they were last modified by a system import. Manually edited rows are
  intentionally not overwritten.
- This is a verified classification correction for 461 rows extracted from
  older wholesale + Pulse Decor source imports, NOT a proof that every product
  in your current ~3,100+ product live D1 database is correctly categorised.
- A full product-by-product audit requires an export of the live
  catalogue_products table, including code,name,description,category,updated_by.
- New products can still be assigned the wrong category during manual entry;
  administrators should select the correct specific department in the Hub.
