-- Phase 35: branch-scoped supplier financial transaction PREPARATION only.
-- NO changes to customer balances, real payments, invoices, VAT, general ledger or bank state.
CREATE TABLE IF NOT EXISTS maliks_pos_supplier_transaction_register (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK(kind IN ('PAYMENT','REVERSAL','JOURNAL','REBATE','RECONCILIATION')),
  branch TEXT NOT NULL COLLATE NOCASE,
  reference TEXT NOT NULL COLLATE NOCASE,
  supplier_code TEXT NOT NULL DEFAULT '',
  amount_cents INTEGER NOT NULL CHECK(amount_cents>0 AND amount_cents<=100000000000),
  event_date TEXT NOT NULL,
  description TEXT NOT NULL,
  details_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','SUBMITTED','REVIEWED','REJECTED','CANCELLED')),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
  posted INTEGER NOT NULL DEFAULT 0 CHECK(posted=0),
  created_by_email TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  reviewed_by_email TEXT,
  reviewed_at TEXT,
  review_reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  create_request_id TEXT NOT NULL UNIQUE,
  create_payload_hash TEXT NOT NULL,
  last_request_id TEXT NOT NULL,
  UNIQUE(kind,branch,reference)
);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_supplier_tx_branch
 ON maliks_pos_supplier_transaction_register(branch,kind,created_at DESC);
CREATE TABLE IF NOT EXISTS maliks_pos_supplier_transaction_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL REFERENCES maliks_pos_supplier_transaction_register(id),
  branch TEXT NOT NULL COLLATE NOCASE,
  kind TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('CREATE','SUBMIT','REVIEW','REJECT','CANCEL')),
  request_id TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  status_from TEXT,
  status_to TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_supplier_tx_audit
 ON maliks_pos_supplier_transaction_audit(branch,record_id,id DESC);
