MALIKS HUB — POWERBUILD GRV PRINT FIX V5
==========================================

FIX: Rejected qty column and its values were clipped on the right in A4 print preview.
This patch changes only: app/stock-operations/stock-operations.module.css

INSTALL
1. Extract this ZIP.
2. Copy the app folder into your existing maliksgroupza project and merge/replace.
3. Commit/push the CSS file; allow your Hub deployment to complete.
4. Reopen the GRV, choose Print register copy · PowerBuild A4.
5. Print settings: A4, portrait, 100% scale, Headers/footers OFF, Background graphics ON.

WHAT CHANGED
- Five explicit print-column widths: Code 18%, Description 40%, Received 14%, Expected 14%, Rejected 14%.
- Numeric columns centered and Rejected values given right padding.
- Print table held 2mm inside the available A4 content width.
- Product descriptions can still wrap on longer names.

No changes to product data, GRV approval, stock balances, APIs, migrations, or other Hub screens.
Longer documents may still print on multiple pages; data is never silently omitted.
