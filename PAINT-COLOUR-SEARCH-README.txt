COMPANY HUB — SINGLE TAG PAINT COLOUR + NAME/CODE SEARCH

Apply to COMPANY HUB, on top of your current price-tag studio and vehicle
logbook installation. Copy all included folders into the repository root,
commit and redeploy through your usual workflow.

NEW DATABASE MIGRATION
  drizzle/0045_single_price_tag_colour.sql
Apply it using your normal remote D1 migrations step. Both existing price-tag
tables must already exist. No live deployment or remote migration was run
while preparing this patch.

INTEGRATION
Your existing vehicle prebuild installer now also calls the new paint/search
installer automatically. That script makes targeted edits to your existing
price-tag files so the studio menu, other generators and access controls stay
in place. It also appends its command to the existing package prebuild script,
preserving any existing commands.

If your deployment does NOT run the existing assessment -> attendance ->
vehicle prebuild hooks, run this once in the repository root before building:
  node scripts/install-paint-tag-search.mjs
Then commit the resulting source/package changes as well. Leave the generated
.before-paint-search backup files out of your commit. The script is repeat-safe
and accepts --check without writing. If the source differs from its supported
anchors, it stops before changing files; share that error and current source.

HOW TO USE
1. Open Price tag generator, sign in as the designer and choose your brand.
2. Under Single product tag, search by Product name or code.
3. A name search shows product names, categories and codes. Choose the correct
   result. An exact code match opens directly as before.
4. Enter the price. For a standard non-tile product there is a new optional
   Paint colour field, e.g. White, Ivory or Charcoal.
5. Generate price tag. Colour appears on the printed tag, JPG/PDF print output
   and the customer QR page. Changing colour requires Generate again before
   export. Clear the field and regenerate to remove it.

The colour is saved separately for PowerBuild and BusterBuild, up to 80
characters on one line. It does not rename or recolour the catalogue product
or photograph. This uses the existing one-tag-per-product-per-brand design:
changing a colour updates that tag and its same QR link. Use separate product
codes for distinct stock variants requiring independent permanent QR tags.
Older clients that update a price without a colour field preserve the saved
colour. Invalid colour/price fields fail before a database write. Tile pricing,
pack coverage, QR addresses, saved pictures and sales-app prices are retained.

Name/code search reads the Hub's active catalogue only. It matches entered
words in names/codes without needing exact case, lists up to 30 results and
asks you to narrow broad searches. It is not an external supplier search.
Existing management permissions AND designer-session checks apply to searches.

FILES MODIFIED BY THE INSTALLER
- Tag model/input validation and existing single-tag SQL upsert.
- Existing authorised GET handler, adding q= name/code results.
- Public tag columns/serialisation for customer colour display.
- Single-tag editor/search, printed card and customer page.
No full root Hub page, Worker, studio component, pricing table helper or
security guard is overwritten by this patch. The vehicle installer change
adds only the paint/search build-hook call.

VERIFICATION
4 SQL/API/installer checks passed: name and code search, inactive products,
literal wildcard escaping, colour save/reload/clear, per-brand independence,
price-only update preservation, stable QR, unpublished visibility, management
and designer access checks, installer idempotence, atomic refusal on unknown
source, existing menu and prebuild command preservation.
Focused lint passed without errors. Browser checks used the actual modified
single editor, search, tag card, public page and API with local DB/auth test
bindings: both brands, long colour wrapping, dirty export blocking, saved QR
colour and an actual 2700x1800 JPG download. Other studio tools and background
cutout preparation were mocked in that focused browser test; they were not
changed. Full production deployment was not tested. No live product data was
used in these checks.
