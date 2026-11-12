-- Phase 9: pilot sales receipts and dispatch work queue.
-- Additive: no modifications to prior Phase 1-8 tables, and no inventory stock deduction.
-- Does NOT grant tax-invoice compliance or prove card/EFT bank settlement.
CREATE TABLE IF NOT EXISTS maliks_p9_payments (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 request_id TEXT NOT NULL UNIQUE,
 quotation_id INTEGER NOT NULL UNIQUE REFERENCES till_quotation_submissions(id),
 branch TEXT NOT NULL,
 shift_id INTEGER NOT NULL REFERENCES maliks_till_shift_register(id),
 cashier_email TEXT NOT NULL,
 cashier_name TEXT NOT NULL,
 cash_cents INTEGER NOT NULL DEFAULT 0 CHECK(cash_cents>=0),
 cash_received_cents INTEGER NOT NULL DEFAULT 0 CHECK(cash_received_cents>=cash_cents),
 card_cents INTEGER NOT NULL DEFAULT 0 CHECK(card_cents>=0),
 card_reference TEXT NOT NULL DEFAULT '',
 eft_cents INTEGER NOT NULL DEFAULT 0 CHECK(eft_cents>=0),
 eft_reference TEXT NOT NULL DEFAULT '',
 total_cents INTEGER NOT NULL CHECK(total_cents>0 AND total_cents=cash_cents+card_cents+eft_cents),
 status TEXT NOT NULL DEFAULT 'AWAITING_VERIFICATION' CHECK(status IN ('AWAITING_VERIFICATION','CONFIRMED','REJECTED')),
 created_at TEXT NOT NULL, reviewed_by_email TEXT, reviewed_by_name TEXT, reviewed_at TEXT, review_note TEXT
);
CREATE INDEX IF NOT EXISTS idx_maliks_p9_payments_branch ON maliks_p9_payments(branch,id DESC);
CREATE INDEX IF NOT EXISTS idx_maliks_p9_payments_shift ON maliks_p9_payments(shift_id,id DESC);

-- One-and-only-one independent decision per payment. An audit trail is retained.
CREATE TABLE IF NOT EXISTS maliks_p9_payment_decisions (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 request_id TEXT NOT NULL UNIQUE,
 payment_id INTEGER NOT NULL UNIQUE REFERENCES maliks_p9_payments(id),
 decision TEXT NOT NULL CHECK(decision IN ('CONFIRMED','REJECTED')),
 evidence_note TEXT NOT NULL,
 reviewer_email TEXT NOT NULL,
 reviewer_name TEXT NOT NULL,
 created_at TEXT NOT NULL
);

-- A sequential *internal* sales invoice number is derived from this immutable ID.
-- Legal tax-invoice seller details and accounting integration remain separate commissioning tasks.
CREATE TABLE IF NOT EXISTS maliks_p9_invoices (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 payment_id INTEGER NOT NULL UNIQUE REFERENCES maliks_p9_payments(id),
 quotation_id INTEGER NOT NULL UNIQUE REFERENCES till_quotation_submissions(id),
 branch TEXT NOT NULL,
 total_cents INTEGER NOT NULL CHECK(total_cents>0),
 net_cents INTEGER NOT NULL CHECK(net_cents>=0),
 vat_cents INTEGER NOT NULL CHECK(vat_cents>=0 AND total_cents=net_cents+vat_cents),
 issued_at TEXT NOT NULL,
 issued_by_email TEXT NOT NULL
);

-- Separate internal debit/credit record, not imported into the Hub's general ledger.
CREATE TABLE IF NOT EXISTS maliks_p9_journal_lines (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 invoice_id INTEGER NOT NULL REFERENCES maliks_p9_invoices(id),
 account TEXT NOT NULL CHECK(account IN ('CASH_CONTROL','CARD_CLEARING','EFT_CLEARING','SALES_REVENUE','OUTPUT_VAT')),
 side TEXT NOT NULL CHECK(side IN ('DR','CR')),
 amount_cents INTEGER NOT NULL CHECK(amount_cents>0),
 UNIQUE(invoice_id,account,side)
);

CREATE TABLE IF NOT EXISTS maliks_p9_dispatch_jobs (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 invoice_id INTEGER NOT NULL UNIQUE REFERENCES maliks_p9_invoices(id),
 quotation_id INTEGER NOT NULL UNIQUE REFERENCES till_quotation_submissions(id),
 branch TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'AWAITING_PICK' CHECK(status IN ('AWAITING_PICK','PICKED','CHECKED')),
 created_at TEXT NOT NULL,
 picker_email TEXT,
 picker_name TEXT,
 picked_at TEXT,
 checker_email TEXT,
 checker_name TEXT,
 checked_at TEXT,
 last_action_request_id TEXT UNIQUE,
 notes TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_maliks_p9_dispatch_branch ON maliks_p9_dispatch_jobs(branch,status,id DESC);
CREATE TABLE IF NOT EXISTS maliks_p9_dispatch_audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 request_id TEXT NOT NULL UNIQUE,
 job_id INTEGER NOT NULL REFERENCES maliks_p9_dispatch_jobs(id),
 action TEXT NOT NULL CHECK(action IN ('PICK','CHECK')),
 actor_email TEXT NOT NULL,
 actor_name TEXT NOT NULL,
 note TEXT NOT NULL,
 created_at TEXT NOT NULL
);
