POWERBUILD / MALIKS GROUP HUB
STORE SPECIALS — FULL BRANCH LIST V7

REPLACE ONLY:
  app/store-specials.tsx

FIX
---
The branch selector was already receiving the full branch list, but it had:
  max-height: 220px;
  overflow: auto;

That created a small internal scrollbar and only showed the first rows.

This version:
- removes the internal branch-list scrollbar;
- shows ALL branches at once in the promotion form;
- keeps the form itself scrollable normally;
- shows the total number of branches in the header;
- keeps 3 columns on desktop;
- keeps 1 column on mobile.

No API changes.
No database changes.
No secret changes.
