MALIKS GROUP HUB — SALES / TILLS STAFF ASSIGNMENT
================================================
Scope: Hub access integration + read-only demonstration Sales / Tills window.
This patch does NOT activate RetailOS Phase 1–6, PostgreSQL, Dexie, payments or live sales.

WHAT THIS RELEASE ADDS
----------------------
* A "Sales / Tills" role in Hub > Access / Team Members.
* One active retail store is required for that role.
* Assigned cashiers sign into the existing Hub and are redirected directly to /tills.
* Cloudflare Worker denies unrelated private Hub pages and APIs to cashier accounts.
* Server checks both the cashier role and the selected store before returning products.
* Tills preview uses the existing published PowerBuild/BusterBuild price-tag data,
  including branch-specific prices where present.
* The preview supports product lookup by code/name, basket quantities, 15% VAT breakdown
  and simulated cash change. No POST sale, payment, stock or accounting change is possible.
* Owner/Admin, Technical Admin, Store Manager, Regional Manager can preview the tills
  according to their store access. The Home sidebar has a Sales / Tills entry.

IMPORTANT SECURITY/OPERATING LIMITS
-----------------------------------
* This is NOT an operational POS. There is intentionally no live Complete Sale button.
* Offline sales, card terminal, receipt printing, stock journals, cashier sessions,
  refunds, and general-ledger postings require a verified connection to RetailOS.
* Public product QR pages remain accessible because they are intentionally public.
* The current Cloudflare Access identity and Hub membership remain the authentication source.
* Price-tag prices are display previews and must be reconciled with approved POS price books
  before live tills are enabled.

INSTALL FROM VS CODE / GITHUB
-----------------------------
1. Open your existing maliks.co.za Hub repository in VS Code, on a new Git branch.
2. Back up/commit any current work before applying this patch.
3. Extract this ZIP to a TEMPORARY folder outside your repository.
4. In the VS Code terminal, from the Hub repository root, apply the patch:
     git apply --check "C:\\path\\to\\extracted\\hub-tills-assignment.patch"
     git apply "C:\\path\\to\\extracted\\hub-tills-assignment.patch"
   If `--check` fails, stop. Do not overwrite current Hub files. The repo has changed
   since the supplied snapshot and needs a careful merge.
5. Copy the NEW files/directories from `new-files/` into the matching project paths:
     app/lib/tills-route-policy.ts
     app/api/tills/shared.ts
     app/api/tills/session/route.ts
     app/api/tills/catalogue/route.ts
     app/tills/page.tsx
     app/tills/till-checkout.tsx
     app/tills/tills.module.css
     tests/tills-access.test.mjs
6. Run tests/build using your existing Hub process:
     npm install
     node --test tests/tills-access.test.mjs
     npm run build
   All checks MUST pass before you deploy.
7. Inspect `git diff`, commit to a feature branch and deploy to a TEST environment first.
8. Sign into the Hub as the owner/admin: Access / Team Members > Add/Edit Member.
   Choose Role = Sales / Tills, Access = Assigned workspace, and select the retail branch.
9. Test with a dedicated non-admin cashier account:
   - Hub home redirects to /tills;
   - retail product lookup is limited to that branch;
   - /api/financials and /api/team edits return 403;
   - no live sale is possible.
10. Only merge/deploy to the company Hub after these checks pass on staging.

NO DATABASE MIGRATIONS REQUIRED for this access/preview patch; it reuses the existing
team_members, workspaces, catalogue_products, price tag, and branch price tables.

A failed git apply is not an empty update: it means the source has changed. Stop and
request a merge against your latest GitHub branch. Do not replace files wholesale.
