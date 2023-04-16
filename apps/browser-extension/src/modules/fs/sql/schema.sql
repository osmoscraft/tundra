CREATE TABLE IF NOT EXISTS File (
  path       TEXT PRIMARY KEY,
  type       TEXT,
  content    TEXT NOT NULL,
  createdAt  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updatedAt  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TRIGGER IF NOT EXISTS FileTimestampTrigger AFTER UPDATE ON File FOR EACH ROW BEGIN
  UPDATE File SET updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE path = old.path;
END;