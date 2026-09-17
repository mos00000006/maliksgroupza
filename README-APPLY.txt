POWERBUILD / MALIKS GROUP HUB
STORE SPECIALS — ALL BRANCHES FIX V6

Replace only:
  app/api/store-specials/shared.ts

The Store Specials selector now uses EVERY active branch in the Hub, even when a
branch workspace has a different or blank type label.

Only genuine non-store locations are excluded:
- Head Office
- Distribution Centre / DC
- Wholesale / Wholesale Division
- Developments

Permissions remain unchanged:
- Full Company = all branches
- Assigned Store = assigned store only
- Regional / multi-store = assigned branches only
- Human Resource (HR) = no Store Specials access

No database migration.
No GitHub secret changes.
