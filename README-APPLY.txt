POWERBUILD CATALOGUE - TOUCH365 LIVE STOCK PATCH

Replace/add these files in GitHub:
- app/catalogue.tsx
- app/globals.css
- app/mobile-improvements.css
- app/api/catalogue/stock/route.ts
- app/api/integrations/touch365/shared.ts
- app/api/integrations/touch365/stock/route.ts
- .github/workflows/deploy.yml
- docs/TOUCH365-LIVE-STOCK-SETUP.md

Then commit and push.

IMPORTANT: The Hub-side live stock feature is ready, but actual Touch365 numbers will only appear after Touch365 or a local bridge starts sending stock data to the new secure sync endpoint. See docs/TOUCH365-LIVE-STOCK-SETUP.md.
