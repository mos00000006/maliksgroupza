-- Phase 39: Non-posting operational supplier month-end reviews. NO financial close or period lock.
CREATE TABLE IF NOT EXISTS maliks_pos_supplier_month_end_reviews (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 branch TEXT NOT NULL COLLATE NOCASE,
 period TEXT NOT NULL CHECK(length(period)=7),
 status TEXT NOT NULL DEFAULT 'OPERATIONAL_REVIEW_ONLY' CHECK(status='OPERATIONAL_REVIEW_ONLY'),
 pending_count INTEGER NOT NULL CHECK(pending_count=0),
 total_count INTEGER NOT NULL CHECK(total_count>=0),
 review_note TEXT NOT NULL,
 reviewed_by TEXT NOT NULL,
 reviewed_at TEXT NOT NULL,
 request_id TEXT NOT NULL UNIQUE,
 UNIQUE(branch,period)
);
CREATE INDEX IF NOT EXISTS idx_supplier_monthend_branch_period ON maliks_pos_supplier_month_end_reviews(branch,period DESC);
