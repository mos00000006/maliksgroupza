# MaliksPOS — Full Retail ERP / Touch-class capability map

This is a **target feature specification**, not a claim that every module is implemented.

| Workflow | Phase 1 release | Future build requirements |
|---|---|---|
| Independent Windows/mobile app install, brand and domain | Implemented PWA | PWA release/update control, kiosk mode |
| Branch-controlled catalogue and product lookup | Implemented | Barcode mapping, bulk price import, label print |
| Quotations | Implemented | Manager discount authorisation, hold & resume, expiry/versioning |
| Pricing | Server validated from Hub published tags | Effective-date tariffs, margins, promotions, rounding rules |
| Stock on hand | Read-only if verified inventory ledger is active | Stock reservations, real-time sales movements, synchronisation |
| Offline use | Local quotation drafts only | Signed device identity, secured local queue, conflict handling, sync audit |
| Cash Office | Not active | Tender allocation, card/cash/EFT receipts, split tender, refund controls |
| Invoicing | Not active | Fiscal document numbering, immutable tax invoice, credit notes, returns |
| Dispatch & deliveries | Not active | Paid-status validation, pick/stage, route, POD, branch dispatch release |
| Inventory | Not active | Stock counts, receipts, transfers, GRV, FIFO/weighted cost, adjustments |
| Purchasing / suppliers | Not active | Purchase order, GRV, supplier invoices, creditors, cost/margin history |
| Trade/debtors | Not active | Account limit, statements, terms, allocations, ageing & collections |
| Lay-by, reservations | Not active | Deposit ledger, reservation expiry, release rights |
| Loyalty / promotions | Not active | Customer profile, redemptions, promotions, eligibility |
| Staff and audit | Role/branch authorization integrated | Supervisor override, action ledger, till shift management |
| Cashups and reports | Quote metrics only | Daily takings, Z-report, cashier cash-ups, GP and VAT returns |
| General ledger | Not active | Atomic double-entry journals, reconciliation, period locks |
| Distribution centre | Not active | DC stock, transfers, routing, back-orders, allocation |

## Critical transaction flow for next release

1. Sales agent creates server-confirmed quotation, with branch-specific approved pricing and manager-approved discounts only.
2. Cash Office loads by quotation reference, takes authorised payment through a provider or controlled tender reconciliation, then atomically generates a unique **paid invoice**. No sales agent may process payment.
3. Dispatch Desk receives paid invoices **only after server verification**, prints a picking slip, picks and stages, validates the customer reference and marks signed collection/POD.
4. Inventory movements, general ledger journals, payment allocations and audit events are recorded as one controlled transaction or via explicit compensated events. Offline orders are never marked paid without server reconciliation.

For a 25-store operation + DC, branch scope and document IDs must be explicit on every transaction, with idempotency, period locks, exception queues and backups. Do not implement these as UI toggles without schemas and atomic server APIs.
