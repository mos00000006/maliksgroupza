POWERBUILD / MALIKS GROUP HUB
STORE SPECIALS — ALL 20 STORES FIT ON DESKTOP V17

REPLACE ONLY:
  app/store-specials.tsx

FIX
---
The Hub was loading all 20 stores, but a 5-column layout showed only 3 rows
(15 stores) inside the visible area.

Desktop is now deliberately:
  5 columns x 4 compact rows = 20 stores

The branch grid is 160px high with four 34px rows, so all 20 branch checkboxes
fit inside the branch panel at once.

Responsive:
- Desktop: 5 columns x 4 rows
- Smaller desktop: 4 columns, natural height
- Tablet: 2 columns, natural height
- Mobile: 1 column, natural height

No branch scrollbar is used.
No API/database/secret changes.
