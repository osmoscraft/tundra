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
  /* 0: Synced */
  -- Delete row when content is null
  DELETE FROM FileV2 WHERE path = new.path AND new.status = 0 AND new.content IS NULL;

  /* 1: Behind */
  -- Move remote to synced when remote.content is the same as synced.content and is not null
  UPDATE FileV2 SET synced = remote, remote = NULL WHERE path = new.path AND new.status = 1 AND remote ->> '$.content' = synced ->> '$.content';
  -- Delete row when remote.content and synced.content are both is null
  DELETE FROM FileV2 WHERE path = new.path AND new.status = 1 AND remote ->> '$.content' IS NULL AND synced ->> '$.content' IS NULL;

  /* 2: Ahead */
  -- Clear local when local.content is the same as synced.content and is not null
  UPDATE FileV2 SET local = NULL WHERE path = new.path AND new.status = 2 AND local ->> '$.content' = synced ->> '$.content'; 
  -- Delete row when local.content and synced.content are both is null
  DELETE FROM FileV2 WHERE path = new.path AND new.status = 2 AND local ->> '$.content' IS NULL AND synced ->> '$.content' IS NULL;

  /* 3: Conflict */
  -- Clear local when local.content is the same as synced.content
  UPDATE FileV2 SET local = NULL WHERE path = new.path AND new.status = 3 AND local ->> '$.content' IS synced ->> '$.content';
  -- Clear local when local.content is the same as remote.content
  UPDATE FileV2 SET local = NULL WHERE path = new.path AND new.status = 3 AND local ->> '$.content' IS remote ->> '$.content';

END;

CREATE TRIGGER IF NOT EXISTS FileV2AfterUpdateTrigger AFTER UPDATE ON FileV2 BEGIN
  /* 0: Synced */
  -- Delete row when content is null
  DELETE FROM FileV2 WHERE path = new.path AND new.status = 0 AND new.content IS NULL;

  /* 1: Behind */
  -- Clear remote when remote.content is the same as synced.content
  UPDATE FileV2 SET synced = remote, remote = NULL WHERE path = new.path AND new.status = 1 AND remote ->> '$.content' = synced ->> '$.content';
  -- Delete row when remote.content and synced.content are both is null
  DELETE FROM FileV2 WHERE path = new.path AND new.status = 1 AND remote ->> '$.content' IS NULL AND synced ->> '$.content' IS NULL;

  /* 2: Ahead */
  -- Clear local when local.content is the same as synced.content and is not null
  UPDATE FileV2 SET local = NULL WHERE path = new.path AND new.status = 2 AND local ->> '$.content' = synced ->> '$.content'; 
  -- Delete row when local.content and synced.content are both is null
  DELETE FROM FileV2 WHERE path = new.path AND new.status = 2 AND local ->> '$.content' IS NULL AND synced ->> '$.content' IS NULL;

  /* 3: Conflict */
  -- Clear local when local.content is the same as synced.content
  UPDATE FileV2 SET local = NULL WHERE path = new.path AND new.status = 3 AND local ->> '$.content' IS synced ->> '$.content';
  -- Clear local when local.content is the same as remote.content
  UPDATE FileV2 SET local = NULL WHERE path = new.path AND new.status = 3 AND local ->> '$.content' IS remote ->> '$.content';
END;

-- TODO prevent invalid timestamp
-- TODO ensure safe merge when ahead/behind
-- if old.status = behind, new.synced != old.synced, then new.synced must be old.remote
-- if old.status = ahead, new.synced != old.synced, then new.synced must be old.local