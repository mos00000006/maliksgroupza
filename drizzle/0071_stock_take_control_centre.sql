-- Phase 61: Stock take counting/control only. No live POS or Hub balance posting.
CREATE TABLE IF NOT EXISTS stock_take_sessions (
 id TEXT PRIMARY KEY, reference TEXT UNIQUE NOT NULL, branch_name TEXT NOT NULL,
 department TEXT NOT NULL DEFAULT '', zone TEXT NOT NULL DEFAULT 'Entire branch',
 count_type TEXT NOT NULL DEFAULT 'Full' CHECK(count_type IN ('Full','Cycle')),
 status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Counting','Review','Approved','Cancelled')),
 created_by TEXT NOT NULL, created_at TEXT NOT NULL, started_at TEXT NOT NULL DEFAULT '',
 submitted_by TEXT NOT NULL DEFAULT '', submitted_at TEXT NOT NULL DEFAULT '',
 approved_by TEXT NOT NULL DEFAULT '', approved_at TEXT NOT NULL DEFAULT '',
 decision_note TEXT NOT NULL DEFAULT '', snapshot_source TEXT NOT NULL DEFAULT 'HUB_LEDGER', version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS stock_take_session_branch ON stock_take_sessions(branch_name,created_at DESC);
CREATE TABLE IF NOT EXISTS stock_take_assignments (
 session_id TEXT NOT NULL REFERENCES stock_take_sessions(id), email TEXT NOT NULL COLLATE NOCASE,
 assigned_by TEXT NOT NULL, assigned_at TEXT NOT NULL,
 PRIMARY KEY(session_id,email)
);
CREATE TABLE IF NOT EXISTS stock_take_lines (
 session_id TEXT NOT NULL REFERENCES stock_take_sessions(id), product_id INTEGER NOT NULL,
 code TEXT NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL DEFAULT '',
 expected_milli INTEGER, PRIMARY KEY(session_id,product_id)
);
CREATE TABLE IF NOT EXISTS stock_take_counts (
 session_id TEXT NOT NULL, product_id INTEGER NOT NULL, location_name TEXT NOT NULL,
 qty_milli INTEGER NOT NULL CHECK(qty_milli>=0 AND qty_milli<=1000000000),
 counted_by TEXT NOT NULL COLLATE NOCASE, counted_at TEXT NOT NULL,
 PRIMARY KEY(session_id,product_id,location_name),
 FOREIGN KEY(session_id,product_id) REFERENCES stock_take_lines(session_id,product_id)
);
CREATE TABLE IF NOT EXISTS stock_take_recounts (
 session_id TEXT NOT NULL, product_id INTEGER NOT NULL,
 qty_milli INTEGER NOT NULL CHECK(qty_milli>=0 AND qty_milli<=1000000000),
 recounted_by TEXT NOT NULL COLLATE NOCASE, recounted_at TEXT NOT NULL,
 reason TEXT NOT NULL, PRIMARY KEY(session_id,product_id),
 FOREIGN KEY(session_id,product_id) REFERENCES stock_take_lines(session_id,product_id)
);
CREATE TABLE IF NOT EXISTS stock_take_audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, event_type TEXT NOT NULL,
 actor_email TEXT NOT NULL, product_id INTEGER, location_name TEXT NOT NULL DEFAULT '',
 qty_milli INTEGER, note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS stock_take_audit_session ON stock_take_audit(session_id,id DESC);
CREATE TRIGGER IF NOT EXISTS stock_take_audit_no_update BEFORE UPDATE ON stock_take_audit
BEGIN SELECT RAISE(ABORT,'Stock take audit immutable'); END;
CREATE TRIGGER IF NOT EXISTS stock_take_audit_no_delete BEFORE DELETE ON stock_take_audit
BEGIN SELECT RAISE(ABORT,'Stock take audit immutable'); END;
CREATE TRIGGER IF NOT EXISTS stock_take_lines_no_update BEFORE UPDATE ON stock_take_lines
BEGIN SELECT RAISE(ABORT,'Stock take snapshot immutable'); END;
CREATE TRIGGER IF NOT EXISTS stock_take_lines_no_delete BEFORE DELETE ON stock_take_lines
BEGIN SELECT RAISE(ABORT,'Stock take snapshot immutable'); END;
CREATE TRIGGER IF NOT EXISTS stock_take_session_no_delete BEFORE DELETE ON stock_take_sessions
BEGIN SELECT RAISE(ABORT,'Stock take session immutable'); END;
CREATE TRIGGER IF NOT EXISTS stock_take_status_guard BEFORE UPDATE OF status ON stock_take_sessions
WHEN NOT ((OLD.status='Draft' AND NEW.status IN ('Counting','Cancelled')) OR
          (OLD.status='Counting' AND NEW.status IN ('Review','Cancelled')) OR
          (OLD.status='Review' AND NEW.status IN ('Counting','Approved','Cancelled')))
BEGIN SELECT RAISE(ABORT,'Invalid stock take status transition'); END;

-- Prevent writing counts or recounts after stage closure, even if an API race occurs.
CREATE TRIGGER IF NOT EXISTS stock_take_count_insert_guard BEFORE INSERT ON stock_take_counts
WHEN (SELECT status FROM stock_take_sessions WHERE id=NEW.session_id)<>'Counting'
BEGIN SELECT RAISE(ABORT,'Stock take not open for counting'); END;
CREATE TRIGGER IF NOT EXISTS stock_take_count_update_guard BEFORE UPDATE ON stock_take_counts
WHEN (SELECT status FROM stock_take_sessions WHERE id=NEW.session_id)<>'Counting'
BEGIN SELECT RAISE(ABORT,'Stock take not open for counting'); END;
CREATE TRIGGER IF NOT EXISTS stock_take_recount_insert_guard BEFORE INSERT ON stock_take_recounts
WHEN (SELECT status FROM stock_take_sessions WHERE id=NEW.session_id)<>'Review'
BEGIN SELECT RAISE(ABORT,'Stock take not open for recount'); END;
CREATE TRIGGER IF NOT EXISTS stock_take_recount_no_update BEFORE UPDATE ON stock_take_recounts
BEGIN SELECT RAISE(ABORT,'Recount is immutable'); END;
