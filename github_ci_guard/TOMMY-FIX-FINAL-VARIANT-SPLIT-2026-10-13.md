# Tommy Fix final variant split — 13 October 2026

This migration is a corrective sweep for the live D1 catalogue. It removes the remaining grouped Tommy Fix range cards and restores every known Tommy Fix variant as its own catalogue item.

## Key correction
- `WHPDF-CARD-P09-20` and `WHPDF-CARD-P09-21` are explicitly removed.
- Expansion-bolt variants such as 6X50 2 PCS, 6X50 4 PCS, 10X75 2 PCS, 12X90 4 PCS, etc. become separate cards.
- The same corrective sweep covers the other Tommy Fix families already supplied.
- All restored Tommy Fix variant cards are placed in **Fasteners** and normalized to use the compact SIZE / PACK card styling.

## Variant records covered
186 unique Tommy Fix codes are included in the corrective sweep.

## Migration
- `drizzle/0020_tommy_fix_final_variant_split.sql`
