# Procurement + Branch Stock Orders — 13 October 2026

This update expands the PowerBuild / Maliks Group Hub buying process from supplier purchase orders into a complete branch-to-warehouse replenishment workflow.

## Buyer Workspace

- Supplier Master now stores supplier email, phone and dedicated WhatsApp number.
- Approved purchase orders can be sent to the selected supplier using **WhatsApp** or **Email** from the order register.
- Sending a supplier order automatically downloads that PO as an `.xlsx` file and opens a prepared supplier message containing the PO number, delivery details and order summary.
- The Hub records each supplier send in **Sent History**, including supplier, channel, recipient, user and timestamp.
- Full Buyer Workspace Excel export now includes a **Sent Order History** sheet.
- Previous purchase orders remain stored in the Buyer Workspace and can be reopened or exported again.

> Browser note: normal `wa.me` and `mailto:` links cannot silently attach a local file. The Hub downloads the Excel PO for attachment and opens the correct supplier WhatsApp/email with the message prepared. Fully automatic attachment sending would require an approved WhatsApp Business API and an email delivery service.

## Stock Orders Workspace

A new **Stock Orders** module handles branch replenishment from the Head Office / warehouse.

Branch users can:
- create stock orders for their assigned branch;
- browse **Our Catalogue** inside the order and add products directly;
- enter requested quantities, units, required dates, priority and branch notes;
- save drafts or send the order to the Head Office warehouse Buyer;
- see Buyer-confirmed quantities and warehouse notes as soon as the Buyer confirms;
- follow Picking, Ready for Dispatch, Part Fulfilled and Dispatched statuses;
- confirm receipt after a complete dispatch;
- reopen previous submitted orders in **Order History**;
- download an individual order or their full order history to Excel.

Buyer and authorised full-company users can:
- see branch orders from across the company;
- review and confirm requested quantities;
- return an order to the branch;
- add warehouse notes and expected dispatch/delivery date;
- record partial fulfilment and quantities dispatched;
- progress orders through Picking, Ready for Dispatch, Dispatched and Completed;
- export the full branch stock-order register and line detail to Excel.

## Access role

New role: **Branch Stock Orders**.

A user assigned this role is linked to one branch and can only access:
- Stock Orders
- Store Specials
- Our Catalogue

Buyer access is restricted to:
- Buyer Workspace
- Stock Orders
- Store Specials
- Our Catalogue

Owner/Admin and full-company EXCO retain full visibility. Regional, Store and Department Managers can access Stock Orders according to their permitted workspaces.

## Database migration

New migration:

`drizzle/0022_procurement_supplier_branch_orders.sql`

Apply remotely with:

```bash
npx wrangler d1 migrations apply maliks-group-hub-db --remote --config .deploy/wrangler.jsonc
```

The migration adds supplier WhatsApp and purchase-order send history fields, plus the branch stock-order header and line tables.
