-- FILE
CREATE TABLE IF NOT EXISTS File (
  path TEXT PRIMARY KEY,
  localContent TEXT,
  localUpdatedTime TEXT,
  remoteContent TEXT,
  remoteUpdatedTime TEXT,
  meta TEXT,

  /* Drived columns */
  content TEXT GENERATED ALWAYS AS (
    CASE
      WHEN ifnull(localUpdatedTime, 0) > ifnull(remoteUpdatedTime, 0) THEN localContent
      ELSE remoteContent
    END
  ),
  -- TODO future columns
  -- title TEXT GENERATED ALWAYS AS (json_extract(meta, '$.title')),
  -- feedURL...
  -- targetLinks...
  -- tags...
  isDeleted INTEGER GENERATED ALWAYS AS (content IS NULL),
  isDirty INTEGER GENERATED ALWAYS AS (content IS NOT remoteContent),
  updatedTime TEXT GENERATED ALWAYS AS (
    CASE
      WHEN ifnull(localUpdatedTime, 0) > ifnull(remoteUpdatedTime, 0) THEN localUpdatedTime
      ELSE remoteUpdatedTime
    END
  )
);

CREATE INDEX IF NOT EXISTS FileUpdatedTimeIdx ON File(updatedTime);

CREATE VIRTUAL TABLE IF NOT EXISTS FileFts USING fts5(path, content, meta, content=File);

CREATE TRIGGER IF NOT EXISTS FileFtsAfterInsertTrigger AFTER INSERT ON File BEGIN
    INSERT INTO FileFts(rowid, path, content, meta)
    VALUES (new.rowid, new.path, new.content, new.meta);
END;

CREATE TRIGGER IF NOT EXISTS FileFtsAfterDeleteTrigger AFTER DELETE ON File BEGIN
  INSERT INTO FileFts(FileFts, rowid, path, content, meta)
  VALUES('delete', old.rowid, old.path, old.content, old.meta);
END;

CREATE TRIGGER IF NOT EXISTS FileFtsAfterUpdateTrigger AFTER UPDATE ON File BEGIN
  INSERT INTO FileFts( FileFts, rowid, path, content, meta)
  VALUES('delete', old.rowid, old.path, old.content, old.meta);
  INSERT INTO FileFts(rowid, path, content, meta)
  VALUES (new.rowid, new.path, new.content, new.meta);
END;

-- Object
CREATE TABLE IF NOT EXISTS Object (
  path TEXT PRIMARY KEY,
  data TEXT
);
