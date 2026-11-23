# Maliks Group Hub Phase 61 — Stock Take Control Centre

## What is included
- Separate manager-created **Full / Cycle stock-take sessions** with numbered references and a branch/SKU snapshot.
- Select up to 150 products per session; create additional sessions for other aisles, categories or zones.
- Assign Hub employees to the count; counters see **blind** quantities, never the ledger snapshot.
- Count by stock location with explicit zero, phone barcode detector when supported, product code search fallback.
- Supervisor/manager review dashboard, separate recount by another assigned person, append-only audit history.
- Manager sign-off (independent of session creator) and CSV variance exports.
- Review-only results: **NO automatic changes to POS, Hub inventory, supplier accounts or general ledger.**

## Install in GitHub Codespaces
Extract this ZIP into your existing repository root (keep folders). Then execute:

```bash
node scripts/install-phase61.mjs
npm run check
```

If checks succeed:

```bash
git add app/api/stock-operations/take app/stock-operations/stock-take-centre.tsx app/stock-operations/stock-take-centre.module.css app/stock-operations/stock-operations.tsx drizzle/0071_stock_take_control_centre.sql scripts/install-phase61.mjs tests/stock-take-phase61.test.mjs
git commit -m "Add Phase 61 controlled branch stock takes"
git push origin main
```

The existing **Deploy Maliks Group Hub** GitHub Actions workflow runs `npm run check` and then applies D1 database migrations **before** Cloudflare deployment. Confirm all steps pass.

## Controls and operational notes
- Authorised stock managers can create, assign, start, review and approve stock takes. Only invited branch employees are eligible.
- Assigned counter users must have permitted Hub access for the branch. They cannot view system quantities.
- All SKUs in the session must be explicitly counted (including zero); uncounted is not zero.
- A separate assigned person must recount each discrepancy against a known Hub-ledger opening snapshot.
- Products without an initialised Hub-ledger balance are visible but cannot be approved until reconciled.
- This does **not** yet connect to the POS stock master. Do not make POS adjustments from these records until stock-master integration has been specified and verified.
- Counts should take place in a controlled stock-movement window. The snapshot may otherwise become stale because POS sales are not integrated with the Hub ledger.
- Requires browser camera permission; BarcodeDetector support is device/browser dependent. Use manual product lookup as fallback.
- A4 printable count sheets, offline replay, photos, scheduled cycle counts, cost valuation and directly posted POS reconciliations are **not** part of this first controlled implementation.
