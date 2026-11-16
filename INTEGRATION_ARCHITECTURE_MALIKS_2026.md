# Maliks Group — Hub, POS, Tills, Cash Office, Receiving/GRV and Dispatch Integration

**Date:** 16 November 2026  
**Release:** Phase 1 — read-only, branch-scoped cross-system operations overview  
**Project inspected:** `maliksgroupza(10).zip` (Maliks Group Hub and `maliks-operations` separate Workers)

## 1. What is already in this repository

The primary Hub is a Next/React front-end running on Cloudflare with a D1 database. The `maliks-operations/` project is a **separate suite of Cloudflare Workers**, including `maliks-core-api`, management POS, Sales, Tills, Cash Office, Dispatch and Member Team. Its private Core Worker verifies the staff session and role/branch scope. Its Wrangler config points at the **same D1 database** as the Hub.

The source contains:
- Hub team membership, workspace permissions, catalogue and branch prices, stock-operations documents, and an independent Hub stock ledger.
- Operations quotations, till opening/closing, cashier/payment-pilot ledger, internal invoice records, dispatch picking/checking, purchasing POs, counted/verified/posted GRVs, supplier invoice three-way matching, inter-branch transfers, stocktakes and adjustments.
- Cloudflare deployment workflows and database migrations through Operations Phase 21b.

**Do not assume that code exists live:** The ZIP does not show which Workers, migrations, Access policies and operational accounts are actually deployed. The Hub /api/financials is a separate monthly financial entry register, not a unified audited GL. Do not market pilot `maliks_p9_invoices` as compliant tax invoices until legal entity details and SARS requirements are verified.

## 2. Critical issue discovered

`stock_inventory_balances` (Hub) and `maliks_pos_stock_balances` (Operations) are **two independent stock quantities**. The POS master file `maliks_pos_master_records` and Hub catalogue `catalogue_products` are also not a single authoritative SKU master. The Operations invoice journal is not tied to the Hub financial ledger. Cash/card/EFT settlement and POD delivery status are incomplete.

**Never mirror a GRV, sale or transfer into both stock ledgers as two separate writes.** This risks double counting and out-of-balance stock.

## 3. Phase 1 — what this patch actually changes

A new **Operations Control** menu item in the management Hub with a branch-scoped, read-only view of 16 current data sources:

1. Quotations
2. Till shifts
3. Cash Office shift reviews (not settled cash-up)
4. Tender preparations (not payments)
5. Card/EFT evidence observations (not bank verification)
6. Payment pilot
7. Dispatch pick/check
8. Purchase orders
9. POS receiving / GRVs
10. Supplier invoice matches
11. Inter-branch transfers sent
12. POS stock control documents
13. POS stock ledger SKU record count (NOT stock value)
14. Hub GRV controls
15. Hub other stock controls
16. Hub stock ledger SKU record count (NOT stock value)

It uses the **existing, same D1 binding**, checks `getHubMember()` and the authorised branch set on the server, and does not issue financial or inventory writes. Missing migrations are shown as missing, and schema errors are shown as errors, never silently treated as zero.

No database migration, POS Worker deployment, secret or public network URL is added. Retail staff do not gain access. The UI supports owner/admin, EXCO, regional/store/department managers; the backend enforces role plus branch access. The dashboard is a status view, not a certified statement of sales, deposits, invoices or stock.

## 4. Target operating model (future phases)

```text
                       MALIKS GROUP HUB (management dashboard + approvals)
                                                |
                                    Private, authenticated Core API
                                                |
               +---------------------+----------+----------------------+
               |                     |                                 |
         Sales / POS              Purchasing                      HR / team / RBAC
         quotes, orders          approved POs                      branch access
               |                     |
       Tills / Cash Office     Receiving -> Count -> Verify -> GRV
       shift, verified tenders          |
               |                  ONE STOCK LEDGER <---- Transfers / stock count
     Invoice + double-entry journal    |
               |                       |
       Ready for dispatch         Inventory & COGS
               |                       |
       Pick -> Independent check -> POD/collection -> Closed delivery
               |
     Group reporting, reconciliation and operational audit events
```

### Transaction ownership (authoritative writers)

| Business object | One authoritative owner | Rules before go-live |
|---|---|---|
| Product master and price books | Core catalogue service | One SKU per item, unit conversions, variant, barcode, branch prices, price history; catalogue pictures are optional for POS but required for the public print catalogue |
| Quote/order | Core sales service | Signed product/price snapshot, stock availability, quote expiration, unique document number, no cashier price edits |
| Till shift | Core till service | One active shift per till and cashier; controlled float/cash movement; sequential open and close |
| Payment | Core payment service | Idempotency key, cash drawer count, verified card terminal/EFT callback, independent supervisor review and exception workflow |
| Tax invoice / GL | Accounting owner | Compliant tax fields, VAT calculation, balanced double-entry, reversals rather than editing posted entries |
| Pick/POD | Core dispatch service | Only a verified paid and released order; picker ≠ checker, partials, driver's POD signature, vehicle/bay and delivery acknowledgement |
| GRV / stock ledger | **ONE** core inventory service | PO reference, blind count, rejected/damaged lines, separate checker, approved posting once, labels, cost valuation and stock movement audit |
| Supplier invoice / AP | Finance/AP owner | PO–GRV–invoice three-way match with tolerance/exception approvals; separate supplier payment controls |
| Cash-up | Cash Office + finance | Shift expected vs counted, variance reasons, independent review, deposit and bank statement matching |
| Returns/refunds | Manager approval + core | Original invoice, return reason, stock inspection, refund tender authorization, reversal journal, audit |

