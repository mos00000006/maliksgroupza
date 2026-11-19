-- Phase 54: Back Office reference master files. Non-posting setup only.
CREATE TABLE IF NOT EXISTS maliks_backoffice_master (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 branch TEXT NOT NULL,
 kind TEXT NOT NULL CHECK (kind IN ('till','drawing_expense','payment_type','coinage','free_voucher_reference')),
 code TEXT NOT NULL COLLATE NOCASE,
 name TEXT NOT NULL,
 notes TEXT NOT NULL DEFAULT '',
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN(0,1)),
 version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
 updated_by TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 UNIQUE(branch,kind,code)
);
CREATE INDEX IF NOT EXISTS maliks_backoffice_master_branch_kind ON maliks_backoffice_master(branch,kind,active);
CREATE TABLE IF NOT EXISTS maliks_backoffice_master_audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 request_id TEXT NOT NULL UNIQUE,
 request_hash TEXT NOT NULL,
 branch TEXT NOT NULL,
 kind TEXT NOT NULL,
 master_id INTEGER NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('CREATE','UPDATE')),
 actor_email TEXT NOT NULL,
 created_at TEXT NOT NULL,
 before_json TEXT,
 after_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS maliks_backoffice_master_audit_branch_kind ON maliks_backoffice_master_audit(branch,kind,id DESC);
