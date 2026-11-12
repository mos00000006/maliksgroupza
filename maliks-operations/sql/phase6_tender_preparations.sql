-- Phase 6: internal tender PREPARATIONS, not payments or receipts.
-- Completely separate from invoices, cash ledger, bank accounts, stock, POS and dispatch.
CREATE TABLE IF NOT EXISTS maliks_tender_preparations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL UNIQUE,
  quotation_id INTEGER NOT NULL UNIQUE REFERENCES till_quotation_submissions(id),
  quotation_number TEXT NOT NULL,
  branch TEXT NOT NULL,
  shift_id INTEGER NOT NULL REFERENCES maliks_till_shift_register(id),
  prepared_by_email TEXT NOT NULL,
  prepared_by_name TEXT NOT NULL,
  cash_applied_cents INTEGER NOT NULL CHECK(cash_applied_cents BETWEEN 0 AND 1000000000),
  cash_received_cents INTEGER NOT NULL CHECK(cash_received_cents BETWEEN cash_applied_cents AND 1000000000),
  card_cents INTEGER NOT NULL CHECK(card_cents BETWEEN 0 AND 1000000000),
  card_reference TEXT NOT NULL DEFAULT '' CHECK(length(card_reference)<=60),
  eft_cents INTEGER NOT NULL CHECK(eft_cents BETWEEN 0 AND 1000000000),
  eft_reference TEXT NOT NULL DEFAULT '' CHECK(length(eft_reference)<=60),
  change_cents INTEGER NOT NULL CHECK(change_cents=cash_received_cents-cash_applied_cents),
  quote_total_cents INTEGER NOT NULL CHECK(quote_total_cents>0 AND quote_total_cents=cash_applied_cents+card_cents+eft_cents),
  status TEXT NOT NULL DEFAULT 'PREPARATION_ONLY' CHECK(status='PREPARATION_ONLY'),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_maliks_tender_preps_branch ON maliks_tender_preparations(lower(branch),id DESC);
CREATE INDEX IF NOT EXISTS idx_maliks_tender_preps_shift ON maliks_tender_preparations(shift_id,id DESC);
