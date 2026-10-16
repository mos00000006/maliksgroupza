# PowerBuild B2C + B2B eCommerce — 16 October 2026

## What is included

### Public B2C retail store
- URL path: `/shop`
- Uses the existing PowerBuild catalogue as the single product master.
- Retail price is configured inclusive of VAT.
- Search, category filtering, product images, stock-status labels and featured products.
- Cart, collection/delivery choice, preferred branch, customer details and order notes.
- EFT / pay-on-collection / card-at-branch options are recorded on the order.
- Products without an online retail price can still be ordered as **Price Pending**.
- Current Store Specials artwork is surfaced automatically when active.
- Customers can track previous online orders with order number + email.

### Public B2B wholesale store
- URL path: `/wholesale-shop`
- Approved trade customers verify with business email + six-digit access code.
- Trade pricing remains locked until the approved account is verified.
- Secure HttpOnly trade session cookie lasts 30 days on production HTTPS.
- Wholesale price is configured ex VAT; checkout calculates VAT and total incl VAT.
- MOQ / pack quantity controls per product.
- Customer PO/reference, account/EFT/COD, delivery details and order notes.
- New businesses can submit a trade-account application from the B2B portal.

### Hub — E-Commerce Control
Visible only to Owner/Admin, Developer/Technical Admin and users assigned **Full company** access.

Includes:
- B2C/B2B product on/off controls.
- Retail incl VAT and wholesale ex VAT prices.
- B2B minimum order quantities.
- Units, stock status and featured-product controls.
- Incoming B2C/B2B order dashboard.
- Order lines, totals, fulfilment details and status workflow.
- B2B customer applications, approval/decline and portal access-code issue.
- WhatsApp / email shortcuts for sending an approved B2B access code.
- Store names, support contact details, VAT rate and channel order on/off controls.
- Direct buttons to open both public online stores.

## Database migration
New migration:

`drizzle/0023_ecommerce_channels.sql`

Apply with the normal deployment migration step or:

`npx wrangler d1 migrations apply maliks-group-hub-db --remote --config .deploy/wrangler.jsonc`

## Public Cloudflare Access requirement
The storefront routes themselves do not require Hub authentication in the application code. If Cloudflare Access currently protects the entire hostname before requests reach the Worker, create public/bypass coverage for the storefront paths below (or host them on a separate public e-commerce hostname):

- `/shop*`
- `/wholesale-shop*`
- `/api/ecommerce/public*`
- `/api/ecommerce/product-image/*`
- `/api/ecommerce/special-image/*`

Keep the Company Hub and `/api/ecommerce/control*` behind authenticated access.

## Payment gateway
This release deliberately does not collect card details. It records EFT/account/pay-on-collection/card-at-branch choices. PayFast, Yoco or another payment gateway should be connected only once merchant credentials and the desired settlement flow are available.
