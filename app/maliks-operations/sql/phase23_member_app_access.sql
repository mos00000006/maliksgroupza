-- Phase 23: audited per-employee application login authorisations.
-- Additive; Hub team_members and credential records are unchanged.
CREATE TABLE IF NOT EXISTS maliks_member_app_access (
  member_id INTEGER NOT NULL,
  app TEXT NOT NULL CHECK(app IN ('pos','management','tills','cashoffice','dispatch','member')),
  allowed INTEGER NOT NULL CHECK(allowed IN (0,1)),
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(member_id,app)
);
CREATE INDEX IF NOT EXISTS idx_maliks_member_app_access_member ON maliks_member_app_access(member_id);
CREATE TABLE IF NOT EXISTS maliks_member_app_access_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL UNIQUE,
  member_id INTEGER NOT NULL,
  member_email TEXT NOT NULL,
  branch TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  apps_json TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_maliks_member_app_access_audit_member
  ON maliks_member_app_access_audit(member_id,id DESC);
