import { deleteObject, getFile, getObject, setLocalFile, setObject } from "../database";
import type { GithubConnection } from "./github";
import * as github from "./github";

export * from "./clone";
export * from "./fetch";
export type { GithubConnection } from "./github";
export * from "./push";
export * from "./scan";

export function getConnection(db: Sqlite3.DB) {
  const gh = getFile(db, "config/sync/github.json");
  return getObject<GithubConnection>(db, "sync.github.connection");
}

export function deleteConnection(db: Sqlite3.DB) {
  // TODO
  return deleteObject(db, "sync.github.connection");
}

export function clearHistory(db: Sqlite3.DB) {
  return deleteObject(db, "sync.github.remoteHeadCommit");
}

export function getGithubRemoteHeadCommit(db: Sqlite3.DB) {
  const gh = getFile(db, "config/sync/github-head-commit.json");
  return getObject<string>(db, "sync.github.remoteHeadCommit");
}

export async function setConnection(db: Sqlite3.DB, connection: GithubConnection) {
  setLocalFile(db, {
    path: "config/sync/github.json",
    content: JSON.stringify(connection),
  });

  setObject(db, "sync.github.connection", connection);
}

export function setGithubRemoteHeadCommit(db: Sqlite3.DB, commit: string) {
  setLocalFile(db, {
    path: "config/sync/github-head-commit.json",
    content: JSON.stringify(commit),
  });

  setObject(db, "sync.github.remoteHeadCommit", commit);
}

export async function testConnection(db: Sqlite3.DB) {
  const connection = await getConnection(db);
  return !!connection && github.testConnection(connection);
}
