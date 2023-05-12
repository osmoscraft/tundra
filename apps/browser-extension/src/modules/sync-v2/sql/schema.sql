CREATE TABLE IF NOT EXISTS GithubConnection (
  owner TEXT,
  repo  TEXT,
  token TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS GithubRef (
  id   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS FileState (
  path       TEXT PRIMARY KEY,
  localAt    TEXT,
  localHash  TEXT,
  remoteAt   TEXT,
  remoteHash TEXT,
  state      TEXT GENERATED ALWAYS AS (
    CASE
      WHEN localAt > ifnull(remoteAt, 0) THEN 
        CASE
          WHEN localHash IS NULL AND remoteHash IS NULL THEN 'unchanged'
          WHEN localHash IS NULL AND remoteHash IS NOT NULL THEN 'delete'
          WHEN localHash IS NOT NULL AND remoteHash IS NULL THEN 'create'
          WHEN localHash IS NOT NULL AND remoteHash IS NOT NULL THEN 'change'
        END
      
      WHEN ifnull(localAt, 0) < remoteAt THEN 
        CASE
          WHEN localHash IS NULL AND remoteHash IS NULL THEN 'unchanged'
          WHEN localHash IS NULL AND remoteHash IS NOT NULL THEN 'create'
          WHEN localHash IS NOT NULL AND remoteHash IS NULL THEN 'delete'
          WHEN localHash IS NOT NULL AND remoteHash IS NOT NULL THEN 'change'
        END
      
      ELSE 
        CASE
          WHEN localHash IS remoteHash THEN 'unchanged'
          WHEN localHash IS NOT remoteHash THEN 'conflict'
        END
      
    END
  ) VIRTUAL
);

CREATE INDEX IF NOT EXISTS FileStateIdx on FileState (state);