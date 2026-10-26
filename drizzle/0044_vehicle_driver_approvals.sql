CREATE TABLE IF NOT EXISTS fleet_driver_permissions (
 employee_id INTEGER PRIMARY KEY, workspace TEXT NOT NULL,
 approved INTEGER NOT NULL DEFAULT 0 CHECK(approved IN (0,1)),
 reviewed_by TEXT NOT NULL, reviewed_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS fleet_driver_approval_audit (
 id TEXT PRIMARY KEY, employee_id INTEGER NOT NULL, workspace TEXT NOT NULL,
 approved INTEGER NOT NULL, reviewed_by TEXT NOT NULL, reviewed_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS fleet_driver_approval_branch ON fleet_driver_permissions(workspace,approved);
CREATE INDEX IF NOT EXISTS fleet_driver_approval_audit_branch ON fleet_driver_approval_audit(workspace,reviewed_at);
