MALIKS GROUP HUB — STOCK OPERATIONS V1 (CONTROL REGISTER)
============================================================

This is a new module inside the existing Maliks Group Hub. The package does not
replace your live Sales / Tills source, catalogue, app/page.tsx, or worker/index.ts.

1. BACK UP your current maliksgroupza repository and existing Cloudflare D1 database.
2. Extract this ZIP into a separate folder.
3. Copy the contents of its app/, drizzle/, tests/ and docs/ folders into the
   corresponding folders in the root of your existing maliksgroupza repository.
   Choose MERGE FOLDERS; these are NEW paths and should not overwrite your
   existing Sales / Tills files. Do not paste a wrapping folder or new-files/.
4. Inspect drizzle/0056_stock_operations_control_register.sql and confirm the
   filename doesn't clash with a migration already added to your repository.
5. On a disposable LOCAL D1 database apply migrations and run:
      npm run db:migrate:local
      npm run check
      npm run build
   Correct any errors BEFORE deploying.
6. After the local tests and a D1 backup, and only with permission to modify
   the hosted database, use your existing migration/deployment workflow:
      npm run db:migrate:production
   Deployment is a separate operation; copying files locally does not update
   GitHub or the live Cloudflare Worker.
7. Open /stock-operations on your Hub domain AFTER deployment.
8. Owner / Admin opens STAFF PERMISSIONS on that page; select an already invited
   employee's exact email, a branch and one of:
      Receiving / GRV; Stock Controller; DC / Transfers; Stock Manager
9. For manager approval use a different staff account, or a Store/Regional
   Manager with access to the originating branch. The creator may not approve
   their own document. A TRANSFER receipt needs another authorised destination
   employee, different from creator and approving manager.

FUNCTIONS IN THIS V1 RELEASE
----------------------------
- Separate professional navy/gold Stock Operations workstation, same Hub login
- GRVs: supplier, DN/ref, received/rejected qty, driver, times, labelled Y/N,
  labelled by, receiving-manager and driver signatures on printed control copy
- Physical counts: expected stock / counted stock and variance register
- Adjustments: count mismatch and reason documented for review
- Supplier returns: supplier and reference, quantities, manager approval
- Transfers: source/destination, approval, independent receipt acknowledgment
- D1 saved numbered documents, status and append-only audit, print control copies
- Product selection from the existing active Hub catalogue (40/page)
- Branch-restricted staff duties; full-access management review

IMPORTANT — NOT YET LIVE STOCK POSTING
-------------------------------------
These are CONTROL DOCUMENTS, not GRVs/stock movements posted to your existing
inventory and General Ledger. A posted/approved label here means that the
DOCUMENT was approved for follow-up; it does NOT update catalogue stock,
create supplier creditors, reserve inventory, or authorize dispatch.
The current Hub catalogue contains products/prices, not a verified opening stock
ledger across all branches. Connecting ledger balances, weighted-average costs,
GRV/stock adjustment accounting, PO matching, and live stock deduction needs a
separate reconciled backend phase and integrated PostgreSQL/D1 strategy.

No one should use this patch to replace existing TOUCH365 stock records.
Do not submit real posting claims, supplier invoices or release inventory based
only on an approved Stock Operations document.

HUB NAVIGATION
--------------
The new URL is /stock-operations. There is no overwrite of the main Hub app/page.tsx
or its menu, to avoid destroying your recent Sales / Tills changes. You can add
this URL to a bookmark, or add a navigation link in the Hub once you confirm the
current, latest source. Staff invitations still use your EXISTING Team Members.
Stock Operations duties are assigned inside the new STOCK OPERATIONS module.
Other existing Hub-wide access rules are unchanged; this patch does NOT create
a universal department-only login guard for every old Hub module.

SAFETY
------
- D1 SQL protects immutable document lines, event audit, illegal status changes.
- Never edit source GRVs after submission; create a new control document.
- Approval or receipt never changes the live stock ledger.
- No author self-approval; no approval from outside the authorised branch.
- No catalogue product name/code can be spoofed in a document.
- Duplicate client transaction IDs do not create duplicate documents.
- Run tests with: node --test tests/stock-operations-*.test.mjs
- The remote Cloudflare migration and full Hub build were not executed here.
