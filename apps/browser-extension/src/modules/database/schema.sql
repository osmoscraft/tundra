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
  -- Delete row when remote.content and synced.content are both null
  DELETE FROM FileV2 WHERE path = new.path AND new.status = 1 AND remote ->> '$.content' IS NULL AND synced ->> '$.content' IS NULL;
  -- Clear remote when remote time is older than synced time
  UPDATE FileV2 SET remote = NULL WHERE path = new.path AND new.status = 1 AND remote ->> '$.updatedAt' < synced ->> '$.updatedAt';
  -- Move remote to synced when remote.content is the same as synced.content and is not null
  UPDATE FileV2 SET synced = remote, remote = NULL WHERE path = new.path AND new.status = 1 AND remote ->> '$.content' = synced ->> '$.content';
  -- Clear synced when sync.content is null
  UPDATE FileV2 SET synced = NULL WHERE path = new.path AND new.status = 1 AND synced ->> '$.content' IS NULL;


  /* 2: Ahead */
  -- Clear local when local.content is the same as synced.content and is not null
  UPDATE FileV2 SET local = NULL WHERE path = new.path AND new.status = 2 AND local ->> '$.content' = synced ->> '$.content'; 
  -- Clear local when local time is older than synced time
  UPDATE FileV2 SET local = NULL WHERE path = new.path AND new.status = 2 AND local ->> '$.updatedAt' < synced ->> '$.updatedAt';
  -- Clear synced when sync.content is null
  UPDATE FileV2 SET synced = NULL WHERE path = new.path AND new.status = 2 AND synced ->> '$.content' IS NULL;
  -- Delete row when local.content and synced.content are both null
  DELETE FROM FileV2 WHERE path = new.path AND new.status = 2 AND local ->> '$.content' IS NULL AND synced ->> '$.content' IS NULL;

  /* 3: Conflict */
  -- Clear local when local.content is the same as remote.content
  UPDATE FileV2 SET local = NULL WHERE path = new.path AND new.status = 3 AND local ->> '$.content' IS remote ->> '$.content';
  -- Move remote to synced when remote.content is the same as synced.content, localTime >= remoteTime  >= syncedTime
  UPDATE FileV2 SET synced = remote, remote = NULL WHERE path = new.path AND new.status = 3 AND remote ->> '$.content' IS synced ->> '$.content' AND local ->> '$.updatedAt' >= remote ->> '$.updatedAt' AND remote ->> '$.updatedAt' >= synced ->> '$.updatedAt';
  -- Clear remote when remote.content and synced.content are both null
  -- UPDATE FileV2 SET remote = NULL WHERE path = new.path AND new.status = 3 AND remote ->> '$.content' IS NULL AND synced ->> '$.content' IS NULL;
  -- Clear local when local.content is the same as synced.content, and local time <= remote time
  UPDATE FileV2 SET local = NULL WHERE path = new.path AND new.status = 3 AND local ->> '$.content' IS synced ->> '$.content' AND local ->> '$.updatedAt' <= remote ->> '$.updatedAt';
  -- Clear sync when sync.content is null
  UPDATE FileV2 SET synced = NULL WHERE path = new.path AND new.status = 3 AND synced ->> '$.content' IS NULL;
END;

