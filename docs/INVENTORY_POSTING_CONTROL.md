# Maliks Group Hub: Inventory Posting Control — V9

## Cutover and reconciliation

This patch creates a new **independent Hub stock ledger**. It does not migrate or reconcile existing TOUCH365 quantities, past Hub control documents, purchasing or invoices. Its quantity calculations are in integer thousandths of each SKU's **base unit**. Decide the base unit for every product before importing stock. Do not treat `sum(qty_milli)` as financial valuation or a meaningful common unit across different SKU units.

1. Backup D1, review migrations 0056 and 0057 and test in a nonproduction environment.
2. Obtain a dated, signed branch-level physical stock count. Handle pending deliveries, transfers and paid sales separately in the cutover snapshot.
3. Import one row per branch and SKU with the exact verified starting quantity, including zero quantities. Up to 100 pasted rows at a time; each batch is atomic. Imported entries and source references are audit records.
4. Reconcile sample products against the existing system, especially tiles by m² vs box, timber lengths, cement bags and bulk units.
5. Activate *one test branch* using an admin account and explicit activation confirmation. There is deliberately **no automatic activation** during SQL migration.
6. Run test GRV, stock count, adjustment, return and transfer with a distinct approver and receiver. Cross-check movement rows and physical balances.
7. Phase in additional branches only after validation. Transfers require **both branches active**, and baseline quantities for every transferred SKU at both branches.

### Posting policy by document type

| Document | When it posts | Movement |
|---|---|---|
| GRV | authorised approval | `received − rejected` at source branch |
| Stock Count | authorised approval | `physical − system` at source branch; expected must equal live balance |
| Stock Adjustment | authorised approval | `physical − system` at source branch; expected must equal live balance |
| Supplier Return | authorised approval | negative return quantity at source branch |
| Transfer | authorised approval | negative transfer quantity at source branch; in transit |
| Transfer Receipt | distinct destination receiving acknowledgement | positive transfer quantity at destination branch |

**Avoid double-counting a discrepancy:** an approved stock count reconciles the balance. Do not subsequently raise a second adjustment for the same variance. If you want a count-for-observation-only workflow, keep the branch in control-register mode until that policy is explicitly changed.

## Safety and consistency

- Missing opening-stock product: **approval aborts**. No implicit zero.
- Negative stock: **approval aborts**. No partial updates.
- Stale physical/system count: **approval aborts**, requiring a new count and document.
- Document with no product lines: **approval aborts** in activated branches.
- Both transfer branches must be active and the destination SKU initialized. Old pre-activation transfers may not be received into the live ledger without new source posting.
- DB triggers post all product lines in the same atomic SQL update as the document state transition. If one line fails, approval and all other line postings are rolled back.
- Documents cannot be reapproved, movements cannot be deleted or changed, and initial opening entries are audited.
- Only authenticated, scoped stock staff can view a branch's inventory; only full Hub administrators can initialize/activate stock.
- Existing approved documents are not replayed. Historic documents remain as control-only records; baseline counts must account for them.

## Technical inventory tables

- `stock_inventory_branches`: branch-level live posting activation flag and operator/reference.
- `stock_inventory_balances`: one record per branch and catalogue SKU, in integer milli-units.
- `stock_inventory_movements`: append-only opening, approval and receipt events.
- `stock_ops_documents` and `stock_ops_document_lines` remain the document control sources.

The existing `/api/stock-operations` approval/receipt endpoints are preserved; SQL triggers ensure stock updates are atomic with their transitions. The new `/api/stock-operations/inventory` endpoint provides role-scoped catalogue balances, movement history and admin-only opening stock operations.
