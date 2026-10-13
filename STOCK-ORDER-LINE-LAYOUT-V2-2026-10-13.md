# Stock Order Line Layout V2 — 13 October 2026

The branch Stock Order editor no longer uses the old table layout for order-entry fields.

## Fix
- Replaced the overlapping table cells with a dedicated CSS grid editor.
- Code/Product, Category, Qty Requested, Unit, Branch Notes and Remove are all separate cells.
- No horizontal table scroll is required for order entry.
- At narrower desktop widths the row automatically becomes a labelled card layout before fields can overlap.
- Mobile and very small screens stack cleanly.
- Product code and description remain together under Code / Product.

## Files changed
- `app/stock-orders-workspace.tsx`
- `app/globals.css`

No database migration is required.
