MALIKS HUB — STOCK DOCUMENT PRINT COLUMN FIX V8
=================================================

ISSUE
- Stock Transfer and Supplier Return printed 'REFERENCE QUANTITY' heading clipped on the right.
- The user example says '0 line items', which is a separate document-data issue.

FIX
- Four-column documents (transfers/returns) use print widths 17 / 43 / 18 / 22.
- Reference Quantity may wrap at a word boundary; no forced nowrap.
- Item-entry fields now say Transfer qty / Reference qty on transfers and Return qty / Reference qty on returns.
- If a document actually has zero saved product lines, its printout explicitly says so rather than displaying an apparently complete empty stock transfer.
- Existing five-column GRV rejected-quantity layout, count/adjustment variance layout, PowerBuild logo, signatures and approval history are preserved.

INSTALL
1. Extract the ZIP.
2. Copy the 'app' and 'tests' folders into maliksgroupza, merging and replacing corresponding files.
3. Run npm run check; commit and push to GitHub if the check succeeds.
4. Open a Transfer or Supplier Return document, then Print register copy - PowerBuild A4.
5. Print with A4 Portrait, scaling 100%, headers/footers OFF, background graphics ON.

FILES CHANGED
app/stock-operations/stock-operations.tsx
app/stock-operations/stock-operations.module.css
tests/stock-four-column-reference-print.test.mjs (new)
tests/stock-document-type-fields.test.mjs (updated four-column width expectation; keeps V7 portable TypeScript import)

No migration, stock posting, role, authorisation, approval-state or database changes.
NOTE: An existing record with '0 line items' cannot be populated through a print-only correction.
You must inspect the saved record and add products through the stock document workflow (or create a correct new document).
