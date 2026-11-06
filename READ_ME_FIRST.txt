MALIKS HUB — SALES → CASH OFFICE → DISPATCH ROLE HANDOVER (UI CORRECTION)
=======================================================================

This patch corrects the user-interface workflow WITHOUT turning on real financial posting.

Correct process:
  1. Sales creates a branch-priced quotation and sends it to Cash Office.
  2. Sales prints the numbered UNPAID quotation. Sales cannot accept cash/card.
  3. Customer presents quote Q-XXXXXXXX to Cash Office.
  4. Cash Office searches and checks the quote; chooses Cash or Card and enters the appropriate amount/reference.
  5. After a future verified payment + accounting/invoice service is connected, the cashier can finalise and print a PAID invoice.
  6. Dispatch must only receive PAID invoices, print picking slips and check/release items; it must not see or pick unpaid quotations.

HOW TO INSTALL (DIRECT PASTE; NO SCRIPT):
1. Download and extract this zip OUTSIDE the Hub project.
2. Copy only the patch's `app` folder into your existing maliksgroupza directory.
3. Allow Windows to merge folders and REPLACE exactly:
       app/tills/till-checkout.tsx
       app/tills/tills.module.css
4. Optionally copy `tests` and run `npm run check`.
5. Commit / upload both changed app/tills files to your GitHub repository.

IMPORTANT LIMITATIONS:
- In your current Hub, Cash Office payment posting, fiscal invoice numbering, cashier shift authentication, accounting journals, card terminal verification, and stock-ledger dispatch release ARE NOT INTEGRATED.
- Thus the Cash Office payment form is a disabled workflow preview, not a live payment processor. It never marks anything PAID.
- The existing Cash Office quotation GET/PATCH remains restricted to management/full-access users; a dedicated Cash Office employee role still requires a separate Hub assignment/authentication integration.
- A dedicated Dispatch employee role and real paid-invoice feed also require backend integration. No stock is deducted by this patch.
- This patch intentionally leaves the existing V5 styling and quotation API unchanged.
- Sales can print a numbered quotation only AFTER a successful server submission.
- The print function inserts customer/product text using textContent to avoid HTML injection.
