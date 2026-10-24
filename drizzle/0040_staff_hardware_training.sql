CREATE TABLE IF NOT EXISTS staff_training_attempts (
 id TEXT PRIMARY KEY,
 email TEXT NOT NULL,
 staff_name TEXT NOT NULL,
 brand TEXT NOT NULL CHECK (brand IN ('powerbuild','busterbuild')),
 topic TEXT NOT NULL,
 bank_version TEXT NOT NULL,
 questions_json TEXT NOT NULL,
 answers_json TEXT,
 correct INTEGER,
 total INTEGER NOT NULL,
 passed INTEGER,
 started_at TEXT NOT NULL,
 submitted_at TEXT
);
CREATE INDEX IF NOT EXISTS staff_training_email_started ON staff_training_attempts(email,started_at DESC);
CREATE INDEX IF NOT EXISTS staff_training_submitted ON staff_training_attempts(submitted_at DESC);
