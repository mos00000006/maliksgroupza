# Catalogue wholesale PDF styling refresh — 12 October 2026

Updated the browser-generated **Wholesale Division PDF** so it has a cleaner, more professional layout with centred alignment and Nexa-first typography.

## What changed
- Switched the wholesale export to a page-rendered design for cleaner visual consistency.
- Uses **Nexa** first, with browser fallback if Nexa font files are not present.
- Added optional font support under `public/fonts/`.
- Improved the card layout with centred stock codes, centred product names, aligned image areas and a cleaner page footer.
- Preserved the existing **Download original PDF** and **Download wholesale division PDF** buttons.

## Files updated
- `app/catalogue-pdf.ts`
- `public/fonts/README.txt`