### End-to-end flow A — customer sale

`Quote → Order → Till shift → Verified payment → Posted invoice and VAT journal → Pick list → Picker → Checker → Delivery/collection POD → Stock movement and COGS → Reconciliation`.

Cash Office should not mark a card/EFT transaction paid solely from a manually typed reference. The invoice, journal, paid state and dispatch release must commit atomically or be recovered from a named pending state; retries must not double post. Dispatch cannot turn `CHECKED` into `DELIVERED` without a new POD workflow.

### End-to-end flow B — GRV / purchasing

`PO approved → Delivery note at security/receiving → Count team → Receiving Manager verifies → GRV Clerk captures stock and pricing → Manager approves → SINGLE inventory post → Labels printed/applied → Pack sent for Store Manager review → Supplier invoice matched → Finance AP`.

Retain a receiving audit pack: delivery note, original supplier invoice, counted sheet, pricing sheet, adjustments/rejections, posted GRV, print/label times, reviewer names and signatures.

### End-to-end flow C — day-end Cash Office

`Cashier closes shift → Cash count and variance record → Supervisor reviews → Deposit preparation → Bank/card settlement reconciliation → Finance closes batch`.

Shift closure is NOT equivalent to a settled deposit.

## 5. Implementation sequence (recommended)

1. **Inventory and identity audit** — list all branches/DC/HO, roles, live Workers, D1 tables, devices, tender terminals, document prefixes and VAT entity details. Export a read-only snapshot and back up D1.
2. **Stock source-of-truth decision** — map `catalogue_products.id` ↔ `maliks_pos_master_records.id`, SKUs, branches and UOM (tile box vs m², timber length, cement bag). Validate opening/closing counts and pending GRVs/transfers. Choose ONE stock posting owner per branch and apply an approved cutover plan; keep the other ledger read-only.
3. **Core transactions** — centralize signed order, tender, invoice, journal and stock movements. All posting endpoints are private Core Worker methods invoked with Cloudflare Service Bindings; enforce role and branch again at the Core. Never assume Access credentials propagate automatically through a binding.
4. **Cash Office & Tills** — verified tender events, terminals, hard cashier idempotency, shift cash-up, variance approvals, bank statement settlement. Do not enable pilot `MALIKS_P9_APPROVAL_ENABLED` as a production shortcut.
5. **Dispatch & GRV** — picker/checker/POD, partial dispatch, staged bays, inventory transfer states; receiving labels, signature trail and posted GRV integrated through the single inventory service.
6. **Finance** — proper account tree, balanced journal (cash/card clearing, sales, output VAT, stock, COGS, AP, input VAT), branch allocations and reconciliation against actual POS evidence. Do NOT treat the current Hub `financial_entries` as an automatically balanced GL.
7. **Offline tills** — persistent device-specific queue and signed identities, an explicit offline/online status, unique transaction IDs, conflict handling, print and retry behavior. Never mark offline card transactions paid without verified terminal/payment reconciliation; offline stock is an estimate until synchronization.
8. **Phased launch** — pilot ONE branch with reconciled opening stock, 2-person permissions, test scenarios (payment retries, double click, network loss, over-receiving, refund, chargeback, partial delivery, missing POD). Review daily for several cycles before expanding group-wide.

**Operational controls:** all document changes append audit records, no deletion of approved entries, no shared cashier passwords, branch isolation in the Core, restrict secrets to Cloudflare/GitHub, backups and disaster recovery drills, monitoring/alerting for posting exceptions.

## 6. Cloudflare design

- The existing `maliks-core-api` Worker remains **private**; only department apps call it via Service Bindings. The management Hub may use its current D1 connection for read-only reporting in Phase 1. In future, prefer an explicit Core read-only report method so write/reconciliation rules are centralized.
- Use authenticated, role-scoped Core APIs; read/write authority must be checked server-side even if the UI hides a button.
- Use transactional writes with unique idempotency keys and a persistent event/outbox for downstream reporting, printing and notifications. At-least-once message delivery requires idempotent consumers.
- Use D1 only within verified scale and transactional limits; before centralizing audited financial postings, design and test consistency guarantees (or an appropriately transactional ledger database).
- Do not redeploy or overwrite existing live Workers until names and current domain mappings have been verified.

References: Cloudflare Worker Service Bindings https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/ ; Cloudflare Queues https://developers.cloudflare.com/queues/get-started/ .

## 7. Deployment checks for Phase 1

- Apply the patch to the exact project version from `maliksgroupza(10).zip`; no full project overwrite.
- Run the new policy tests, `npm run check`, then deploy the Hub to a staging URL.
- Owner sees Operations Control with all active workspaces; Store Manager sees only assigned branches; Sales/Tills and HR accounts get HTTP 403 to `/api/operations-bridge`.
- A missing Operations migration shows *Not configured*. A malformed one shows *Cannot read*, never zero activity.
- Compare dashboard counts with 2–3 SQL rows per table/branch; audit any discrepancies before production.
- Deploy only after site and operational staff acceptance; no live money or stock actions are enabled by Phase 1.
