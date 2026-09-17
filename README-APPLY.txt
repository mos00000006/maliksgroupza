POWERBUILD / MALIKS GROUP HUB
STORE SPECIALS — TRUE FULL IMAGE VIEW V6

REPLACE ONLY:
  app/store-specials.tsx

FIX
---
The promotion viewer was still forcing the artwork into a fixed-height stage.
This caused the lower part of tall pamphlets to be clipped.

This version:
- removes the fixed 360px carousel height;
- removes the 76vh maximum image height;
- lets the card grow to the natural full height of the promotion image;
- keeps object-fit: contain;
- keeps manual Previous / Next on desktop;
- keeps swipe left/right on mobile;
- keeps the page-flip animation;
- moves slide dots / page counter to the top so they remain visible on tall flyers.

No API changes.
No D1 migration.
No secret changes.
