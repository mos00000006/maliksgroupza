POWERBUILD RETAIL WEBSITE REDESIGN — BUILDERS-INSPIRED NAVIGATION

Apply AFTER PowerBuild_Live_Website_Hub_Sync_PATCH.zip.
Replace only:
  app/ecommerce-storefront.tsx
  app/ecommerce-storefront.module.css

What changes: search bar in the site header; department navigation; dynamic category tiles; promotional section fed by existing Hub specials; redesigned product cards and retail landing page; responsive menu. All departments come from the live public API; no hard-coded product inventory.

Preserved: /shop and /wholesale-shop, same D1 catalogue sync, pricing and image fields, Hub View Website link, permissions, cart, B2B account verification, checkout, order tracking, and stock status. Existing catalogue images still need to be present in their image fields.

CAUTION: This is an original PowerBuild design inspired by major hardware e-commerce patterns, not a copy of Builders website/branding. The reference site blocks automated viewing. The previous patch must already be installed.

After copying files, run npm run check and deploy, then inspect desktop/mobile /shop. No direct production deployment included.
