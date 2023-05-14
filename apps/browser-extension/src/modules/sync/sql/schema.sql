CREATE TABLE IF NOT EXISTS GithubConnection (
  owner TEXT,
  repo  TEXT,
  token TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS GithubRef (
  id   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS FileChange (
  path       TEXT PRIMARY KEY,
  localAt    TEXT,
  localHash  TEXT,
  remoteAt   TEXT,
  remoteHash TEXT,
  source     TEXT GENERATED ALWAYS AS (
    CASE
      WHEN localAt > ifnull(remoteAt, 0) THEN 'local'
      WHEN ifnull(localAt, 0) < remoteAt THEN 'remote'
      ELSE 'both'
    END
  ),
  status     TEXT GENERATED ALWAYS AS (
    CASE
      WHEN localAt > ifnull(remoteAt, 0) THEN 
        CASE
          WHEN localHash IS NULL AND remoteHash IS NOT NULL THEN 'removed'
          WHEN localHash IS NOT NULL AND remoteHash IS NULL THEN 'added'
          WHEN localHash IS remoteHash THEN 'unchanged'
          WHEN localHash IS NOT remoteHash THEN 'modified'
        END
      
      WHEN ifnull(localAt, 0) < remoteAt THEN 
        CASE
          WHEN localHash IS NULL AND remoteHash IS NOT NULL THEN 'added'
          WHEN localHash IS NOT NULL AND remoteHash IS NULL THEN 'removed'
          WHEN localHash IS remoteHash THEN 'unchanged'
          WHEN localHash IS NOT remoteHash THEN 'modified'
        END
      
      ELSE 
        CASE
          WHEN localHash IS remoteHash THEN 'unchanged'
          WHEN localHash IS NOT remoteHash THEN 'conflict'
        END
      
    END
  ) VIRTUAL
);

CREATE INDEX IF NOT EXISTS FileChangeIdx on FileChange (source, status);