# Buyer Branch Order Reflection Fix — 13 October 2026

- Buyer Workspace now loads Branch Stock Orders live from `/api/stock-orders`.
- Added **Branch Queue** KPI.
- Added **Incoming Branch Stock Orders** panel to Buyer Overview.
- Added **Branch Orders** tab with all branch requests, including draft/sent/review/confirmed status.
- Submitted branch orders are clearly highlighted for buyer review.
- **Review / Confirm** opens the detailed Stock Orders workspace.
- Buyer Workspace refreshes branch orders every 15 seconds, so new submitted orders appear without a manual browser refresh.
- No database migration required. Existing migration 0022 is used.
