MALIKS GROUP HUB — QR PRODUCT SCAN LABEL FIX

Change:
- The customer product page opened by QR scanning no longer shows
  "PRICE FOR ALL BRANCHES" for normal, company-wide prices.
- If a product has a specific branch price override, "PRICE FOR [BRANCH]"
  still appears, so customers can identify branch-specific pricing.
- Product details, prices, QR links, images and tile Smart Measure are unchanged.
- Works for both PowerBuild and BusterBuild QR product pages.

Installation:
1. Back up your project.
2. Copy app/p/[token]/product-scan-page.tsx from this ZIP into your
   project, replacing the existing file.
3. Build and deploy the updated website using your normal process.
4. Open an existing general-price QR link to verify the label has gone.
   No QR reprint or database migration is required.

The existing server and live website are not changed until you deploy.
