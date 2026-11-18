PHASE 42 — Stock Settings and Numbering

Apply the files at the same repository paths, on top of Phase 41. The updated frontend includes the Phase 41 work.

Stock > Settings: Branch-specific planning defaults (suggested reorder min/max units, stocktake cycle days and notes). These settings are stored separately and DO NOT change actual stock levels, product settings, prices or postings.
Stock > Numbering: Configure and reserve branch-specific stock preparation reference numbers, with optimistic version checks, audit and duplicate prevention. Reservations DO NOT replace current GRV, transfer, stock adjustment, stocktake or purchase-order document numbers.

GitHub workflow runs additive D1 Phase 42 migration before deploying the private Core. Requires the same existing Cloudflare deployment secrets and DB bindings.

Before deployment, run npm test from maliks-operations and verify the GitHub Actions results. Test manager/stock-controller permissions and branch separation after deployment.
