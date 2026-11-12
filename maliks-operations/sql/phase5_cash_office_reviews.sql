-- Maliks Operations Phase 5: add immutable review history for cash counts.
-- Additive only. Does not alter existing shift or quotation records.
-- Review never means payment received, cash-up balanced or deposit approved.
CREATE TABLE IF NOT EXISTS maliks_till_shift_reviews (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 request_id TEXT NOT NULL UNIQUE,
 shift_id INTEGER NOT NULL REFERENCES maliks_till_shift_register(id),
 branch TEXT NOT NULL,
 decision TEXT NOT NULL CHECK(decision IN ('CHECKED_DECLARATION','FLAGGED_FOR_FOLLOWUP')),
 note TEXT NOT NULL DEFAULT '' CHECK(length(note)<=400),
 reviewed_by_email TEXT NOT NULL,
 reviewed_by_name TEXT NOT NULL,
 created_at TEXT NOT NULL,
 CHECK(decision<>'FLAGGED_FOR_FOLLOWUP' OR length(trim(note))>=10)
);
CREATE INDEX IF NOT EXISTS idx_maliks_cash_office_review_history
 ON maliks_till_shift_reviews(shift_id,id DESC);
CREATE INDEX IF NOT EXISTS idx_maliks_cash_office_review_by_branch
 ON maliks_till_shift_reviews(lower(branch),shift_id,id DESC);
