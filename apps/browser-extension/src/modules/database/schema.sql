CREATE TABLE IF NOT EXISTS File (
  path TEXT PRIMARY KEY,
  localContent TEXT,
  localUpdatedAt INTEGER,
  remoteContent TEXT,
  remoteUpdatedAt INTEGER,
  meta TEXT,

  /* Drived columns */
  content TEXT GENERATED ALWAYS AS (
    CASE
      WHEN ifnull(localUpdatedAt, 0) > ifnull(remoteUpdatedAt, 0) THEN localContent
      ELSE remoteContent
    END
  ),
  isDeleted INTEGER GENERATED ALWAYS AS (content IS NULL),
  isDirty INTEGER GENERATED ALWAYS AS (content IS NOT remoteContent),
  updatedAt INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN ifnull(localUpdatedAt, 0) > ifnull(remoteUpdatedAt, 0) THEN localUpdatedAt
      ELSE remoteUpdatedAt
    END
  )
);

CREATE INDEX IF NOT EXISTS IsDirtyIdx ON File(isDirty);
CREATE INDEX IF NOT EXISTS UpdatedAtIdx ON File(updatedAt);

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

CREATE TABLE IF NOT EXISTS FileV2 (
  path TEXT PRIMARY KEY,
  localContent TEXT,
  localUpdatedAt INTEGER,
  remoteContent TEXT,
  remoteUpdatedAt INTEGER,
  baseContent TEXT,
  baseUpdatedAt INTEGER,
  meta TEXT,

  /* Derived columns */
  status INTEGER GENERATED ALWAYS AS (
    /* Bit mask NULL=0, NOT NULL=1  [localUpdated, remoteUpdated, baseUpdated] */
    CASE
      WHEN localUpdatedAt IS NULL AND remoteUpdatedAt IS NULL AND baseUpdatedAt IS NULL THEN 0
      WHEN localUpdatedAt IS NULL AND remoteUpdatedAt IS NULL AND baseUpdatedAt IS NOT NULL THEN 1
      WHEN localUpdatedAt IS NULL AND remoteUpdatedAt IS NOT NULL AND baseUpdatedAt IS NULL THEN 2
      WHEN localUpdatedAt IS NULL AND remoteUpdatedAt IS NOT NULL AND baseUpdatedAt IS NOT NULL THEN 3
      WHEN localUpdatedAt IS NOT NULL AND remoteUpdatedAt IS NULL AND baseUpdatedAt IS NULL THEN 4
      WHEN localUpdatedAt IS NOT NULL AND remoteUpdatedAt IS NULL AND baseUpdatedAt IS NOT NULL THEN 5
      WHEN localUpdatedAt IS NOT NULL AND remoteUpdatedAt IS NOT NULL AND baseUpdatedAt IS NULL THEN 6
      WHEN localUpdatedAt IS NOT NULL AND remoteUpdatedAt IS NOT NULL AND baseUpdatedAt IS NOT NULL THEN 7
    END
  )
);

/* When localUpdatedAt only and localContent is null -> delete row */
CREATE TRIGGER IF NOT EXISTS FileV2BeforeInsertTrigger AFTER INSERT ON FileV2 BEGIN
  DELETE FROM FileV2 WHERE path = new.path AND new.status = 4 AND new.localContent IS NULL;
END;