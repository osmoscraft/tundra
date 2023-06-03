CREATE TABLE IF NOT EXISTS File (
  path TEXT PRIMARY KEY,
  content TEXT,
  updatedTime TEXT NOT NULL,
  remoteUpdatedTime  TEXT,
  isDeleted INTEGER GENERATED ALWAYS AS (content IS NULL),
  isDirty INTEGER GENERATED ALWAYS AS (updatedTime > ifnull(remoteUpdatedTime, 0))
);

CREATE TABLE IF NOT EXISTS Object (
  path TEXT PRIMARY KEY,
  data TEXT
);
