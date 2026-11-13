-- Phase 20: controlled stock adjustments, physical stocktakes and opening counts.
-- Operational quantity movements only. No VAT, cost of sales, AP, GL or financial valuation posting.
CREATE TABLE IF NOT EXISTS maliks_pos_stock_control_docs (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 branch TEXT NOT NULL COLLATE NOCASE,
 doc_type TEXT NOT NULL CHECK(doc_type IN ('ADJUSTMENT','STOCKTAKE','OPENING')),
 reason TEXT NOT NULL,
 lines_json TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','POSTED','CANCELLED')),
 version INTEGER NOT NULL DEFAULT 1 CHECK(version>0),
 created_by_email TEXT NOT NULL,
 approved_by_email TEXT,
 cancelled_by_email TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 create_request_id TEXT NOT NULL UNIQUE,
 create_hash TEXT NOT NULL,
 last_request_id TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_stock_control_docs_branch ON maliks_pos_stock_control_docs(branch,id DESC);
CREATE TABLE IF NOT EXISTS maliks_pos_stock_control_audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 request_id TEXT NOT NULL UNIQUE,
 doc_id INTEGER NOT NULL,
 branch TEXT NOT NULL COLLATE NOCASE,
 action TEXT NOT NULL CHECK(action IN ('CREATE','POST','CANCEL')),
 actor_email TEXT NOT NULL,
 payload_hash TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS maliks_pos_stock_control_movements (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 doc_id INTEGER NOT NULL,
 branch TEXT NOT NULL COLLATE NOCASE,
 stock_master_id INTEGER NOT NULL,
 quantity_delta_milli INTEGER NOT NULL CHECK(quantity_delta_milli!=0),
 movement_type TEXT NOT NULL CHECK(movement_type IN ('ADJUSTMENT','STOCKTAKE','OPENING')),
 actor_email TEXT NOT NULL,
 created_at TEXT NOT NULL,
 UNIQUE(doc_id,stock_master_id)
);
CREATE INDEX IF NOT EXISTS idx_maliks_pos_stock_control_movements ON maliks_pos_stock_control_movements(branch,stock_master_id,id DESC);
