MALIKS GROUP HUB / POWERBUILD — STOCK DOCUMENT TYPES FIX V6
==========================================================

PROBLEM
The GRV detail/print template was reused for every stock document, so
stock counts, adjustments, returns and transfers incorrectly displayed
Receiving Manager and Driver signatures and an irrelevant Rejected column.

WHAT CHANGED
- GRV: Receiving manager and Driver / supplier representative signatures;
  supplier/driver, times and labelled fields; Received, Expected, Rejected.
- STOCK COUNT: Counted by and Verified by / Stock Controller signatures;
  Counted quantity, System quantity, Variance.
- STOCK ADJUSTMENT: Requested by / Stock Controller and Authorised by /
  Stock Manager signatures; Physical quantity, System quantity, Variance.
- SUPPLIER RETURN: Return prepared by and Authorised by / Stock Manager;
  supplier and return reference; Return and Reference quantity (no rejected).
- TRANSFER: Issued by / Sending branch and Received by / Destination branch;
  branch transfer details; Transfer and Reference quantity (no rejected).
- Both the live detail dialog and A4 PowerBuild printout use the same labels.
- The earlier V5 A4 Rejected Qty column safety margins are preserved.
- All printouts still show approval history; approval status still comes from D1.

INSTALL (direct paste; no terminal integration script or migration)
1. Save a backup of your current app/stock-operations/stock-operations.tsx
   and app/stock-operations/stock-operations.module.css.
2. Extract ZIP to a separate folder.
3. Copy its 'app', 'public', and 'tests' folders directly into the root
   of your existing maliksgroupza project. Merge and replace matching files.
   Do NOT paste a wrapping folder or remove existing folders.
4. Run: npm run check
5. If that passes, commit and push the changes to GitHub.
6. Open Store Operations > Stock Control & GRVs. Preview / print a GRV,
   stock count, stock adjustment, supplier return and stock transfer.
7. For print: A4, Portrait, scale 100%, Headers/footers OFF,
   Background graphics ON.

FILES CHANGED
app/stock-operations/stock-operations.tsx
app/stock-operations/stock-operations.module.css
public/stock-operations/powerbuild-logo.png  (included for completeness)
Tests added in tests/stock-document-type-fields.test.mjs.
Included earlier print tests unchanged.

VERIFICATION
- 15 targeted document / print tests passing in prepared patch.
- TSX syntax diagnostics: 0.
- Complete project GitHub CI / Cloudflare deployment not run here.

SCOPE / LIMITS
- UI and print labels only; no migration / D1 schema / backend changes.
- Existing records are preserved. No stock or financial posting enabled.
- Quantity 'Variance' on counts and adjustments is PHYSICAL MINUS SYSTEM.
- A4 layouts fit typical documents; very long product lists can paginate
  rather than hiding product lines.
- This patch contains the latest V4 print TSX plus V5 print CSS. If you have
  made additional custom edits to those two files since V5, compare/merge
  rather than blindly overwriting your newer changes.
