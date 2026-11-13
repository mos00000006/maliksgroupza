-- Phase 19: auditable, branch-scoped employee lifecycle.
-- Existing Hub team_members and workspaces remain the source of truth.
-- No deletion of staff or alterations to historical Hub records.
CREATE TABLE IF NOT EXISTS maliks_member_team_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('CREATE','DEACTIVATE','REACTIVATE')),
  member_id INTEGER NOT NULL,
  member_email TEXT NOT NULL,
  branch TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  before_json TEXT NOT NULL,
  after_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS maliks_member_team_audit_branch_idx
  ON maliks_member_team_audit(branch,created_at DESC);
CREATE INDEX IF NOT EXISTS maliks_member_team_audit_member_idx
  ON maliks_member_team_audit(member_id,created_at DESC);
