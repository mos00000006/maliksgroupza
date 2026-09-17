POWERBUILD / MALIKS GROUP HUB
STORE SPECIALS — INSTANT NEXT/PREVIOUS SLIDE V18

REPLACE ONLY:
  app/store-specials.tsx

FIX
---
Previously the viewer waited about 180ms before changing the image, so the old
promotion page stayed visible after clicking Next/Previous.

Now:
- Next picture changes IMMEDIATELY on click.
- Previous picture changes IMMEDIATELY on click.
- The NEW picture receives a very short 0.14s flip-in effect.
- Repeated clicks are no longer blocked by an "animating" state.
- Mobile swipe also changes the picture immediately.
- No automatic slideshow is reintroduced.

No API changes.
No database changes.
No secret changes.
