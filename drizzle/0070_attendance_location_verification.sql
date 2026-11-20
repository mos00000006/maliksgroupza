-- One-time additive migration. Existing clock history and HR records remain unchanged.
ALTER TABLE attendance_events ADD COLUMN scan_latitude REAL;
ALTER TABLE attendance_events ADD COLUMN scan_longitude REAL;
-- Rejected scan attempts are NOT successful attendance or payroll records.
CREATE TABLE IF NOT EXISTS attendance_location_rejections (
 id TEXT PRIMARY KEY,
 branch_id TEXT NOT NULL,
 account_id TEXT NOT NULL,
 employee_id INTEGER NOT NULL,
 workspace TEXT NOT NULL,
 action TEXT NOT NULL,
 attempted_at TEXT NOT NULL,
 attendance_date TEXT NOT NULL,
 location_status TEXT NOT NULL,
 distance_m INTEGER,
 accuracy_m INTEGER,
 scan_latitude REAL,
 scan_longitude REAL
);
CREATE INDEX IF NOT EXISTS attendance_location_rejections_branch_day
 ON attendance_location_rejections(workspace,attendance_date,attempted_at);
CREATE INDEX IF NOT EXISTS attendance_location_rejections_retention
 ON attendance_location_rejections(attempted_at);
