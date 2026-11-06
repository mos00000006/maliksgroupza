MALIKS HUB -- GITHUB TEST 144 FIX

The GitHub build and lint stages succeeded, and 197/198 tests passed.
The sole failure is an outdated test in tests/tills-access.test.mjs that
expects a disabled 'Complete sale — not enabled' button in Sales. That
button was intentionally removed when Sales became quotation-only.

THIS ZIP REPLACES ONE TEST FILE ONLY. No live POS code, catalogue, worker,
roles, database, or payment logic is changed.

INSTALL WITHOUT A TERMINAL:
1. Extract this ZIP.
2. Copy the included 'tests' folder into the root of your current
   maliksgroupza project (the folder with package.json).
3. Merge folders and replace tests/tills-access.test.mjs.
4. Commit or upload the changed test file to GitHub (replacing the existing
   repository copy), and let GitHub Actions rerun npm run check.

The new test checks the actual safe business rules:
- Sales can issue UNPAID quotations and send them to Cash Office.
- Sales cannot process payments or release stock.
- Cash Office payment capture is restricted and final paid posting is disabled.
- Dispatch does not receive unpaid quotations as pickable orders.

NOTE: This test-only patch does not enable live payments or dispatch.
