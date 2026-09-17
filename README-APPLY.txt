POWERBUILD / MALIKS GROUP HUB
PROMOTION PLANNING V5 — FINALIZED PROMOTION ARCHIVE

REPLACE:
  app/promotion-planning.tsx
  app/api/promotion-planning/route.ts

HOW IT WORKS
------------
When Head Office changes a planning room to:
  Finalised

it immediately leaves the LIVE Next Promotion Planning area.

It moves to:
  🗃 Finalized Archive

The live dropdown now shows only:
- Open
- Reviewing

Finalised rooms do not clutter the live discussion.

FINALIZED ARCHIVE
-----------------
The archive is read-only and keeps:
- Agreed decisions
- Approved promotion products
- Shortlisted / agreed manager thoughts
- Discussion comments
- Full activity history
- User who submitted each item
- Created date
- Finalised status

The archive button shows how many completed planning rooms are stored.

DATABASE
--------
No new database table is needed.
The existing status='Finalised' is used as the archive flag.

The API history limit was increased from 12 to 100 planning rooms so older
completed planning records remain available.

No manual migration.
No new GitHub secret.
