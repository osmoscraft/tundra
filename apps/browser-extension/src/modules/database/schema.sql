CREATE TABLE IF NOT EXISTS File (
  path TEXT PRIMARY KEY,
  localContent TEXT,
  localUpdatedTime TEXT,
  remoteContent TEXT,
  remoteUpdatedTime TEXT,

  /* Drived columns */
  updatedTime TEXT GENERATED ALWAYS AS (
    CASE
      WHEN ifnull(localUpdatedTime, 0) > ifnull(remoteUpdatedTime, 0) THEN localUpdatedTime
      ELSE remoteUpdatedTime
    END
  ),
  content TEXT GENERATED ALWAYS AS (
    CASE
      WHEN ifnull(localUpdatedTime, 0) > ifnull(remoteUpdatedTime, 0) THEN localContent
      ELSE remoteContent
    END
  ),
  isDeleted INTEGER GENERATED ALWAYS AS (content IS NULL),
  isDirty INTEGER GENERATED ALWAYS AS (content IS NOT remoteContent)
);

CREATE TABLE IF NOT EXISTS Object (
  path TEXT PRIMARY KEY,
  data TEXT
);

CREATE TABLE IF NOT EXISTS Node (
  data  TEXT,
  -- virtual columns from JSON extractions
  path  TEXT GENERATED ALWAYS AS (json_extract(data, '$.path')) NOT NULL UNIQUE,
  title TEXT GENERATED ALWAYS AS (json_extract(data, '$.title')) NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS NodeFts USING fts5(path, title, content=Node);

CREATE TRIGGER IF NOT EXISTS NodeFtsAfterInsertTrigger AFTER INSERT ON Node BEGIN
    INSERT INTO NodeFts(rowid, path, title)
    VALUES (new.rowid, new.path, new.title);
END;

CREATE TRIGGER IF NOT EXISTS NodeFtsAfterDeleteTrigger AFTER DELETE ON Node BEGIN
  INSERT INTO NodeFts(NodeFts, rowid, path, title)
  VALUES('delete', old.rowid, old.path, old.title);
END;

CREATE TRIGGER IF NOT EXISTS NodeFtsAfterUpdateTrigger AFTER UPDATE ON Node BEGIN
  INSERT INTO NodeFts( NodeFts, rowid, path, title)
  VALUES('delete', old.rowid, old.path, old.title);
  INSERT INTO NodeFts(rowid, path, title)
  VALUES (new.rowid, new.path, new.title);
END;