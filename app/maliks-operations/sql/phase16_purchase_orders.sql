-- Phase 16: purchasing authorisation register only. No GRV, SOH, AP, VAT, or GL postings.
CREATE TABLE IF NOT EXISTS maliks_pos_purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch TEXT NOT NULL COLLATE NOCASE,
  supplier_master_id INTEGER NOT NULL,
  supplier_code TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  lines_json TEXT NOT NULL,
  total_cents INTEGER NOT NULL CHECK(total_cents>0),
  notes TEXT NOT NULL DEFAULT '',
  expected_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','SUBMITTED','APPROVED','REJECTED','CANCELLED')),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version>0),
  created_by_email TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  submitted_by_email TEXT,
  approved_by_email TEXT,
  rejected_by_email TEXT,
  cancelled_by_email TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  create_request_id TEXT NOT NULL UNIQUE,
  create_payload_hash TEXT NOT NULL,
  last_request_id TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_po_branch ON maliks_pos_purchase_orders(branch,id DESC);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_po_status ON maliks_pos_purchase_orders(branch,status,id DESC);
CREATE TABLE IF NOT EXISTS maliks_pos_po_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL UNIQUE,
  po_id INTEGER NOT NULL,
  branch TEXT NOT NULL COLLATE NOCASE,
  action TEXT NOT NULL CHECK(action IN ('CREATE','SAVE','SUBMIT','APPROVE','REJECT','CANCEL')),
  actor_email TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_po_audit ON maliks_pos_po_audit(branch,po_id,id DESC);
