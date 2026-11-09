MALIKS GROUP HUB CATALOGUE AUDIT FIX — V7
9 November 2026

WHAT THIS FIXES
- Correct padlocks (T001-T030 available codes) from Locksets to Locks in both UI and PDF grouping
- Add missing active category filters (Bathroom, Tiles & Flooring, Tork Craft, Hamiltons, UG etc)
- Move correctly identified UG items and window blinds into separate departments
- Correct 85 garbled product names (supplier-import encoding)
- Retire two duplicate Nail-In Anchor legacy SKU codes without deleting records
- Add representative tub photos to two older 6x60 Nail-In Anchor SKUs
- Keep all Tommy Fix packaging stickers branded but without printed SKU codes (V6 included)
- Fix catalogue pagination after filter/deletion changes

INSTALL INTO YOUR ACTUAL GITHUB PROJECT (NOT A NEW EMPTY REPOSITORY)
1. Back up your GitHub branch and Cloudflare D1 database before deploying.
2. Unzip this archive into the ROOT of the Maliks Group Hub source project.
   Merge the app/, drizzle/, tests/ and public/ folders. Do not put the folders inside another folder.
3. Ensure earlier catalogue migrations up to 0065 are present (if previously deployed).
   This ZIP includes 0066 and 0067; if your own repo has different migrations with those numbers, review before merging.
4. Run locally:
     node --experimental-strip-types --test tests/catalogue-audit-v7.test.mjs
     npm run check
5. Prepare production config if .deploy/wrangler.jsonc does not exist:
     npm run config:production
6. Apply D1 migration remotely (after taking a D1 backup):
     npx wrangler d1 migrations apply maliks-group-hub-db --remote --config .deploy/wrangler.jsonc
7. Redeploy with your normal GitHub/Cloudflare deployment workflow (or npm run deploy).
8. In the Hub catalogue, verify Locks, Locksets, Underground (UG), Window Blinds & Treatments, Tommy Fix and PDF export.

NOTES
- This is a PATCH of source files and D1 migrations, NOT a complete replacement Hub.
- The checked catalogue is a local replay from supplied files; live Cloudflare records may differ.
- Existing prices, stock and IDs were not changed by migration 0067.
- V6 packaging uses AI-assisted representative pack images; verify all supplier image/pack specifics before external publication.
- Do not reuse this patch with a different migration numbering scheme without checking schema compatibility.
- See CATALOGUE_AUDIT_REPORT.md and CATALOGUE_REVIEW_QUEUE.json for issues that still need product images/specifications.
