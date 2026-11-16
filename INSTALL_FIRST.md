# MALIKS QUOTE — MOBILE QR SCAN, SAVE, PRINT & SHARE

## Summary
Adds a separate, secure Cloudflare Worker named **maliks-quote**, target hostname:
https://maliks-quote.moyanamoses006.workers.dev

It uses the existing PowerBuild logo asset and the existing navy (#0A2A3F), gold (#D4A017), white and light-grey palette. It uses bundled official Lucide SVG icons. No artificial logos are introduced.

### Workflow
1. Salesperson signs in on mobile with the existing Maliks Sales staff account and chooses an assigned branch.
2. Scan an existing price tag's QR in Maliks Quote using the mobile camera. It reads the QR's `/p/<UUID>` product token and resolves the latest authorised price server-side. You can also paste the QR URL or search by stock code/name.
3. Enter quantities, customer name, phone, email and optional notes. Prices include 15% VAT.
4. Press **Save quotation**. This invokes the existing Sales Core `POST /v1/quotes` workflow and saves to `till_quotation_submissions` with the standard `Q-` number. There is no separate mobile-only quotation table.
5. On any authorised Sales PC at the selected branch, open **My Quotations**. The **Branch quotation print queue · Mobile + PC** shows recent staff quotations; print via **Print 80mm quote** or **Print A4 quotation**.
6. If the customer is not paying now, use **WhatsApp** or **Email** on the saved quote. These open a **pre-filled text draft** in the installed app; the user must personally send the message. A4 Print / Save PDF uses the device's print dialog, not an automatic attachment.

### Existing QR tags — NO REPRINT NEEDED
The current QR code on each tag opens the public Hub product page `/p/<tag-token>`, with an optional `branch=...` value. `app/p/[token]/product-scan-page.tsx` adds **Staff · Add to Maliks Quote**, which takes the printed token into the logged-in mobile app. The scanner in Maliks Quote also reads those original QR links directly. The original QR payload is not modified.

### Security and limitations
- Staff login and branch access come from the same private Maliks Core API as Maliks Sales (the existing `pos` Sales access identity).
- The quote Worker cannot call Till payment, Cash Office, stock adjustment or Dispatch endpoints.
- Price cards must be active, published, and for the selected brand. The Core checks effective branch pricing; QR data and mobile clients cannot override prices. Changed prices cause a save rejection until updated.
- Branch print queue is available only to authenticated Sales staff who are assigned to that branch; it shows the latest 75 matching quotations.
- Saving a quote does not record payment, produce a tax invoice, reserve stock or dispatch anything. It creates a quotation with the existing `AWAITING_CASH_OFFICE` status as in the legacy Sales workflow.
- WhatsApp and email are **draft links only**, not WhatsApp Business API or SMTP sending, and no PDF is automatically attached.
- In-browser camera QR detection uses BarcodeDetector where supported. If unavailable, use the **normal phone Camera app** to scan a shelf tag and tap **Staff · Add to Maliks Quote** on its existing public product page, or paste the QR link. HTTPS and camera permission are required for built-in scanning.
- The requested URL could not be verified as live in this environment. If a Worker is already deployed under `maliks-quote`, back it up before overwriting it.

## Files in the ZIP
- `maliks-operations/src/mobile-quote-frontend.mjs`: New standalone mobile interface and secured API proxy.
- `maliks-operations/src/mobile-quote-domain.mjs`: QR lookup and branch Sales print queue.
- `maliks-operations/src/core.mjs`: Adds branch-scoped, authorised QR & queue endpoints.
- `maliks-operations/src/frontend.mjs`: Connects Maliks Sales PC to a shared branch quote queue and A4 printing.
- `maliks-operations/src/pos-lucide-icons.mjs`: Bundled official Lucide SVG assets (existing brand assets remain unchanged).
- `maliks-operations/scripts/make-config.mjs`: Creates `.generated/quote.json` using the same CF Access Sales audience, with Worker name `maliks-quote`.
- `maliks-operations/package.json`: Adds `npm run deploy:quote`.
- `maliks-operations/tests/mobile-quote-integration.test.mjs`: New automated tests.
- `app/p/[token]/product-scan-page.tsx`: Adds staff Quote hand-off on existing public QR landing page.
- `CHANGES.diff`: Incremental diff; use this rather than overwriting a newer repository if it has advanced.
- `Maliks_Quote_Interactive_Preview.html`: Standalone UI demo with **fictional products and prices only**. Does not save to Cloudflare.

## Installation — VS Code / GitHub
**Always back up your current repository and database first.** Create a branch. Because this patch is based on the uploaded source plus the prior Premium, Department, Stock Master and Price/Cash-Up patches, compare with any newer GitHub changes before replacing files.

1. Extract into the **root** of `maliksgroupza` (NOT under `maliks-operations/maliks-operations`). Ensure the files in this ZIP go to the exact paths shown above.
2. From the repo root run `npm run check` to check the Hub public product page modification; don't deploy yet if there are errors.
3. From `maliks-operations/`, run:

```powershell
npm install
npm test
npm run config
```

4. Before deployment, ensure the existing `.generated/core.json` has the correct D1 database, `CF_ACCESS_AUD_POS` and `CF_ACCESS_TEAM_DOMAIN`. The new `quote.json` uses the same Sales/POS audience. **Protect the new `maliks-quote` hostname in Cloudflare Access** using your existing Sales app policy (or ensure native staff login is configured with assigned staff credentials). Do not expose raw Core endpoints.
5. Deploy in this order from `maliks-operations/`:

```powershell
npm run deploy:core
npm run deploy:quote
npm run deploy:sales
```

6. Deploy the **main Hub** via its existing GitHub/Cloudflare workflow to show the `Add to Maliks Quote` button on public product pages. It is a separate Hub deployment. It does **not** require a new D1 migration.
7. On your mobile phone: open Maliks Quote, sign in and select branch; scan a known price card and save a test quotation with sample customer data in a **test environment**. On the Sales PC open My Quotations > Branch quotation print queue; confirm the number and totals, print A4/80mm. Test WhatsApp and Email draft formatting without actually messaging a customer.
8. Verify a cashier/Dispatch user cannot use the Quote API and a Sales user cannot see another branch. Confirm existing POS flows remain unaffected.

## Verification performed
- **204 automated Node.js tests passed, 0 failed**, including 6 new mobile/QR/branch security tests.
- New JS modules and generated browser script passed Node syntax checks.
- `Maliks_Quote_Interactive_Preview.html` uses mocked data and is not connected to live Hub D1.
- Could not perform a full Hub build because the complete root project dependencies were not installed in the isolated working folder. Run `npm run check` in your full repository before deploying.
- No Worker has been deployed and no live records changed.

## QR / browser troubleshooting
- If the built-in Scan Camera reports unsupported: the phone/browser does not expose `BarcodeDetector`; scan the original QR with the phone Camera app and use the new staff button on the public product page.
- If QR says another branch: choose the branch printed on the price tag or scan its matching shelf tag.
- If the product is unpublished or has no branch price, create/publish a price in Price Tag Studio or Stock Master first.
- If Saved Quotations don't appear on PC: check the selected branch and refresh the **Branch quotation print queue**, not only **My Quotations** (which is limited to the current staff account).
- If login fails: assign the staff member the Sales/POS role and branch, or configure Cloudflare Access for the new hostname.
- WhatsApp/email do not automatically send. The operating system needs a messaging/email app configured.

## Rollback
Revert the changed files using Git and redeploy Core, Sales and Hub. The new Quote Worker can be removed or left inaccessible. There are no new database tables to drop. Never delete your existing `till_quotation_submissions` records.
