import * as graphApi from "../database/graph";

export function getGithubRemoteHeadCommit(db: Sqlite3.DB) {
  return graphApi.getFile(db, "config/sync/github-head-commit.txt")?.content ?? undefined;
}

export function setGithubRemoteHeadCommit(db: Sqlite3.DB, commit: string | null) {
  graphApi.commit(db, {
    path: "config/sync/github-head-commit.txt",
    content: commit,
  });
}
