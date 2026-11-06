MALIKS HUB - FULL SALES / TILLS PROFESSIONAL STYLE SYSTEM PATCH
================================================================

What this patch does
--------------------
This patch applies the newer professional Maliks RetailOS visual system across the
Sales / Tills workspace files included in the patch.

Included style/workflow coverage
--------------------------------
- Main Sales / Checkout workstation styling
- Quotation workflow styled to match the new workstation
- Sales Order / Lay-by / Parked documents styled from the same system
- Product picker / branch catalogue modal aligned to the same visual language
- Cash Office quotation handover support files included
- Route policy file included for Sales / Tills access control

Main files included
-------------------
- app/tills/page.tsx
- app/tills/till-checkout.tsx
- app/tills/tills.module.css
- app/api/tills/catalogue/route.ts
- app/api/tills/quotes/route.ts
- app/api/tills/quotes/quote-domain.mjs
- app/api/tills/quotes/quote-domain.d.mts
- app/lib/tills-route-policy.ts
- drizzle/0055_tills_quotation_cashoffice.sql
- tests/*.mjs

How to install
--------------
1. Extract this ZIP.
2. Copy the folders app, drizzle and tests into your existing maliksgroupza project folder.
3. Merge folders and replace destination files when prompted.
4. If you use database migrations for quotations-to-cash-office, apply:
   drizzle/0055_tills_quotation_cashoffice.sql
5. Commit/push the changes to GitHub.

Important
---------
- This is a UI/style + quotation workflow patch for Sales / Tills.
- It does NOT enable live payment posting, stock deduction or accounting posting.
- The small setup/status message remains intentionally, but the large demo/preview look is removed.
- Products without published branch prices remain visible but unavailable for addition.

Recommended next step
---------------------
After installing this patch, the next best follow-up is a dedicated Cash Office style pass
so quotations received from Sales fully match the new workstation look as well.
