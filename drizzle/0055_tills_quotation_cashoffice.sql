-- Maliks Hub quotation handover: quotations only; NO invoice, tender or stock posting.
-- Safe to run more than once; runtime route also creates this table when missing.
CREATE TABLE IF NOT EXISTS till_quotation_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  branch TEXT NOT NULL,
  submitted_by_email TEXT NOT NULL,
  submitted_by_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_contact TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  lines_json TEXT NOT NULL,
  net_cents INTEGER NOT NULL CHECK (net_cents>=0),
  vat_cents INTEGER NOT NULL CHECK (vat_cents>=0),
  total_cents INTEGER NOT NULL CHECK (total_cents>0),
  status TEXT NOT NULL DEFAULT 'AWAITING_CASH_OFFICE' CHECK(status IN ('AWAITING_CASH_OFFICE','REVIEWED')),
  created_at TEXT NOT NULL,
  received_by_email TEXT,
  received_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_till_quote_branch_status_created ON till_quotation_submissions(branch,status,id DESC);
