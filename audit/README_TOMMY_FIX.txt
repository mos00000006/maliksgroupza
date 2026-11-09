TOMMY FIX FASTENER CATALOGUE CORRECTIONS — 9 NOVEMBER 2026

CONTENTS
- drizzle/0058_tommy_fix_supplier_verified.sql : 164 separate supplier-catalogue product variants
- public/wholesale-products/tommy-fix/ : one product pack photograph per product card (16 images)
- tommy_fix_verified_codes.csv : code/description review and stock import reference

Fixes catalogue codes, dimensions, packs, and old incorrect aliases. Historical bad codes are
marked inactive, not deleted, to avoid breaking referenced stock/invoice records.
This updates the catalogue database only when the D1 migration is applied.

HOW TO APPLY
1. Extract TOMMY_FIX_PATCH.zip into your existing maliksgroupza project root.
2. Back up your Cloudflare D1 database before applying the migration.
3. From project root run: npm run db:migrate:production
4. Deploy website: npm run deploy (requires your configured Cloudflare credentials).
5. Refresh catalogue/clear cache, then compare Tommy Fix SKUs against CSV.

Alternatively use MALIKS_GROUP_HUB_TOMMY_FIX_CORRECTED.zip for the full updated source.
This zip intentionally excludes .git and dependency folders. No live Cloudflare
website or remote D1 database was changed in this session.

NOTE: Supplier image scans contain a few discrepancies and repeated entries.
Confirm these printed codes and their pack sizes before stock-ledger migration:
- TEK 5.5X20 (25 PCS): image appears to print TK-TKS5520-25, other sizes TF-TKS.
- COACH 10X75 (8 PCS): image prints TF-CSP1075 without an -8 suffix.
- Drywall 4X75 (100 PCS) is listed in a bulk-pack panel with inconsistent column text.
- Some brochure columns show text unrelated to the printed product code.

For consistent system identifiers the CSV uses TF-TKS5520-25 and TF-CSP1075-8
(the same code pattern as their adjacent sizes). These exceptions require supplier sign-off.
