CREATE TABLE IF NOT EXISTS File (
  path        TEXT PRIMARY KEY,
  content     TEXT,
  updatedTime INTEGER NOT NULL,
  localHash   TEXT,
  remoteHash  TEXT,
  /* 0: clean, 1: dirty */
  isDirty INTEGER GENERATED ALWAYS AS (localHash IS NOT remoteHash)
);
