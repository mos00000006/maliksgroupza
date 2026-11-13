-- Phase 21b: Cloudflare-compatible PBKDF2 credential storage.
-- Cloudflare Workers limits a single WebCrypto PBKDF2 operation to 100,000
-- iterations. The original Phase 21 table requires >=600,000, so it cannot
-- store hashes produced by the Worker. This migration is ADDITIVE: keep the
-- original credentials table untouched for audit/rollback; the Core Worker
-- uses the new table exclusively.
-- Existing 600,000-iteration hashes cannot be verified by the deployed Worker.
-- Administrators must set their own password again; managers must reissue
-- temporary passwords to affected employees.
CREATE TABLE IF NOT EXISTS maliks_pos_staff_credentials_v2 (
  member_id INTEGER PRIMARY KEY,
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  iterations INTEGER NOT NULL CHECK(iterations = 100000),
  auth_version INTEGER NOT NULL DEFAULT 1,
  must_change INTEGER NOT NULL DEFAULT 1 CHECK(must_change IN (0,1)),
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);
