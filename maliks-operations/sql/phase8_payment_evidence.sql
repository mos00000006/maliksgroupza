-- Phase 8: append-only independent observations of CARD/EFT source documents.
-- This table is NOT the payments journal and MUST NOT drive paid, invoicing, cashup
-- reconciliation, stock deduction, or Dispatch eligibility.
CREATE TABLE IF NOT EXISTS maliks_payment_evidence_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL UNIQUE,
  preparation_id INTEGER NOT NULL REFERENCES maliks_tender_preparations(id),
  branch TEXT NOT NULL,
  quotation_number TEXT NOT NULL,
  method TEXT NOT NULL CHECK(method IN ('CARD','EFT')),
  decision TEXT NOT NULL CHECK(decision IN ('DOCUMENT_CHECKED','FOLLOW_UP_REQUIRED')),
  source TEXT NOT NULL CHECK(source IN ('TERMINAL_REPORT','BANK_STATEMENT','NOT_AVAILABLE')),
  source_reference TEXT NOT NULL CHECK(length(source_reference)<=80),
  expected_amount_cents INTEGER NOT NULL CHECK(expected_amount_cents>0 AND expected_amount_cents<=1000000000),
  observed_amount_cents INTEGER NOT NULL CHECK(observed_amount_cents>=0 AND observed_amount_cents<=1000000000),
  note TEXT NOT NULL CHECK(length(note) BETWEEN 10 AND 400),
  reviewed_by_email TEXT NOT NULL,
  reviewed_by_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OBSERVATION_ONLY' CHECK(status='OBSERVATION_ONLY'),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_maliks_evidence_branch ON maliks_payment_evidence_observations(lower(branch),id DESC);
CREATE INDEX IF NOT EXISTS idx_maliks_evidence_prep ON maliks_payment_evidence_observations(preparation_id,method,id DESC);
