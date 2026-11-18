Maliks POS Professional — Phase 46: Stock Labelling lightweight inventory lookup

This patch is a targeted mitigation for intermittent Core-service errors when Stock → Utilities → Labelling searches the stock master. It is not a change to accounting, prices or stock posting.

Replace in GitHub, preserving the paths:
- maliks-operations/src/inventory-domain.mjs
- maliks-operations/src/stock-labelling-ui.mjs
Add the test:
- maliks-operations/tests/phase46-stock-label-lookup.test.mjs

The new labels=1 read reuses the management/branch access checks and returns up to 60 active branch stock items with published Hub QR tokens and branch selling prices. It avoids fetching stock movement history and all destinations. GET lookups automatically retry once if Cloudflare returns HTTP 503. No POST requests are retried.

Run: cd maliks-operations && npm test
Then run the existing 'Deploy Maliks Department Applications' GitHub Actions workflow. It deploys the private Core before POS. No D1 migration is required.

This patch cannot repair a truly unavailable Core Worker or DB. If errors continue, inspect Cloudflare Workers & Pages → maliks-core-api → Observability/Logs at the time of a label search; the exact runtime exception is needed. Do not reset passwords or change Worker names.
