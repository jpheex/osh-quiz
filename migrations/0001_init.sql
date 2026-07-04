CREATE TABLE IF NOT EXISTS user_data (
  user_id TEXT PRIMARY KEY,
  progress_json TEXT NOT NULL,
  session_json TEXT,
  app_version TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_data_updated_at ON user_data(updated_at);
