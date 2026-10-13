# View Wholesale Leaflet — 13 October 2026

Added a new **View Leaflet** function to the Company Hub catalogue alongside the existing **Download Wholesale Division PDF** button.

## What changed
- Added a **View Leaflet** button in the catalogue toolbar.
- The leaflet is generated from the same live catalogue data used for the downloadable Wholesale Division PDF.
- The leaflet opens inside the Hub in a large PDF viewer.
- Added **Open full screen** for users who want a larger browser/PDF view.
- Added a close button and tap-outside-to-close behaviour.
- On mobile, the leaflet viewer opens full-screen for easier reading.
- Kept the existing **Download Wholesale Division PDF** button unchanged.

## Technical change
The PDF generator now exposes a reusable `buildWholesaleCataloguePdf()` function so the same current catalogue PDF can either be viewed or downloaded without maintaining two different leaflet designs.

## Files updated
- `app/catalogue.tsx`
- `app/catalogue-pdf.ts`
- `app/globals.css`
