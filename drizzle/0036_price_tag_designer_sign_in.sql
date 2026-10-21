CREATE TABLE IF NOT EXISTS price_tag_designer_accounts (
 username_key TEXT PRIMARY KEY NOT NULL,
 display_name TEXT NOT NULL,
 password_salt TEXT NOT NULL,
 password_hash TEXT NOT NULL,
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1))
);
CREATE TABLE IF NOT EXISTS price_tag_designer_sessions (
 token_hash TEXT PRIMARY KEY NOT NULL,
 hub_email TEXT NOT NULL,
 username_key TEXT NOT NULL REFERENCES price_tag_designer_accounts(username_key),
 expires_at INTEGER NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS price_tag_designer_session_expiry ON price_tag_designer_sessions(expires_at);
CREATE TABLE IF NOT EXISTS price_tag_designer_login_attempts (
 hub_email TEXT PRIMARY KEY NOT NULL,
 attempts INTEGER NOT NULL,
 window_started INTEGER NOT NULL
);
INSERT OR IGNORE INTO price_tag_designer_accounts (username_key,display_name,password_salt,password_hash) VALUES ('moses moyana','Moses Moyana','903246cf100bad0a88d5f4e8395c3196','6a550d401942845e60ae71f37a49e8748203eee9b0dc9c7aa981c2dcb33811f0');
