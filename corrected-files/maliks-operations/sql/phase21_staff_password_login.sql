-- Phase 21: Native staff credentials and revocable, app-scoped sessions.
-- Existing Cloudflare Access authentication remains available during migration.
-- No password, temporary password or session bearer token is stored in plaintext.
CREATE TABLE IF NOT EXISTS maliks_pos_staff_credentials (
  member_id INTEGER PRIMARY KEY,
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  iterations INTEGER NOT NULL CHECK(iterations >= 600000),
  auth_version INTEGER NOT NULL DEFAULT 1,
  must_change INTEGER NOT NULL DEFAULT 1 CHECK(must_change IN (0,1)),
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS maliks_pos_staff_sessions (
  token_hash TEXT PRIMARY KEY,
  member_id INTEGER NOT NULL,
  app TEXT NOT NULL,
  auth_version INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS maliks_pos_staff_sessions_member_idx ON maliks_pos_staff_sessions(member_id);
CREATE INDEX IF NOT EXISTS maliks_pos_staff_sessions_expiry_idx ON maliks_pos_staff_sessions(expires_at);
CREATE TABLE IF NOT EXISTS maliks_pos_login_attempts (
  bucket TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_until INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS maliks_pos_password_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL UNIQUE,
  member_id INTEGER NOT NULL,
  member_email TEXT NOT NULL,
  branch TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('ISSUE_TEMPORARY','CHANGE_PASSWORD')),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS maliks_pos_password_audit_member_idx ON maliks_pos_password_audit(member_id,created_at DESC);
