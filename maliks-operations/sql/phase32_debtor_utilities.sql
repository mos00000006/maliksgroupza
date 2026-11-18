-- Phase 32: debtor administration utilities; additive and repeatable.
-- Never posts payment, creates invoices, changes balances, or deletes historic records.
CREATE TABLE IF NOT EXISTS maliks_pos_debtor_agents (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 branch TEXT NOT NULL COLLATE NOCASE,
 code TEXT NOT NULL COLLATE NOCASE,
 name TEXT NOT NULL,
 email TEXT NOT NULL DEFAULT '',
 phone TEXT NOT NULL DEFAULT '',
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN(0,1)),
 version INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 updated_by TEXT NOT NULL,
 UNIQUE(branch,code)
);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_debtor_agents_branch ON maliks_pos_debtor_agents(branch,active,code);
CREATE TABLE IF NOT EXISTS maliks_pos_debtor_sales_blocks (
 branch TEXT NOT NULL COLLATE NOCASE,
 debtor_code TEXT NOT NULL COLLATE NOCASE,
 blocked INTEGER NOT NULL CHECK(blocked IN(0,1)),
 reason TEXT NOT NULL,
 version INTEGER NOT NULL DEFAULT 1,
 changed_by TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 PRIMARY KEY(branch,debtor_code)
);
CREATE TABLE IF NOT EXISTS maliks_pos_debtor_quote_archives (
 branch TEXT NOT NULL COLLATE NOCASE,
 quotation_id INTEGER NOT NULL,
 reason TEXT NOT NULL,
 archived_by TEXT NOT NULL,
 archived_at TEXT NOT NULL,
 PRIMARY KEY(branch,quotation_id)
);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_debtor_quote_archives_by_user ON maliks_pos_debtor_quote_archives(branch,archived_at);
CREATE TABLE IF NOT EXISTS maliks_pos_debtor_import_batches (
 request_id TEXT PRIMARY KEY,
 branch TEXT NOT NULL COLLATE NOCASE,
 actor_email TEXT NOT NULL,
 payload_hash TEXT NOT NULL,
 count INTEGER NOT NULL CHECK(count>0),
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_debtor_import_batches_branch ON maliks_pos_debtor_import_batches(branch,created_at);
CREATE TABLE IF NOT EXISTS maliks_pos_debtor_utility_audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 branch TEXT NOT NULL COLLATE NOCASE,
 event TEXT NOT NULL,
 entity TEXT NOT NULL,
 entity_key TEXT NOT NULL,
 request_id TEXT NOT NULL UNIQUE,
 actor_email TEXT NOT NULL,
 details_json TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_debtor_utility_audit_branch ON maliks_pos_debtor_utility_audit(branch,id);
