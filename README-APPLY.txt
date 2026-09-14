POWERBUILD / MALIKS GROUP — REMOVE TOUCH365 ON-HAND

This patch removes the Touch365 On-Hand feature from Our Catalogue while keeping the catalogue, product images, search, pagination and Add/Edit/Remove functions.

REPLACE THESE FILES IN GITHUB:
1. app/catalogue.tsx
2. app/globals.css
3. app/mobile-improvements.css
4. .github/workflows/deploy.yml

FOR COMPLETE CODE CLEANUP, DELETE THESE OLD TOUCH365 ITEMS FROM GITHUB:
- app/api/catalogue/stock/
- app/api/integrations/touch365/
- docs/TOUCH365-LIVE-STOCK-SETUP.md

The TOUCH365_SYNC_SECRET GitHub secret is no longer used after replacing deploy.yml. It may also be deleted from GitHub Settings > Secrets and variables > Actions if desired.

Then commit/push and allow the normal deployment workflow to finish.
