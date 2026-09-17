POWERBUILD / MALIKS GROUP HUB
STORE SPECIALS — NATIVE WINDOWS BRANCH SCROLL V14

REPLACE ONLY:
  app/store-specials.tsx

THIS VERSION REMOVES ALL CUSTOM SCROLLBAR STYLING.

The branch list now uses a normal browser/Windows scroll box:
- standard up arrow where the browser provides it;
- standard down arrow where the browser provides it;
- standard draggable scrollbar thumb;
- mouse wheel / trackpad scrolling;
- all hidden branches remain reachable;
- 3 columns on desktop;
- 1 column on mobile;
- mobile supports normal swipe scrolling.

TECHNICAL CHANGE
----------------
The scroll is now on a dedicated wrapper:
  .specialBranchScroller

The branch grid itself no longer controls overflow. This avoids the previous
grid/scrollbar behaviour that was clipping or making branches difficult to reach.

Desktop branch panel height: 260px.
Mobile branch panel height: 48dvh.

No API changes.
No database changes.
No secret changes.
