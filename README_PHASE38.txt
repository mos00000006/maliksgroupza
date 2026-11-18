PHASE 38 — Suppliers Settings and Numbering

Apply the supplied files at identical repository paths. Use on top of Phase 37.

Settings saves branch defaults and notes in independent supplier tables; it does not automatically alter existing invoices, supplier balances, orders, VAT, bank posting, or payment terms.
Numbering supports auditable branch-specific reference reservations, with forward-only sequences and manager controls. These are NOT connected to live purchase orders or supplier invoice numbering.

CI applies the additive Phase 38 D1 SQL before deploying private Core and POS Workers.

Validation: run npm test from maliks-operations before pushing; manually check Suppliers > Settings / Numbering and permissions after deployment.
