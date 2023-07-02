import { getFile, setLocalFile } from "../database";
import { getMetaExtractor } from "../meta/extract-meta";
import type { GithubConnection } from "./github";
import * as github from "./github";

export * from "./clone";
export * from "./fetch";
export type { GithubConnection } from "./github";
export * from "./ignore";
export * from "./push";

export function getConnection(db: Sqlite3.DB) {
  return getFile(db, "config/sync/github.json")?.meta as GithubConnection | undefined;
}

export function getGithubRemoteHeadCommit(db: Sqlite3.DB) {
  return getFile(db, "config/sync/github-head-commit.txt")?.content;
}

export async function setConnection(db: Sqlite3.DB, connection: GithubConnection) {
  const path = "config/sync/github.json";
  const content = JSON.stringify(connection);
  const meta = getMetaExtractor(path)(content);

  setLocalFile(db, {
    path,
    content,
    meta,
  });
}

export function setGithubRemoteHeadCommit(db: Sqlite3.DB, commit: string) {
  setLocalFile(db, {
    path: "config/sync/github-head-commit.txt",
    content: commit,
  });
}

export async function testConnection(db: Sqlite3.DB) {
  const connection = await getConnection(db);
  return !!connection && github.testConnection(connection);
}
