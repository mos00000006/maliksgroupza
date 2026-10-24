CREATE TABLE IF NOT EXISTS attendance_branches (
 id TEXT PRIMARY KEY, workspace TEXT NOT NULL UNIQUE, token TEXT NOT NULL UNIQUE,
 latitude REAL NOT NULL, longitude REAL NOT NULL, radius INTEGER NOT NULL DEFAULT 300,
 active INTEGER NOT NULL DEFAULT 1, created_by TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS attendance_accounts (
 id TEXT PRIMARY KEY, branch_id TEXT NOT NULL, employee_number TEXT NOT NULL COLLATE NOCASE,
 first_name TEXT NOT NULL, last_name TEXT NOT NULL, phone TEXT NOT NULL, job_title TEXT NOT NULL DEFAULT '',
 salt TEXT NOT NULL, pin_hash TEXT NOT NULL, employee_id INTEGER,
 status TEXT NOT NULL DEFAULT 'pending', reviewed_by TEXT, reviewed_at TEXT,
 state TEXT NOT NULL DEFAULT 'out', last_event TEXT, version INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL, UNIQUE(branch_id,employee_number)
);
CREATE INDEX IF NOT EXISTS attendance_accounts_branch ON attendance_accounts(branch_id,status);
CREATE TABLE IF NOT EXISTS attendance_sessions (
 token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS attendance_sessions_account ON attendance_sessions(account_id);
CREATE TABLE IF NOT EXISTS attendance_events (
 id TEXT PRIMARY KEY, account_id TEXT NOT NULL, employee_id INTEGER NOT NULL, workspace TEXT NOT NULL,
 action TEXT NOT NULL, occurred_at TEXT NOT NULL, attendance_date TEXT NOT NULL,
 location_status TEXT NOT NULL, distance_m INTEGER, accuracy_m INTEGER, request_key TEXT NOT NULL,
 UNIQUE(account_id,request_key)
);
CREATE INDEX IF NOT EXISTS attendance_events_workspace_date ON attendance_events(workspace,attendance_date,occurred_at);
CREATE INDEX IF NOT EXISTS attendance_events_account ON attendance_events(account_id,occurred_at);
CREATE TABLE IF NOT EXISTS attendance_rate_limits (key TEXT PRIMARY KEY, window INTEGER NOT NULL, count INTEGER NOT NULL);
