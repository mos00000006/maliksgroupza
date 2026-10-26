CREATE TABLE IF NOT EXISTS fleet_vehicles (
 id TEXT PRIMARY KEY, registration TEXT NOT NULL COLLATE NOCASE UNIQUE,
 label TEXT NOT NULL, workspace TEXT NOT NULL, token TEXT NOT NULL UNIQUE,
 odometer INTEGER NOT NULL DEFAULT 0 CHECK(odometer>=0), active INTEGER NOT NULL DEFAULT 1,
 created_by TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS fleet_vehicles_workspace ON fleet_vehicles(workspace,active);
CREATE TABLE IF NOT EXISTS fleet_sessions (
 token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL, credential_hash TEXT NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS fleet_sessions_account ON fleet_sessions(account_id);
CREATE TABLE IF NOT EXISTS fleet_trips (
 id TEXT PRIMARY KEY, vehicle_id TEXT NOT NULL, account_id TEXT NOT NULL,
 driver_name TEXT NOT NULL, employee_number TEXT NOT NULL, home_workspace TEXT NOT NULL,
 workspace TEXT NOT NULL, destination TEXT NOT NULL, purpose TEXT NOT NULL,
 start_km INTEGER NOT NULL CHECK(start_km>=0), end_km INTEGER CHECK(end_km>=start_km),
 checkout_at TEXT NOT NULL, returned_at TEXT, checkout_notes TEXT NOT NULL DEFAULT '',
 return_notes TEXT NOT NULL DEFAULT '', closed_by TEXT NOT NULL DEFAULT '', request_key TEXT NOT NULL,
 UNIQUE(account_id,request_key)
);
CREATE UNIQUE INDEX IF NOT EXISTS fleet_one_trip_per_vehicle ON fleet_trips(vehicle_id) WHERE returned_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS fleet_one_trip_per_driver ON fleet_trips(account_id) WHERE returned_at IS NULL;
CREATE INDEX IF NOT EXISTS fleet_trips_workspace_date ON fleet_trips(workspace,checkout_at);
CREATE INDEX IF NOT EXISTS fleet_trips_home_date ON fleet_trips(home_workspace,checkout_at);
