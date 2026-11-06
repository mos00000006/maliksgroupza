# Maliks Group Hub — Stock Operations controls

## Operating sequence

| Workstream | Creator | Approval | Final document stage | Integration still required |
|---|---|---|---|---|
| GRV / supplier receiving | Receiving / GRV | Independent authorised Store/Stock Manager | **Approved control record** | PO match, signed blind count, GRV posting, stock valuation and AP |
| Stock adjustments | Stock Controller | Independent Stock Manager | **Approved adjustment request** | Posting to stock ledger/GL, stock count variance controls |
| Stock counts | Stock Controller | Independent manager | **Approved count record** | Cycle count baseline, physical lock/recount and official variance |
| Supplier returns | Receiving / GRV | Independent manager | **Approved return request** | Return authorisation, credit-note reconciliation and stock ledger |
| DC / branch transfers | DC / Transfers | Originating authorised manager | **Received control record** after destination acknowledgement | Source/transit/destination balanced postings and POD |

All source documents and entries are currently **control records**. None changes actual stock or accounting balances.

### Supplier GRV workflow (target production)

1. Purchasing issues an authorised PO and retains supplier DN/invoice; receiving staff receive a **blind-count** sheet without expected quantities.
2. Receiving checks vehicle arrival time, driver identity, physical counts and damage. Reject damaged goods immediately, record rejection with reason, and retain the transport documentation.
3. Receiving Supervisor signs the count. GRV Clerk compares it against original PO and supplier DN, resolves shortages/price discrepancies and obtains approval.
4. Only after reconciliation and verified authority should a future **production posting service** update stock ledger, supplier liability and procurement history in one transaction.
5. Print or apply labels to accepted stock; record `Labelled Y/N` and the employee. Direct goods to the sales floor or transfer bay under the supervisor's control.

### Stock adjustment controls

- Always capture product, system quantity, physical quantity, reason and supporting count reference.
- The requestor cannot approve their own adjustment.
- Negative stock or unbalanced accounting must never result from an adjustment.
- The production service must enforce weighted-average/FIFO cost policy, GL account mapping and locked period checks before posting.

### Permissions

| Duty | Create | Review | Destination transfer receipt |
|---|---|---|---|
| Receiving / GRV | GRV, supplier return | No | Can acknowledge destination transfer if assigned there |
| Stock Controller | Count, adjustment | No | Can acknowledge destination transfer if assigned there |
| DC / Transfers | Transfer | No | Can acknowledge destination transfer if assigned there |
| Stock Manager | All permitted branch document types | Yes, **not their own** | Can acknowledge if not creator/approver |
| Store/Regional/Department Manager | Branch documents according to Hub scope | Yes, **not their own** | Only authorised destination branch |
| Owner / Admin | All branches | Yes, **not their own** | Yes, subject to independence rule |

Authorization is validated on the API, not merely by hiding controls. Staff role assignment uses Hub membership and per-branch `stock_ops_assignments`. Each employee must be invited through Hub Team Members first. This module does not modify unrelated Hub module access rights.

### Required acceptance tests before using real stock balances

- Authenticate across branches, verify 403 for every cross-branch read/write, and approve with different accounts.
- Prove unique document numbers, duplicate submission recovery and trigger-enforced audit immutability.
- Verify completed GRVs and transfers post *once* with cost and GL in a single transaction; failed postings leave no partial stock movement.
- Reconcile opening and closing stock, stock valuations, supplier creditors and approved counts per store.
- Test printer signatures, dispatch workflow and supplier returns with real staff and devices.
