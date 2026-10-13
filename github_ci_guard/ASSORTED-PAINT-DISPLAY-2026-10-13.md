# Assorted paint display simplification — 13 October 2026

The catalogue and Wholesale Division PDF have been simplified for imported paint ranges that are shown in 5L / 20L assorted options.

## What changed
- Removed the visible 5L and 20L stock-code boxes from the catalogue.
- Removed the 5L / 20L editable stock-code fields from the product editor.
- Imported 5L / 20L assorted ranges now show a single clean **ASSORTED** badge.
- The internal catalogue reference is retained for administration, but is hidden from assorted product cards.
- The Wholesale Division PDF also shows **ASSORTED** instead of size-specific codes for these products.
- Normal single-code products still show their product code as before.
- Added migration `0018_catalogue_assorted_display.sql` to clear only automatically generated size codes while preserving any manually entered codes in the database.
