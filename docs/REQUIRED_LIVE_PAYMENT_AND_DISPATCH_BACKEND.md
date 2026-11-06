# Required production workflow — Sales → Cash Office → Dispatch

## Roles and server-side authorisation

- **Sales / Tills:** create, edit, submit, view and print quotations for assigned branch. No payment, invoice or stock-release permission.
- **Cash Office:** search quotation by number or customer for assigned branch. Record a payment only within an authenticated open till shift. Must not edit quotation prices or product lines.
- **Dispatch:** view only posted, paid and dispatch-authorised invoices at assigned branch; print pick lists; assign picker and checker; record collected/delivered POD. No payment rights.
- **Owner / Full company:** may view all three workspaces; actual financial actions still require cashier/approval permissions and audit.

## Exact customer journey

1. Sales selects products and customer, submits an immutable branch-price snapshot and receives Q-XXXXXXXX. Print quotation clearly headed **UNPAID QUOTATION**.
2. Customer presents Q-XXXXXXXX at Cash Office. Cash Office searches and opens that exact quote. System compares total, branch, status, expiry and amount before accepting payment.
3. Cashier chooses **Cash** or **Card**. For cash, amount received and change are recorded against an open cash shift. For card, successful terminal/provider authorisation (not a self-typed approval number alone) must be verified against the amount, branch, terminal and one-time reference.
4. A single server-side transaction with idempotency key posts payment, balanced financial journal, VAT, numbered invoice and dispatch release event exactly once. If any write fails, roll back all writes and show a recoverable pending state rather than PAID.
5. Print the tax invoice with full legal company/VAT details, numbered invoice, original quotation number, tender method and **PAID**. A reprint is marked copy/reprint and audited.
6. Dispatch queue receives only invoices with a committed, verified PAID status and same-branch authorisation. Picker prints picking slip; Checker signs picked quantities; dispatch issues signed POD and performs controlled stock movement exactly once.
7. Refunds, cancellations, partial delivery, stock shortfalls, chargebacks, voids and offline resync require separate supervisor workflows and audit.

## Proposed state machine

`QUOTED → AWAITING_PAYMENT → PAYMENT_VERIFYING → PAID_INVOICED → READY_TO_PICK → PICKING → PICKED_CHECKED → DISPATCHED / COLLECTED`.

Failed or interrupted payment remains `AWAITING_PAYMENT` or `PAYMENT_REVIEW` and cannot enter Dispatch. Never use manually changed display flags as proof of payment.

## Data/integration requirements

Authoritative invoices and payments must be in the ERP transactional database; D1 quotation handover alone is insufficient. The current Hub code provides a quotation submission/review queue, not a GL or invoice service. Securely connect the Hub to RetailOS's PostgreSQL ledger and signed device identities before activating the final Cash Office action.

**Current direct-paste UI patch does not post money, issue a paid invoice, deduct stock, or release items.** Its disabled confirmation action is deliberate until the above requirements are met.
