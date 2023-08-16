CREATE TABLE File (
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
  meta TEXT GENERATED ALWAYS AS (source ->> '$.meta'),
  updatedAt INTEGER GENERATED ALWAYS AS (source ->> '$.updatedAt'),

  localAction INTEGER NOT NULL GENERATED ALWAYS AS (
    CASE
      WHEN local ->> '$.content' IS NOT NULL AND synced IS NULL THEN 1 -- Add
      WHEN local -> '$.content' IS 'null' AND synced IS NOT NULL THEN 2 -- Remove
      WHEN local ->> '$.content' IS NOT NULL AND synced IS NOT NULL THEN 3 --Modify
      ELSE 0 -- None
    END
  ),
  remoteAction INTEGER NOT NULL GENERATED ALWAYS AS (
    CASE
      WHEN remote ->> '$.content' IS NOT NULL AND synced IS NULL THEN 1 -- Add
      WHEN remote -> '$.content' IS 'null' AND synced IS NOT NULL THEN 2 -- Remove
      WHEN remote ->> '$.content' IS NOT NULL AND synced IS NOT NULL THEN 3 --Modify
      ELSE 0 -- None
    END
  )
);

CREATE INDEX LocalActionIdx ON File(localAction);
CREATE INDEX RemoteActionIdx ON File(remoteAction);
CREATE INDEX UpdatedAtIdx ON File(updatedAt);
CREATE INDEX StatusIdx ON File(status);

CREATE TRIGGER FileAfterInsertTrigger AFTER INSERT ON File BEGIN
  -- Clear outdated local
  UPDATE File SET local = NULL WHERE path = new.path AND synced ->> '$.updatedAt' >= local ->> '$.updatedAt';
  -- Clear outdated remote
  UPDATE File SET remote = NULL WHERE path = new.path AND synced ->> '$.updatedAt' >= remote ->> '$.updatedAt';

  -- Auto merge local
  UPDATE File SET local = NULL WHERE path = new.path AND (
    ((remote IS NULL OR local ->> '$.updatedAt' <= remote ->> '$.updatedAt') AND local ->> '$.content' IS synced ->> '$.content') OR -- merge with synced
    (local -> '$.content' = remote -> '$.content') -- merge with remote
  );

  -- Auto merge remote
  UPDATE File SET synced = remote, remote = NULL WHERE path = new.path AND
    (local IS NULL OR remote ->> '$.updatedAt' <= local ->> '$.updatedAt') AND (remote ->> '$.content' IS synced ->> '$.content');  -- merge with synced

  -- Clear outdated local again in case remote is merged
  UPDATE File SET local = NULL WHERE path = new.path AND synced ->> '$.updatedAt' >= local ->> '$.updatedAt';

  -- Clear synced when it is null
  UPDATE File SET synced = NULL WHERE path = new.path AND synced ->> '$.content' IS NULL;

  -- Delete record when all fields are NULL
  DELETE FROM File WHERE path = new.path AND local IS NULL AND remote IS NULL AND synced IS NULL;
END;

CREATE TRIGGER FileAfterUpdateTrigger AFTER UPDATE ON File BEGIN
  -- Clear outdated local
  UPDATE File SET local = NULL WHERE path = new.path AND synced ->> '$.updatedAt' >= local ->> '$.updatedAt';
  -- Clear outdated remote
  UPDATE File SET remote = NULL WHERE path = new.path AND synced ->> '$.updatedAt' >= remote ->> '$.updatedAt';

  -- Auto merge local
  UPDATE File SET local = NULL WHERE path = new.path AND (
    ((remote IS NULL OR local ->> '$.updatedAt' <= remote ->> '$.updatedAt') AND local ->> '$.content' IS synced ->> '$.content') OR -- merge with synced
    (local -> '$.content' = remote -> '$.content') -- merge with remote
  );

  -- Auto merge remote
  UPDATE File SET synced = remote, remote = NULL WHERE path = new.path AND
    (local IS NULL OR remote ->> '$.updatedAt' <= local ->> '$.updatedAt') AND (remote ->> '$.content' IS synced ->> '$.content');  -- merge with synced

  -- Clear outdated local again in case remote is merged
  UPDATE File SET local = NULL WHERE path = new.path AND synced ->> '$.updatedAt' >= local ->> '$.updatedAt';

  -- Clear synced when it is null
  UPDATE File SET synced = NULL WHERE path = new.path AND synced ->> '$.content' IS NULL;

  -- Delete record when all fields are NULL
  DELETE FROM File WHERE path = new.path AND local IS NULL AND remote IS NULL AND synced IS NULL;
END;

CREATE VIRTUAL TABLE FileFts USING fts5(path, content, meta, content=File);

CREATE TRIGGER FileFtsAfterInsertTrigger AFTER INSERT ON File BEGIN
    INSERT INTO FileFts(rowid, path, content, meta)
    VALUES (new.rowid, new.path, new.content, new.meta);
END;

CREATE TRIGGER FileFtsAfterDeleteTrigger AFTER DELETE ON File BEGIN
  INSERT INTO FileFts(FileFts, rowid, path, content, meta)
  VALUES('delete', old.rowid, old.path, old.content, old.meta);
END;

CREATE TRIGGER FileFtsAfterUpdateTrigger AFTER UPDATE ON File BEGIN
  INSERT INTO FileFts( FileFts, rowid, path, content, meta)
  VALUES('delete', old.rowid, old.path, old.content, old.meta);
  INSERT INTO FileFts(rowid, path, content, meta)
  VALUES (new.rowid, new.path, new.content, new.meta);
END;
