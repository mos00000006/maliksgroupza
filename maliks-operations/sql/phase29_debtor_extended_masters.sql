-- Phase 29 — add the remaining Debtors reference masters without rebuilding Phase 27.
-- Only new tables/indexes. No posted documents or previous reference records are touched.
CREATE TABLE IF NOT EXISTS maliks_pos_debtor_extra_masters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK(kind IN ('debtor_route','debtor_return_reason','debtor_invoice_classification','debtor_invoice_note')),
  branch TEXT NOT NULL COLLATE NOCASE,
  code TEXT NOT NULL COLLATE NOCASE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  parent_region_id INTEGER,
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
  CHECK(parent_region_id IS NULL)
);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_debtor_extra_lookup
  ON maliks_pos_debtor_extra_masters(branch,kind,active,name);
