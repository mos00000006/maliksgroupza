# Leaflet viewer lint/build fix — 13 October 2026

Refactored the new interactive wholesale leaflet viewer to remove the React lint patterns introduced by the flipbook update.

## What changed
- Removed leaflet object-URL refs and the viewer DOM ref from render flow.
- Object URLs are now cleaned up from state lifecycle cleanup.
- Full-screen lookup now uses the viewer element ID inside the click handler.
- `moveLeaflet` and `closeWholesaleLeaflet` are memoised callbacks.
- The keyboard-navigation effect now has stable dependencies.
- Removed mobile viewport checks from JSX render expressions; mobile checks now occur only in interaction handlers.
- Preserved the flipbook viewer, thumbnails, full screen, keyboard arrows and PDF download.

## Main file updated
- `app/catalogue.tsx`
