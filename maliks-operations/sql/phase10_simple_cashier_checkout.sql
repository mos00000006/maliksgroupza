-- Phase 10: cashier attestation for same-step Cash/Card checkout into Dispatch.
-- Cashier confirmation is not processor/bank verification. No stock deductions.
-- Additive and safe to reapply after Phase 9.
CREATE TABLE IF NOT EXISTS maliks_p10_cashier_confirmations (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 request_id TEXT NOT NULL UNIQUE,
 payment_id INTEGER NOT NULL UNIQUE REFERENCES maliks_p9_payments(id),
 branch TEXT NOT NULL,
 method TEXT NOT NULL CHECK(method IN ('CASH','CARD')),
 amount_received_cents INTEGER NOT NULL CHECK(amount_received_cents>0),
 attestation TEXT NOT NULL CHECK(attestation IN ('CASH_RECEIVED','CARD_TERMINAL_APPROVED')),
 cashier_email TEXT NOT NULL,
 cashier_name TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_maliks_p10_checkout_branch ON maliks_p10_cashier_confirmations(branch,id DESC);
