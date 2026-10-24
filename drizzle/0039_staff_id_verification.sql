CREATE TABLE IF NOT EXISTS staff_id_verifications (
 token TEXT PRIMARY KEY NOT NULL,
 brand TEXT NOT NULL CHECK(brand IN ('powerbuild','busterbuild')),
 employee_id TEXT NOT NULL COLLATE NOCASE,
 name TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT '',
 department TEXT NOT NULL DEFAULT '',
 branch TEXT NOT NULL DEFAULT '',
 start_date TEXT NOT NULL DEFAULT '',
 expiry TEXT NOT NULL DEFAULT '',
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
 photo_key TEXT NOT NULL,
 photo_zoom REAL NOT NULL DEFAULT 100 CHECK(photo_zoom BETWEEN 100 AND 200),
 photo_position REAL NOT NULL DEFAULT 50 CHECK(photo_position BETWEEN 0 AND 100),
 version INTEGER NOT NULL DEFAULT 1,
 updated_by TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 UNIQUE(brand,employee_id)
);
CREATE INDEX IF NOT EXISTS staff_id_verifications_brand_updated ON staff_id_verifications(brand,updated_at DESC);
