CREATE TABLE IF NOT EXISTS GithubConnection (
  owner TEXT,
  repo  TEXT,
  token TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS GithubRef (
  id   TEXT NOT NULL
);
