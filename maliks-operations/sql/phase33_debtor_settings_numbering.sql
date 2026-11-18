-- Phase 33: additive branch Debtors settings and controlled, non-posting reference reservations.
-- No changes to existing quote, invoice, payment, or debtor master numbering.
CREATE TABLE IF NOT EXISTS maliks_pos_debtor_branch_settings (
  branch TEXT PRIMARY KEY COLLATE NOCASE,
  default_terms_days INTEGER NOT NULL DEFAULT 30 CHECK(default_terms_days BETWEEN 0 AND 365),
  default_credit_limit_cents INTEGER NOT NULL DEFAULT 0 CHECK(default_credit_limit_cents BETWEEN 0 AND 100000000000),
  statement_cutoff_day INTEGER NOT NULL DEFAULT 28 CHECK(statement_cutoff_day BETWEEN 1 AND 28),
  invoice_note TEXT NOT NULL DEFAULT '',
  statement_note TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  changed_by TEXT NOT NULL,
  changed_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS maliks_pos_debtor_number_sequences (
  branch TEXT NOT NULL COLLATE NOCASE,
  kind TEXT NOT NULL,
  prefix TEXT NOT NULL,
  width INTEGER NOT NULL DEFAULT 6 CHECK(width BETWEEN 4 AND 10),
  next_value INTEGER NOT NULL DEFAULT 1 CHECK(next_value BETWEEN 1 AND 999999999),
  version INTEGER NOT NULL DEFAULT 1,
  changed_by TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  PRIMARY KEY (branch,kind)
);
CREATE TABLE IF NOT EXISTS maliks_pos_debtor_reserved_numbers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch TEXT NOT NULL COLLATE NOCASE,
  kind TEXT NOT NULL,
  sequence_value INTEGER NOT NULL,
  reference TEXT NOT NULL,
  request_id TEXT NOT NULL UNIQUE,
  payload_json TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  reserved_at TEXT NOT NULL,
  UNIQUE(branch,kind,sequence_value),
  UNIQUE(branch,kind,reference)
);
CREATE INDEX IF NOT EXISTS idx_maliks_debtor_reserved_branch ON maliks_pos_debtor_reserved_numbers(branch,kind,reserved_at);
CREATE TABLE IF NOT EXISTS maliks_pos_debtor_config_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch TEXT NOT NULL COLLATE NOCASE,
  action TEXT NOT NULL,
  kind TEXT NOT NULL,
  detail TEXT NOT NULL,
  request_id TEXT NOT NULL UNIQUE,
  actor_email TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_maliks_debtor_config_audit_branch ON maliks_pos_debtor_config_audit(branch,id);
