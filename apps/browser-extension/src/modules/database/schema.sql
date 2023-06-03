CREATE TABLE IF NOT EXISTS File (
  path        TEXT PRIMARY KEY,
  content     TEXT,
  updatedTime INTEGER NOT NULL,
  localHash   TEXT,
  remoteHash  TEXT,
  isDeleted INTEGER GENERATED ALWAYS AS (content IS NULL),
  isDirty INTEGER GENERATED ALWAYS AS (localHash IS NOT remoteHash)
);

CREATE TABLE IF NOT EXISTS Object (
  path TEXT PRIMARY KEY,
  data TEXT
);
