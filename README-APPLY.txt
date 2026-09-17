POWERBUILD / MALIKS GROUP HUB
STORE SPECIALS — ALL 20 BRANCHES VISIBLE V16

REPLACE ONLY:
  app/store-specials.tsx

WHY ONLY 6 WERE SHOWING
-----------------------
The Hub was receiving all 20 branches (the '(20)' counter proved this), but the
branch area was still being clipped by layout/overflow behaviour.

NEW METHOD
----------
Desktop:
- 5 branch columns.
- 20 stores = approximately 4 rows.
- All branches are visible at once.
- NO internal branch scrollbar.

Large tablet / smaller desktop:
- 4 columns.

Tablet:
- 2 columns.

Cellphone:
- 1 column.
- The MAIN promotion form scrolls normally.

ANTI-CLIPPING
-------------
The branch box and branch grid are explicitly forced to:
  height: auto
  max-height: none
  overflow: visible

The branch grid also has an inline style safeguard so older/global CSS cannot
silently clip the remaining branches again.

No API change.
No D1 migration.
No secret change.
