-- Phase 27: Debtor & supplier reference masters. Additive branch-scoped lookup data only.
-- NO changes to posted invoices, stock, payments, tax, delivery jobs or existing Hub records.
CREATE TABLE IF NOT EXISTS maliks_pos_reference_masters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK(kind IN ('debtor_category','debtor_classification','supplier_category','supplier_classification','region','area','delivery_method')),
  branch TEXT NOT NULL COLLATE NOCASE,
  code TEXT NOT NULL COLLATE NOCASE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  parent_region_id INTEGER REFERENCES maliks_pos_reference_masters(id) ON DELETE RESTRICT,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
  created_by_email TEXT NOT NULL,
  updated_by_email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  create_request_id TEXT NOT NULL UNIQUE,
  create_payload_hash TEXT NOT NULL,
  last_request_id TEXT NOT NULL,
  UNIQUE(kind,branch,code),
  CHECK((kind='area' AND parent_region_id IS NOT NULL) OR (kind<>'area' AND parent_region_id IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_reference_lookup ON maliks_pos_reference_masters(branch,kind,active,name);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_reference_area_region ON maliks_pos_reference_masters(parent_region_id,active);
CREATE TABLE IF NOT EXISTS maliks_pos_reference_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_maliks_pos_reference_audit ON maliks_pos_reference_audit(branch,kind,id DESC);
