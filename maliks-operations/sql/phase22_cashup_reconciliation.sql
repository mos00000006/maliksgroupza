-- Phase 22: independent cash-office cash-count review.
-- Additive audit register. Does not create deposits, bank reconciliation, invoices or stock postings.
CREATE TABLE IF NOT EXISTS maliks_p22_cashup_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL UNIQUE,
  branch TEXT NOT NULL,
  shift_id INTEGER NOT NULL REFERENCES maliks_till_shift_register(id),
  decision TEXT NOT NULL CHECK(decision IN ('CASH_COUNT_CHECKED','FLAGGED')),
  opening_float_cents INTEGER NOT NULL CHECK(opening_float_cents>=0),
  confirmed_cash_sales_cents INTEGER NOT NULL CHECK(confirmed_cash_sales_cents>=0),
  expected_cash_cents INTEGER NOT NULL CHECK(expected_cash_cents>=0),
  counted_cash_cents INTEGER NOT NULL CHECK(counted_cash_cents>=0),
  variance_cents INTEGER NOT NULL,
  pending_payment_count INTEGER NOT NULL CHECK(pending_payment_count>=0),
  reviewer_email TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  note TEXT NOT NULL,
  reviewed_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_maliks_p22_cashup_shift ON maliks_p22_cashup_reviews(branch,shift_id,id DESC);
