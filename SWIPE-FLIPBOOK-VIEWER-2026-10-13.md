# Swipe Flipbook Viewer — 13 October 2026

The Hub `VIEW LEAFLET` viewer now behaves like an actual swipe/drag flipbook instead of simply swapping pages.

## Added
- Swipe left / drag left to turn forward.
- Swipe right / drag right to turn backward.
- 3D page-turn animation with front and back page faces.
- Desktop two-page spread remains supported.
- Mobile uses one full page with touch swipe navigation.
- Previous / Next buttons and keyboard arrows now use the same page-turn animation.
- Full-screen and thumbnails remain available.
- Footer includes a small `Swipe or drag to flip pages` hint.

## Files changed
- `app/catalogue.tsx`
- `app/globals.css`

No database migration is required for this viewer update.
