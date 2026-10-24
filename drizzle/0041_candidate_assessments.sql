CREATE TABLE IF NOT EXISTS candidate_assessments (
 id TEXT PRIMARY KEY, candidate_name TEXT NOT NULL, email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', position_applied TEXT NOT NULL, reference TEXT NOT NULL DEFAULT '', kind TEXT NOT NULL CHECK(kind IN ('candidate','staff')), brand TEXT NOT NULL CHECK(brand IN ('powerbuild','busterbuild')), topic TEXT NOT NULL, bank_version TEXT NOT NULL, questions_json TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, session_hash TEXT, status TEXT NOT NULL DEFAULT 'ready' CHECK(status IN ('ready','running','submitted','interrupted')), consented_at TEXT, started_at TEXT, submitted_at TEXT, link_expires_at TEXT NOT NULL, retention_until TEXT NOT NULL, created_at TEXT NOT NULL, created_by TEXT NOT NULL, answers_json TEXT, correct INTEGER, total INTEGER NOT NULL, passed INTEGER, events_json TEXT NOT NULL DEFAULT '[]', mime_type TEXT NOT NULL DEFAULT 'video/webm', chunk_count INTEGER NOT NULL DEFAULT 0, total_bytes INTEGER NOT NULL DEFAULT 0, last_chunk_at TEXT
);
CREATE INDEX IF NOT EXISTS candidate_assessments_retention ON candidate_assessments(retention_until);
CREATE INDEX IF NOT EXISTS candidate_assessments_running ON candidate_assessments(status,started_at);
CREATE INDEX IF NOT EXISTS candidate_assessments_created ON candidate_assessments(created_at DESC);
CREATE TABLE IF NOT EXISTS candidate_assessment_chunks (
 assessment_id TEXT NOT NULL, seq INTEGER NOT NULL, object_key TEXT NOT NULL UNIQUE, bytes INTEGER NOT NULL, digest TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(assessment_id,seq)
);
