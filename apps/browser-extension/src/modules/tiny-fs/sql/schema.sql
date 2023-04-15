CREATE TABLE IF NOT EXISTS File (
  path       TEXT PRIMARY KEY,
  type       TEXT,
  content    TEXT NOT NULL,
  createdAt  TEXT,
  updatedAt  TEXT
);
