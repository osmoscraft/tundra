CREATE TABLE IF NOT EXISTS File (
  path        TEXT PRIMARY KEY,
  content     TEXT NOT NULL,
  createdTime TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updatedTime TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TRIGGER IF NOT EXISTS FileTimestampTrigger AFTER UPDATE ON File FOR EACH ROW BEGIN
  UPDATE File SET updatedTime = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE path = old.path;
END;