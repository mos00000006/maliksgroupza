-- Maliks Operations Phase 4. SAFE additive schema: no existing tables altered.
-- A shift register is NOT a cash-up or payment ledger.
CREATE TABLE IF NOT EXISTS maliks_till_shift_register (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  open_request_id TEXT NOT NULL UNIQUE,
  branch TEXT NOT NULL,
  till_code TEXT NOT NULL,
  opened_by_email TEXT NOT NULL,
  opened_by_name TEXT NOT NULL,
  opening_float_cents INTEGER NOT NULL CHECK(opening_float_cents BETWEEN 0 AND 100000000),
  opened_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','CLOSED')),
  counted_cash_cents INTEGER CHECK(counted_cash_cents BETWEEN 0 AND 1000000000),
  close_notes TEXT NOT NULL DEFAULT '',
  closed_by_email TEXT,
  closed_at TEXT,
  close_request_id TEXT UNIQUE,
  CHECK(status='OPEN' OR (closed_at IS NOT NULL AND counted_cash_cents IS NOT NULL AND closed_by_email IS NOT NULL))
);
-- Exactly one open shift per till within a branch, regardless of cashier.
CREATE UNIQUE INDEX IF NOT EXISTS idx_maliks_till_single_open
  ON maliks_till_shift_register(lower(branch),lower(till_code)) WHERE status='OPEN';
-- Exactly one open shift per cashier (even across branches).
CREATE UNIQUE INDEX IF NOT EXISTS idx_maliks_cashier_single_open
  ON maliks_till_shift_register(lower(opened_by_email)) WHERE status='OPEN';
CREATE INDEX IF NOT EXISTS idx_maliks_till_branch_history
  ON maliks_till_shift_register(lower(branch),id DESC);
