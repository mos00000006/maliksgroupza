MALIKS GROUP HUB — QUOTATION NUMBER -> CASH OFFICE HANDOVER
Direct-paste patch for the installed Signature POS + Full Catalogue Quotation Picker.
06 November 2026

PURPOSE
Sales employee opens Quotation, selects products, enters customer details, then clicks:
  Send quotation to Cash Office
The Hub D1 database stores a frozen quotation and assigns a unique number like Q-00000001.
The reference immediately appears in the assigned branch's Cash Office quotation queue.
Cash Office can search by quotation number or customer, inspect line items and mark REVIEWED.
No payment, receipt, invoice, reserved stock, ledger entry or dispatch note is created.

INSTALL — NO SCRIPT OR GIT CLI REQUIRED FOR FILE COPY
1. Back up the current maliksgroupza folder (without sharing .env or customer data).
2. Extract this ZIP separately.
3. Copy the contents (app, drizzle, tests) directly into the existing 'maliksgroupza' project root
   — the directory containing package.json. Select Merge and Replace for matching files.
4. Do NOT create a new-files folder; do NOT replace the entire project with an older ZIP.
5. Commit/upload the changed files to GitHub so the hosted Hub receives the update.
6. Allow GitHub Actions (npm run check) and deployment to complete before using this feature.

REPLACED FILES
  app/tills/till-checkout.tsx       — quotation handover, customer entry, Cash Office queue
  app/tills/tills.module.css        — UI styling (retains existing POS theme)
  app/tills/page.tsx                — passes access scope for executive permission rules
  app/lib/tills-route-policy.ts     — permits POST /api/tills/quotes for till-only staff,
                                     leaves unrelated writes blocked

NEW FILES
  app/api/tills/quotes/route.ts            — authenticated, branch-scoped D1 API
  app/api/tills/quotes/quote-domain.mjs    — quotation IDs, validation, cent-accurate VAT
  app/api/tills/quotes/quote-domain.d.mts  — TypeScript declarations
  drizzle/0055_tills_quotation_cashoffice.sql  — reference database schema
  tests/tills-quote-cashoffice.test.mjs    — automated safeguards

DATABASE
This patch is written for the current Cloudflare D1 Hub. The API uses CREATE TABLE IF NOT EXISTS
on first authenticated access so the basic queue works on a Hub database with existing
catalogue and team tables. The supplied 0055 migration additionally creates an index;
operators may apply it through the existing managed D1 migration process.
This does not install PostgreSQL RetailOS or write to its accounting database.

WHO CAN DO WHAT
* Sales / Tills: create/send quotations from their assigned active retail store.
  A cashier does NOT get the Cash Office quotation queue or unrelated Hub access.
* Owner / Admin, Developer / Technical Admin, Store Manager, Regional Manager,
  Executive / EXCO with Full company access: can view/review quotations for their
  authorised active branches in the Cash Office section.
* Dedicated Cash Office employee accounts are not yet part of the Hub's role
  assignment dropdown. Those permissions require a separate, explicit role update.
  Do not grant an overpowered managerial role to a staff member merely for access.

FLOW
Sales -> Create quotation -> Select catalogue items -> Enter customer details ->
Send quotation -> Q-000000xx -> Cash Office queue for this branch -> Review.
If the network fails, keep the quote window open and retry; the same request ID prevents duplicates.
If the published branch price changed since selection, refresh the quote's item prices before resubmitting.
The queue is persistent across browser sessions and computers using the same Cloudflare D1 DB.

SAFETY
* The server re-checks every item's published price; no manual price overrides.
* Price/name snapshots in the quotation are stored for audit and future review.
* Submission is idempotent by unique request ID; no duplicate issue on retry.
* Both branch permission and cash-office review rights are enforced server-side.
* Mark Reviewed does NOT charge a customer, convert to an invoice, move stock or approve credit.
* No cash, card, EFT, lay-by deposits or tax invoices are enabled by this patch.
* Test on a non-production branch/database before staff issue real customer quotations.

VERIFICATION
22 targeted POS + quote workflow checks passed in a combined test workspace.
TypeScript syntax and isolated strict API typecheck passed. CSS parsed successfully.
SQLite schema/duplicate/review checks passed. Real Cloudflare D1 integration and full
GitHub/Vite build must still pass in your repository after applying this patch.
