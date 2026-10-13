POWERBUILD / MALIKS GROUP HUB
STORE SPECIALS MANUAL SLIDER + MOBILE SWIPE + FULL IMAGE V5

REPLACE ONLY:
  app/store-specials.tsx

WHAT CHANGED
------------
1. NO automatic slide changes.
   Promotion pictures remain on the current page until the user changes it.

2. DESKTOP / PC:
   - Previous and Next buttons remain visible.
   - Clicking Previous/Next uses a card/page-flip style animation.
   - Slide dots can also be clicked manually.

3. CELLPHONE / MOBILE:
   - Previous/Next arrow buttons are hidden.
   - Swipe LEFT = next picture.
   - Swipe RIGHT = previous picture.
   - Small "Swipe to view next page" hint is shown.
   - Slide dots and page count remain.

4. FULL PICTURE VIEW:
   - Promotion image uses object-fit: contain.
   - It is no longer cropped to a short banner.
   - The complete pamphlet/photo is visible.
   - Desktop allows a tall full-page view up to the screen height.
   - Mobile follows the natural full image height.

No API changes.
No D1 migration.
No GitHub secret changes.
