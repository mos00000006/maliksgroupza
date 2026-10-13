# Editable 5L / 20L paint stock codes — 13 October 2026

The Company Hub catalogue now stores 5L and 20L stock codes as real editable database fields rather than generating them from the main catalogue reference.

## What changed
- Added editable `5L stock code` and `20L stock code` fields to Add/Edit Catalogue Product.
- Added database columns `code_5l` and `code_20l`.
- Existing imported paint range cards retain their currently displayed size-code values as starting values so managers can replace them with the real ERP stock codes.
- Normal single-code products are not changed.
- Products with size-specific codes show those codes in the catalogue instead of the main code badge.
- Wholesale Division PDF uses the saved 5L / 20L codes.
- Catalogue search now also searches the saved 5L and 20L stock codes.
- Mobile edit layout stacks the two size-code fields cleanly.

## Deployment
Migration `drizzle/0017_catalogue_variant_stock_codes.sql` must run before the new Worker code. The existing GitHub deployment workflow already applies D1 migrations before Worker deployment.
