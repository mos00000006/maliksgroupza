POWERBUILD WEBSITE + LIVE HUB CATALOGUE PATCH
==============================================
Source: Maliksgroupza ZIP supplied earlier in conversation.

WHAT IS INCLUDED
- Updated retail storefront design at /shop (PowerBuild blue / yellow / white)
- View Website button in the Hub header
- Direct links in E-Commerce Control to retail and wholesale websites
- Public retail catalogue reads live catalogue_products in the SAME D1 database
- Active NEW products without an e-commerce settings row are auto-discovered for retail
- Changes to codes, names, categories and product images show on website on next fetch
- When customer refocuses website tab, product list refreshes
- Explicitly disabled B2C items stay hidden; inactive/deleted products stay hidden
- Wholesale remains opt-in only and trade prices require approved account
- Orders / pricing / B2B controls retained

INSTALL
1. Back up your current code and database.
2. Copy the app/ folder from this ZIP over your GitHub app/ folder, preserving paths.
3. Commit / push / redeploy using your existing deployment workflow.
4. Open /shop for the customer website; open /wholesale-shop for approved trade customers.
5. Use the new View Website button inside the Hub.
6. If Cloudflare Access protects the entire domain, allow PUBLIC GET access to /shop,
   /api/ecommerce/public, and product/special image GET routes; keep Hub and admin APIs protected.
   Cloudflare Access policies are managed OUTSIDE the source and are not changed by this patch.
7. For a branded domain, configure e.g. www.powerbuild.co.za in Cloudflare separately.
   No live domain changes are included in this patch.

IMPORTANT CONTROLS
- New, active products without an ecommerce settings row are listed on retail with
  'Price on request' until a retail price is entered in E-Commerce Control.
- If an explicit ecommerce settings row has b2c_enabled=0, product stays unpublished.
- Only b2b_enabled=1 appears to wholesale customers, and B2B pricing stays protected.
- Product image assets must already exist in the Hub or object storage; this patch
  does NOT invent missing photographs (e.g. Eurofit images still need correct assets).
- E-Commerce Control has pricing and stock flags, but NO live physical stock integration.
- Card payments are NOT added; current enquiry/order flow remains.
- The customer website currently lives on the Hub deployment under /shop; a separate
  website/domain or independent deployment is not provisioned.

TESTING
Source-file checks and SQLite simulation of new-product live listing / opt-out / B2B
isolation are included in tests/powerbuild-live-storefront.test.mjs.
A full production build and live Cloudflare deployment have not been run here.
