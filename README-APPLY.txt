POWERBUILD / MALIKS GROUP HUB
SYSTEM CONTROL CENTRE BUILD FIX V2

REPLACE ONLY:
  app/system-control-centre.tsx
  app/api/system-control-centre/route.ts

FIXED
-----
1. react/no-unescaped-entities errors:
   - "user's" is now JSX-safe.
   - "Hub's" is now JSX-safe.

2. System Control Centre API warnings:
   - removed unused allowedWorkspaces import.
   - removed unused AuditMember type.

The other warnings shown in your GitHub Action are pre-existing warnings and
do not stop the build.

IMPORTANT
---------
Your log still shows:
  app/app/store-specials.tsx

That is a duplicate nested file/folder. Delete app/app/store-specials.tsx from
GitHub if it is not intentionally used. It is not part of the normal Hub app
structure.

No database migration.
No GitHub secret changes.
