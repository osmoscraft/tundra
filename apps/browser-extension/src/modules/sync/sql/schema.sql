CREATE TABLE IF NOT EXISTS GithubConnection (
  owner TEXT,
  repo  TEXT,
  token TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS GithubRef (
  id   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS FileChange (
  path           TEXT PRIMARY KEY,
  localHash      TEXT,
  localHashTime  TEXT,
  remoteContent  TEXT,
  remoteHash     TEXT,
  remoteHashTime TEXT,
  /*
   1: Local
   2: Remote
   */
  source         INT GENERATED ALWAYS AS (
    CASE
      WHEN localHashTime >= ifnull(remoteHashTime, 0) THEN 1
      WHEN ifnull(localHashTime, 0) < remoteHashTime THEN 2
    END
  ),
  /*
   0: Unchanged
   1: Added
   2: Modified
   3: Removed
   */
  status         INT GENERATED ALWAYS AS (
    CASE
      WHEN localHashTime >= ifnull(remoteHashTime, 0) THEN 
        CASE
          WHEN localHash IS NULL AND remoteHash IS NOT NULL THEN 3
          WHEN localHash IS NOT NULL AND remoteHash IS NULL THEN 1
          WHEN localHash IS remoteHash THEN 0
          WHEN localHash IS NOT remoteHash THEN 2 
        END
      
      WHEN ifnull(localHashTime, 0) < remoteHashTime THEN 
        CASE
          WHEN localHash IS NULL AND remoteHash IS NOT NULL THEN 1
          WHEN localHash IS NOT NULL AND remoteHash IS NULL THEN 3
          WHEN localHash IS remoteHash THEN 0
          WHEN localHash IS NOT remoteHash THEN 2
        END
    END
  ) VIRTUAL
);

CREATE INDEX IF NOT EXISTS FileChangeIdx on FileChange (source, status);