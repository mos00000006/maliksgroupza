POWERBUILD / MALIKS GROUP HUB
PROMOTION PLANNING BUILD FIX V3

REPLACE:
  app/store-specials.tsx
  app/promotion-planning.tsx
  app/api/store-specials/route.ts

THIS FIXES THE GITHUB ACTION FAILURE
------------------------------------
Fatal error fixed:
  app/store-specials.tsx
  react-hooks/set-state-in-effect

The initial Next Promotion Planning notification-badge refresh is now scheduled
asynchronously with setTimeout(0), so React no longer detects a synchronous
setState call from the effect body.

ALSO CLEANED
------------
Promotion Planning warnings:
- Initial load effect dependency warning suppressed correctly.
- decisionVotes is now memoised.

Store Specials API warnings:
- Removed unused allowedWorkspaces import.
- Removed unused canAccessWorkspace import.

IMPORTANT: YOUR LOG ALSO SHOWS THIS FILE:
  app/app/store-specials.tsx

That is an accidental duplicate nested folder/file. It is NOT part of the Hub
structure. In GitHub, delete:
  app/app/store-specials.tsx

If the app/app folder contains nothing else you intentionally created, delete
the entire:
  app/app/

The warnings about <img> and the older Catalogue/Page hook dependency warnings
are warnings only; they do not stop deployment.

NO D1 MIGRATION.
NO SECRET CHANGES.
