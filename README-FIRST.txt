POWERBUILD — FIND OUR STORES PATCH

Apply AFTER the PowerBuild_Leroy_Style_Complete_PATCH.zip website patch. This patch updates the public storefront and E-Commerce Control.

Files:
- app/ecommerce-storefront.tsx + CSS: search-enabled store locator and map directions.
- app/api/ecommerce/public/route.ts: read active store workspaces and confirmed profiles.
- app/api/ecommerce/control/route.ts: secured store profile editing; creates table if absent.
- app/ecommerce-control.tsx + app/ecommerce-store-manager.tsx: Stores tab to manage verified addresses, phone numbers and hours.

HOW TO USE
1. Back up repository and Cloudflare D1 database. Copy the patch files into the repository, preserving folders, commit and deploy.
2. In Hub > E-Commerce Control > Stores, enter street address, city/town, phone and weekday/Saturday/Sunday hours for each branch.
3. Tick 'Publish verified details' and Save branch. Publishing requires street address, city and weekday hours.
4. Open /shop#find-stores. Store names come from the active Store workspaces in the Hub. All branches are listed; unverified addresses/hours are NOT invented.
5. Get directions opens Google Maps search using the verified postal address, not guessed coordinates.

Public domain/Cloudflare Access: public storefront and public catalogue API must be publicly readable, while /api/ecommerce/control and all Hub management paths stay restricted.

This patch does not invent or verify any addresses/hours, and cannot display missing details until your branch teams enter and publish them. No deployment or live tests have been run.
