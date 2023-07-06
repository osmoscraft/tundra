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

  local TEXT,
  remote TEXT,
  synced TEXT,


  /* Derived columns */
  status INTEGER NOT NULL GENERATED ALWAYS AS (
    /*
     * Bit mask NULL=0, NOT NULL=1  [local, remote]
     * (T) status are transient and should be resolved by trigger
     */
    CASE
      WHEN local IS NULL AND remote IS NULL THEN 0 -- Synced
      WHEN local IS NULL AND remote IS NOT NULL THEN 1 -- Behind
      WHEN local IS NOT NULL AND remote IS NULL THEN 2 -- Ahead
      WHEN local IS NOT NULL AND remote IS NOT NULL THEN 3 -- Conflict
    END
  ),

  source TEXT GENERATED ALWAYS AS (ifnull(local, synced)),
  content TEXT GENERATED ALWAYS AS (source ->> '$.content'),
  meta TEXT GENERATED ALWAYS AS (source ->> '$.meta')
);

CREATE TRIGGER IF NOT EXISTS FileV2AfterInsertTrigger AFTER INSERT ON FileV2 BEGIN
  -- Clear outdated local
  UPDATE FileV2 SET local = NULL WHERE path = new.path AND synced ->> '$.updatedAt' >= local ->> '$.updatedAt';
  -- Clear outdated remote
  UPDATE FileV2 SET remote = NULL WHERE path = new.path AND synced ->> '$.updatedAt' >= remote ->> '$.updatedAt';

  -- Auto merge local
  UPDATE FileV2 SET local = NULL WHERE path = new.path AND (
    ((remote IS NULL OR local ->> '$.updatedAt' <= remote ->> '$.updatedAt') AND local ->> '$.content' IS synced ->> '$.content') OR -- merge with synced
    (local -> '$.content' = remote -> '$.content') -- merge with remote
  );

  -- Auto merge remote
  UPDATE FileV2 SET synced = remote, remote = NULL WHERE path = new.path AND
    (local IS NULL OR remote ->> '$.updatedAt' <= local ->> '$.updatedAt') AND (remote ->> '$.content' IS synced ->> '$.content');  -- merge with synced

  -- Clear outdated local again in case remote is merged
  UPDATE FileV2 SET local = NULL WHERE path = new.path AND synced ->> '$.updatedAt' >= local ->> '$.updatedAt';

  -- Clear synced when it is null
  UPDATE FileV2 SET synced = NULL WHERE path = new.path AND synced ->> '$.content' IS NULL;

  -- Delete record when all fields are NULL
  DELETE FROM FileV2 WHERE path = new.path AND local IS NULL AND remote IS NULL AND synced IS NULL;
END;

CREATE TRIGGER IF NOT EXISTS FileV2AfterUpdateTrigger AFTER UPDATE ON FileV2 BEGIN
  -- Clear outdated local
  UPDATE FileV2 SET local = NULL WHERE path = new.path AND synced ->> '$.updatedAt' >= local ->> '$.updatedAt';
  -- Clear outdated remote
  UPDATE FileV2 SET remote = NULL WHERE path = new.path AND synced ->> '$.updatedAt' >= remote ->> '$.updatedAt';

  -- Auto merge local
  UPDATE FileV2 SET local = NULL WHERE path = new.path AND (
    ((remote IS NULL OR local ->> '$.updatedAt' <= remote ->> '$.updatedAt') AND local ->> '$.content' IS synced ->> '$.content') OR -- merge with synced
    (local -> '$.content' = remote -> '$.content') -- merge with remote
  );

  -- Auto merge remote
  UPDATE FileV2 SET synced = remote, remote = NULL WHERE path = new.path AND
    (local IS NULL OR remote ->> '$.updatedAt' <= local ->> '$.updatedAt') AND (remote ->> '$.content' IS synced ->> '$.content');  -- merge with synced

  -- Clear outdated local again in case remote is merged
  UPDATE FileV2 SET local = NULL WHERE path = new.path AND synced ->> '$.updatedAt' >= local ->> '$.updatedAt';

  -- Clear synced when it is null
  UPDATE FileV2 SET synced = NULL WHERE path = new.path AND synced ->> '$.content' IS NULL;

  -- Delete record when all fields are NULL
  DELETE FROM FileV2 WHERE path = new.path AND local IS NULL AND remote IS NULL AND synced IS NULL;
END;


