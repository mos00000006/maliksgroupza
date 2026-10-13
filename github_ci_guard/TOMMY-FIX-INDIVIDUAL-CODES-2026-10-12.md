# Tommy Fix individual code restore — 12 October 2026

Updated the Company Hub catalogue and Wholesale Division PDF data so Tommy Fix items appear one by one for each product code instead of grouped range cards.

## What changed
- Removed grouped Tommy Fix range-card records from the live catalogue.
- Restored individual Tommy Fix items by code.
- Reused the existing wholesale product images for the relevant Tommy Fix lines.
- Added a new database migration so the fix applies on deployment.

## Main file added
- `drizzle/0016_tommy_fix_individual_codes.sql`

## Result
Tommy Fix products now list as separate products per code in:
- the Company Hub catalogue
- the generated Wholesale Division PDF
