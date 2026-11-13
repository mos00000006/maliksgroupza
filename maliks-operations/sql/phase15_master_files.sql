-- Phase 15: additive, independent master-file register.
-- NO stock-on-hand, customer balance, supplier balance, tax, payment or GL posting.
CREATE TABLE IF NOT EXISTS maliks_pos_master_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK(kind IN ('stock','supplier','debtor')),
  branch TEXT NOT NULL COLLATE NOCASE,
  code TEXT NOT NULL COLLATE NOCASE,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  details_json TEXT NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
  created_by_email TEXT NOT NULL,
  updated_by_email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  create_request_id TEXT NOT NULL UNIQUE,
  create_payload_hash TEXT NOT NULL,
  last_request_id TEXT NOT NULL,
  UNIQUE(kind,branch,code)
);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_master_branch ON maliks_pos_master_records(kind,branch,name);
CREATE TABLE IF NOT EXISTS maliks_pos_master_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK(kind IN ('stock','supplier','debtor')),
  branch TEXT NOT NULL COLLATE NOCASE,
  record_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('CREATE','UPDATE')),
  actor_email TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_audit_branch ON maliks_pos_master_audit(kind,branch,id DESC);
