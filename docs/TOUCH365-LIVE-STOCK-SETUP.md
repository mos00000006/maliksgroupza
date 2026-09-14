# Touch365 live stock connection for PowerBuild Hub

## What the Hub now supports
- Catalogue product code is the stock matching key.
- Restricted/store users see stock for their authorised store only.
- Full-company users can choose a store from the catalogue.
- Catalogue stock refreshes every 15 seconds while open, and immediately on refocus.
- The Hub stores the latest Touch365 on-hand quantity in D1 so catalogue browsing remains fast.

## External Touch365 connection still required
Touch365 publicly advertises real-time inventory and multi-branch stock, but no public developer/API specification was found. To make the numbers truly live, Touch365 (or the local Touch365 database/service) must feed changes into the Hub.

Ask Touch365 support for ONE of the following:
1. A read-only stock-on-hand API, preferably with branch/store and product-code filters; or
2. A webhook/event feed for sales, receipts and stock adjustments; or
3. Read-only database access / a supported SQL view that exposes branch, product code and current on-hand.

Required fields:
- Branch/store name or branch ID
- Product code/SKU
- Current on-hand quantity
- Last changed timestamp (preferred)

## Hub sync endpoint
POST https://www.maliks.co.za/api/integrations/touch365/stock

Headers:
Authorization: Bearer <TOUCH365_SYNC_SECRET>
Content-Type: application/json

Delta example (one or more changed products):
{
  "store": "Power Build Krugersdorp",
  "mode": "delta",
  "occurred_at": "2026-09-14T11:45:00+02:00",
  "items": [
    { "code": "AE002", "on_hand": 38 },
    { "code": "PLUSG40", "on_hand": 12 }
  ]
}

Full-store snapshot example:
{
  "store": "Power Build Krugersdorp",
  "mode": "snapshot",
  "items": [
    { "code": "AE002", "on_hand": 38 },
    { "code": "PLUSG40", "on_hand": 12 }
  ]
}

Use `delta` after a sale/GRV/adjustment if Touch365 can send events. Use `snapshot` for a complete branch stock refresh.

## GitHub secret
Add a strong random repository secret named:
TOUCH365_SYNC_SECRET

The updated deployment workflow copies it securely to the Cloudflare Worker. Never place the secret in browser code or commit it to GitHub.

## Product-code requirement
The code entered in Our Catalogue must exactly match the Touch365 product/SKU code (case is ignored). If the codes differ, on-hand will display as unavailable until a mapping layer is added.
