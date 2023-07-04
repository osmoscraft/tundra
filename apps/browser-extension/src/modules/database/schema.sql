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
    /*
     * Bit mask NULL=0, NOT NULL=1  [localUpdated, remoteUpdated, baseUpdated]
     * (T) status are transient and should be resolved by trigger
     */
    CASE
      WHEN localUpdatedAt IS NULL AND remoteUpdatedAt IS NULL AND baseUpdatedAt IS NULL THEN 0 -- (T)
      WHEN localUpdatedAt IS NULL AND remoteUpdatedAt IS NULL AND baseUpdatedAt IS NOT NULL THEN 1 -- Unchanged
      WHEN localUpdatedAt IS NULL AND remoteUpdatedAt IS NOT NULL AND baseUpdatedAt IS NULL THEN 2 -- (T)
      WHEN localUpdatedAt IS NULL AND remoteUpdatedAt IS NOT NULL AND baseUpdatedAt IS NOT NULL THEN 3 -- (T)
      WHEN localUpdatedAt IS NOT NULL AND remoteUpdatedAt IS NULL AND baseUpdatedAt IS NULL THEN 4 -- Added
      WHEN localUpdatedAt IS NOT NULL AND remoteUpdatedAt IS NULL AND baseUpdatedAt IS NOT NULL THEN 5 -- Outgoing
      WHEN localUpdatedAt IS NOT NULL AND remoteUpdatedAt IS NOT NULL AND baseUpdatedAt IS NULL THEN 6 -- (T)
      WHEN localUpdatedAt IS NOT NULL AND remoteUpdatedAt IS NOT NULL AND baseUpdatedAt IS NOT NULL THEN 7 -- Conflict
    END
  )
);

CREATE TRIGGER IF NOT EXISTS FileV2AfterInsertTrigger AFTER INSERT ON FileV2 BEGIN
  /* Status 4 */
  -- When localUpdatedAt only and localContent is null -> delete row
  DELETE FROM FileV2 WHERE path = new.path AND new.status = 4 AND new.localContent IS NULL;

  /* Status 2 */
  -- When remoteUpdatedAt only and remoteContent is not null -> shift remote timestamp and content to base
  UPDATE FileV2 SET
    baseContent = new.remoteContent,
    baseUpdatedAt = new.remoteUpdatedAt,
    remoteContent = NULL,
    remoteUpdatedAt = NULL
  WHERE path = new.path AND new.status = 2 AND new.remoteContent IS NOT NULL;

  -- When remoteUpdatedAt only and remoteContent is null -> delete row
  DELETE FROM FileV2 WHERE path = new.path AND new.status = 2 AND new.remoteContent IS NULL;

  /* Status 1 */
  -- When basedUpdatedAt only and baseContent is null -> delete row
  DELETE FROM FileV2 WHERE path = new.path AND new.status = 1 AND new.baseContent IS NULL;

  /* Status 5 */
  -- When localUpdatedAt is older than baseUpdatedAt -> abort
  SELECT RAISE(ABORT, 'localUpdatedAt is older than baseUpdatedAt') WHERE new.status = 5 AND new.localUpdatedAt < new.baseUpdatedAt;

  -- When localUpdatedAt is newer than baseUpdatedAt and both content are null -> delete row
  DELETE FROM FileV2 WHERE path = new.path AND new.status = 5 AND new.baseContent IS NULL AND new.localContent IS NULL AND new.localUpdatedAt >= new.baseUpdatedAt;

  -- When localUpdatedAt is newer than baseUpdatedAt and both content are not null and the same -> clear local content
  UPDATE FileV2 SET
    localContent = NULL,
    localUpdatedAt = NULL
  WHERE path = new.path AND new.status = 5 AND new.baseContent IS NOT NULL AND new.localContent IS NOT NULL AND new.localContent = new.baseContent AND new.localUpdatedAt >= new.baseUpdatedAt;


  -- When localUpdatedAt is newer than baseUpdatedAt and local content is not null and base content is null -> clear base content
  UPDATE FileV2 SET
    baseContent = NULL,
    baseUpdatedAt = NULL
  WHERE path = new.path AND new.status = 5 AND new.baseContent IS NULL AND new.localContent IS NOT NULL AND new.localUpdatedAt >= new.baseUpdatedAt;

  -- When localUpdatedAt is newer than baseUpdatedAt and local content is null and base content is not null -> noop
  -- When localUpdatedAt is newer than baseUpdatedAt and both content are not null and different -> noop

  /* Status 3 */
  -- When remoteUpdatedAt is older than baseUpdatedAt -> abort
  SELECT RAISE(ABORT, 'remoteUpdatedAt is older than baseUpdatedAt') WHERE new.status = 3 AND new.remoteUpdatedAt < new.baseUpdatedAt;

  -- TODO support incoming status

  -- When remoteUpdatedAt is newer than baseUpdatedAt and remote content is null -> delete row
  DELETE FROM FileV2 WHERE path = new.path AND new.status = 3 AND new.remoteContent IS NULL AND new.remoteUpdatedAt >= new.baseUpdatedAt;

  -- When remoteUpdatedAt is newer than baseUpdatedAt and remote content is not null -> shift remote to base
  UPDATE FileV2 SET
    baseContent = new.remoteContent,
    baseUpdatedAt = new.remoteUpdatedAt,
    remoteContent = NULL,
    remoteUpdatedAt = NULL
  WHERE path = new.path AND new.status = 3 AND new.remoteContent IS NOT NULL AND new.remoteUpdatedAt >= new.baseUpdatedAt;
END;

-- TODO after update trigger