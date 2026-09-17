POWERBUILD / MALIKS GROUP HUB
SYSTEM CONTROL CENTRE — PROTECTED DEVELOPERS V4

REPLACE:
  app/api/system-control-centre/route.ts
  app/system-control-centre.tsx

PERMANENTLY PROTECTED ACCOUNTS
------------------------------
These identities cannot be disabled from User Access:
- Moses Moyana
- Azam Malik
- msallikutti@gmail.com

Moses is also protected by the known developer email:
- moyanamoses006@icloud.com

HOW IT WORKS
------------
Protection is enforced in TWO places:

1. UI
   The Disable Access button is removed and replaced with:
   🔒 Protected developer

2. API / SERVER
   Even if someone manually calls the API, the Hub refuses to disable one
   of the protected developer identities.

IMPORTANT
---------
Protection is ONLY for these three identities.

Any other user added now or in future can still be disabled/re-enabled normally,
even if they have a powerful role.

No database migration.
No secret changes.
