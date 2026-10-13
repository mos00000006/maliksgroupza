# Wholesale leaflet flipbook viewer — 13 October 2026

Replaced the blocked browser PDF iframe with a native in-Hub leaflet viewer inspired by retail promotion flipbooks.

## What changed
- `View Leaflet` no longer embeds the generated PDF in an iframe.
- The Hub now renders the catalogue pages as screen-optimised leaflet pages and displays them directly.
- Desktop uses a cover-first layout followed by two-page spreads.
- Mobile uses a single-page viewer with large Previous / Next controls.
- Added page thumbnails for direct navigation.
- Added keyboard Left / Right navigation on desktop.
- Added a real Full Screen button using the browser Fullscreen API.
- Escape closes the viewer.
- The existing `Download Wholesale Division PDF` button remains unchanged and still creates the high-resolution print PDF.

## Why this fixes the blocked-content screen
The previous viewer used an iframe pointing to a browser-generated PDF blob URL. Some browser/security configurations refuse to render that content inside a frame. The new viewer does not use an iframe or an embedded PDF plugin.

## Files updated
- `app/catalogue.tsx`
- `app/catalogue-pdf.ts`
- `app/globals.css`
