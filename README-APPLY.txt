POWERBUILD / MALIKS GROUP HUB
STORE SPECIALS — FULL UP/DOWN BRANCH SCROLL CONTROLS V12

REPLACE ONLY:
  app/store-specials.tsx

WHAT IS FIXED
-------------
The branch list now has dedicated navigation controls on the RIGHT side:

  ▲  Scroll to top
  ▼  Scroll to bottom

The down-facing button is always visible at the bottom of the branch panel.

You can still:
- drag the normal scrollbar thumb;
- use the mouse wheel / trackpad;
- swipe vertically on cellphone.

The last branch can now be reached cleanly because the scrollable area has extra
bottom padding and the Down button scrolls directly to scrollHeight.

STYLE
-----
- Separate clean arrow buttons.
- Slim native scrollbar.
- Rounded blue/grey rail.
- Works on desktop and mobile.
- All Branches disables the scroll controls because the individual checkboxes
  are disabled.

No API changes.
No D1 migration.
No GitHub secret changes.
