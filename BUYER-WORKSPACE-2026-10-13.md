# Buyer Workspace — 13 October 2026

## Added
- New **Buyer Workspace** navigation module.
- New **Buyer** access role.
- Buyer role is restricted to:
  - Buyer Workspace
  - Store Specials
  - Our Catalogue
- Server-side Buyer isolation: general Hub APIs reject Buyer-role access unless the route is explicitly one of the permitted Buyer areas.
- Buyer users do not receive the general task Inbox / Quick Actions / AI Sidekick interface.

## Buyer Workspace functions
- Procurement dashboard with open orders, approvals, delivery follow-up, overdue orders and order value.
- Purchase Order register.
- Multi-line PO builder with automatic subtotal, VAT and total calculations.
- Product-code, quantity, unit, pack, last cost, new cost and price-variance tracking.
- Search **Our Catalogue** and add catalogue products directly into a PO.
- Draft → Pending Approval → Approved / Returned → Ordered → Part Received → Received workflow.
- Management approval controls for Owner / Admin, Developer / Technical Admin and full-company EXCO.
- Preferred / secondary supplier master with contacts, terms, lead time, minimum order and categories.
- Supplier quote-comparison register.
- Receiving / delivery tracker with ETA, GRV, invoice and notes.
- Automatic PO numbers in format `PB-PO-YYYY-00001`.

## Excel
The **Download Excel** button creates a real `.xlsx` workbook in the browser without an external spreadsheet package. It contains:
1. Purchase Orders
2. Order Lines
3. Suppliers
4. Quote Comparison

Each PO can also be exported individually to Excel.

## Database
New migration:
- `drizzle/0021_buyer_workspace.sql`

It creates:
- `buyer_suppliers`
- `buyer_orders`
- `buyer_order_lines`
- `buyer_quote_entries`
- `Buyer Workspace` workspace register entry

The existing GitHub deployment workflow already runs remote D1 migrations before deployment, so `0021` will be applied automatically during a normal successful deployment.
