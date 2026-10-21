# PowerBuild and BusterBuild price tags

Copy the files in this patch into the existing Hub repository, preserving folders, then deploy through your normal GitHub/Cloudflare workflow.

Apply the new D1 migration before serving the new code:

    npx wrangler d1 migrations apply maliks-group-hub-db --remote --config .deploy/wrangler.jsonc

The patch requires the previous PowerBuild price tag and transparent-picture patches (migrations 0033 and 0034). Migration 0035 adds a separate BusterBuild tag table; existing PowerBuild rows and QR tokens remain in place. Back up production D1 through your normal process before migrations.

Open Price tag generator and choose PowerBuild or BusterBuild. Find a product by code, enter its VAT-inclusive price, confirm tile pack details, then Generate. Both brands support transparent product pictures, Smart Measure, print/PDF and 2700 × 1800 JPG downloads. Brand prices, publishing status, cutout overrides and QR tokens are independent. The BusterBuild rail uses the left panel of the supplied ABSTRACT template; product/name/QR/price fields are generated dynamically.

Customer phone camera: scan and tap the phone's link notification to open the public Hub product page, with the selected brand and saved price. Existing Cloudflare customer-path bypass settings also cover the BusterBuild URLs and assets; no whole-Hub bypass is needed.

BusterBuild sales app: use Scan Product inside the existing app. New BusterBuild QR links include ?code=PRODUCT_CODE, which its existing extractCode scanner supports. The app opens its matching catalogue product. That product must exist in the sales app with the same code. This patch does not change the deployed sales app, synchronize prices into Firebase, or import Hub-only products into it. The sales app continues to use its own catalogue price; the Hub customer page shows the Hub tag price. Keep the two prices aligned when maintaining them.

Verification completed: production build; 10 focused tests covering permissions, isolated brand prices, stable QR tokens, public field whitelisting, unpublishing, PNG uploads, QR code query encoding, price validation, and Smart Measure. Focused ESLint: no errors (existing image optimization recommendations remain). Full TypeScript checking is blocked by missing project-wide Cloudflare binding types and existing unrelated errors in the recovered source.

Browser visual verification could not run because a local Chromium browser was unavailable and its download failed. Please review one BusterBuild JPG and scan a sample before printing a batch.
