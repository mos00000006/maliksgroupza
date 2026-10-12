# Wholesale original catalogue — one-by-one product image correction

This update corrects the original wholesale PDF import so the Company Hub catalogue does **not** explode one product picture into multiple duplicate catalogue cards.

## Corrected behaviour
- Each original product visual is exported as its own clean catalogue product image.
- Product images are normalised to 1000 × 1000 on a clean white background for consistent Hub/PDF presentation.
- Source-page headings, product-code tables, blue source labels, neighbouring cards and stray catalogue text are removed from the product pictures.
- The earlier exploded 323-row import is replaced by **201 clean one-by-one wholesale catalogue records**.
- Multi-size Tommy Fix cards remain one visual product-range card, with available sizes kept in the description instead of creating many repeated catalogue cards using the same picture.
- The duplicated PT69 OBS card printed twice in the source PDF is intentionally represented once in the Hub.
- Internal `WHPDF-*` identifiers are displayed as **WHOLESALE RANGE** so technical seed IDs do not appear to users.
- Only the **Download Wholesale Division PDF** action remains.

## Database correction
Migration `0014_wholesale_one_by_one_catalogue_fix.sql` clears static images assigned by the earlier import, removes the earlier system-created PDF rows, and recreates the corrected one-by-one records.

## Files
- `drizzle/0014_wholesale_one_by_one_catalogue_fix.sql`
- `docs/wholesale-original-one-by-one-2026-10-12.csv`
- `public/wholesale-products/*`
- `app/catalogue.tsx`
- `app/catalogue-pdf.ts`