CREATE TRIGGER IF NOT EXISTS FileV2AfterUpdateTrigger AFTER UPDATE ON FileV2 BEGIN
  /* 0: Synced */
  -- Delete row when content is null
  DELETE FROM FileV2 WHERE path = new.path AND new.status = 0 AND new.content IS NULL;

  /* 1: Behind */
  -- Delete row when remote.content and synced.content are both null
  DELETE FROM FileV2 WHERE path = new.path AND new.status = 1 AND remote ->> '$.content' IS NULL AND synced ->> '$.content' IS NULL;
  -- Clear remote when remote time is older than synced time
  UPDATE FileV2 SET remote = NULL WHERE path = new.path AND new.status = 1 AND remote ->> '$.updatedAt' < synced ->> '$.updatedAt';
  -- Clear remote when remote.content is the same as synced.content
  UPDATE FileV2 SET synced = remote, remote = NULL WHERE path = new.path AND new.status = 1 AND remote ->> '$.content' = synced ->> '$.content';
  -- Clear synced when sync.content is null
  UPDATE FileV2 SET synced = NULL WHERE path = new.path AND new.status = 1 AND synced ->> '$.content' IS NULL;

  /* 2: Ahead */
  -- Clear local when local.content is the same as synced.content and is not null
  UPDATE FileV2 SET local = NULL WHERE path = new.path AND new.status = 2 AND local ->> '$.content' = synced ->> '$.content'; 
  -- Clear local when local time is older than synced time
  UPDATE FileV2 SET local = NULL WHERE path = new.path AND new.status = 2 AND local ->> '$.updatedAt' < synced ->> '$.updatedAt';
  -- Clear synced when sync.content is null
  UPDATE FileV2 SET synced = NULL WHERE path = new.path AND new.status = 2 AND synced ->> '$.content' IS NULL;
  -- Delete row when local.content and synced.content are both null
  DELETE FROM FileV2 WHERE path = new.path AND new.status = 2 AND local ->> '$.content' IS NULL AND synced ->> '$.content' IS NULL;

  /* 3: Conflict */
  -- Clear local when local.content is the same as remote.content
  UPDATE FileV2 SET local = NULL WHERE path = new.path AND new.status = 3 AND local ->> '$.content' IS remote ->> '$.content';
  -- Move remote to synced when remote.content is the same as synced.content, localTime >= remoteTime  >= syncedTime
  UPDATE FileV2 SET synced = remote, remote = NULL WHERE path = new.path AND new.status = 3 AND remote ->> '$.content' IS synced ->> '$.content' AND local ->> '$.updatedAt' >= remote ->> '$.updatedAt' AND remote ->> '$.updatedAt' >= synced ->> '$.updatedAt';
  -- Clear remote when remote.content and synced.content are both null
  -- UPDATE FileV2 SET remote = NULL WHERE path = new.path AND new.status = 3 AND remote ->> '$.content' IS NULL AND synced ->> '$.content' IS NULL;
  -- Clear local when local.content is the same as synced.content, and local time <= remote time
  UPDATE FileV2 SET local = NULL WHERE path = new.path AND new.status = 3 AND local ->> '$.content' is synced ->> '$.content' AND local ->> '$.updatedAt' <= remote ->> '$.updatedAt';
  -- Clear sync when sync.content is null
  UPDATE FileV2 SET synced = NULL WHERE path = new.path AND new.status = 3 AND synced ->> '$.content' IS NULL;
END;

-- TODO prevent invalid timestamp
-- TODO compress triggers by action
-- TODO handle complex conflict resolution
   -- When L = S != R
   -- When L = R != S
   -- When L = R = S != NULL, Move R to S and clear L
   -- When L = R = S = NULL, Delete row
   -- Comply to timestamp order by rebasing local content
   -- Sequence: Set L <- S, Set S <- R, Replay L
-- TODO flex merge
  -- Allow both setL and setR and rebase
  -- Rebase: (L, S) <- (new L, R)
  -- Ensure when old.status = conflict and synced field is changed, new.synced must be old.remote and new.localTime >= new.syncedTime
  -- The goal is to ensure conflict is resolved without timestamp order violation
-- TODO ensure conflict state only allows setL

-- TODO consolidate triggers for performance


-- REF
-- Raise error on violation: when updating synced, then new.synced must be old.remote
-- SELECT RAISE(ABORT, 'merge must use remote content when status is behind') WHERE old.status = 1 AND new.synced IS NOT old.synced AND new.synced IS NOT old.remote;

-- TODO document design principles
-- setSynced should override any outdated content
-- do not assume timestamp monotonicity
-- auto merge newer version when possible
-- auto resolve conflict when possible
-- state resolution should not depend on how the state is reached
-- local and remote are each considered snapshots, not aware of the synced value and each other
-- replaying the event one by one or in groups will always render the same end results
-- The algorithm must be greedy. When two timestamps are the same, try both ordering and pick the most reduction possible
-- The greedy algorithm allows us to replay events in any order and still get the same result
-- The greedy algorithm also allows setting synced the same as local or remote and clear their results