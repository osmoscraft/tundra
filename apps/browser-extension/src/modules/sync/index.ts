import { asyncPipe, callOnce } from "@tinykb/fp-utils";
import { sqlite3Opfs } from "@tinykb/sqlite-utils";
import { deleteObject, getObject, setObject } from "../database";
import type { GithubConnection } from "./github";
import * as github from "./github";
import { sha1 } from "./hash";
import LIST_FILE_CHANGES from "./sql/list-file-changes.sql";
import LIST_LOCAL_FILE_CHANGES from "./sql/list-local-file-changes.sql";
import type { DbFileChange } from "./sql/schema";
import SCHEMA from "./sql/schema.sql";
import SELECT_LOCAL_FILE_CHANGE from "./sql/select-local-file-change.sql";
import SELECT_REMOTE_FILE_CHANGE from "./sql/select-remote-file-change.sql";
import UPSERT_LOCAL_FILE_CHANGE_NOW from "./sql/upsert-local-file-change-now.sql";
import UPSERT_REMOTE_FILE_CHANGE_NOW from "./sql/upsert-remote-file-change-now.sql";
import UPSERT_REMOTE_FILE_CHANGE from "./sql/upsert-remote-file-change.sql";

export * from "./clone";
export * from "./fetch";
export type { GithubConnection } from "./github";
export * from "./push";
export * from "./sql/schema";

export const init = callOnce(
  asyncPipe(sqlite3Opfs.bind(null, "./sqlite3/jswasm/"), (db: Sqlite3.DB) => {
    db.exec(SCHEMA);
    return db;
  })
);

export function getConnection(db: Sqlite3.DB) {
  return getObject<GithubConnection>(db, "sync.github.connection");
}

export function deleteConnection(db: Sqlite3.DB) {
  return deleteObject(db, "sync.github.connection");
}

export function clearHistory(db: Sqlite3.DB) {
  return deleteObject(db, "sync.github.remoteHeadCommit");
}

export function getRemoteFileChange(db: Sqlite3.DB, path: string): DbFileChange | undefined {
  return db.selectObject<DbFileChange>(SELECT_REMOTE_FILE_CHANGE, { ":path": path });
}

export function getFileChanges(db: Sqlite3.DB): DbFileChange[] {
  return db.selectObjects<DbFileChange>(LIST_FILE_CHANGES);
}

export function getGithubRemoteHeadCommit(db: Sqlite3.DB) {
  return getObject<string>(db, "sync.github.remoteHeadCommit");
}

export function getLocalFileChange(db: Sqlite3.DB, path: string): DbFileChange | undefined {
  return db.selectObject<DbFileChange>(SELECT_LOCAL_FILE_CHANGE, { ":path": path });
}

export function getLocalFileChanges(db: Sqlite3.DB): DbFileChange[] {
  return db.selectObjects<DbFileChange>(LIST_LOCAL_FILE_CHANGES);
}

export async function setConnection(db: Sqlite3.DB, connection: GithubConnection) {
  setObject(db, "sync.github.connection", connection);
}

export function setGithubRemoteHeadCommit(db: Sqlite3.DB, commit: string) {
  setObject(db, "sync.github.remoteHeadCommit", commit);
}

export async function testConnection(db: Sqlite3.DB) {
  const connection = await getConnection(db);
  return !!connection && github.testConnection(connection);
}

export async function trackLocalChangeNow(db: Sqlite3.DB, path: string, content: string | null) {
  db.exec(UPSERT_LOCAL_FILE_CHANGE_NOW, {
    bind: {
      ":path": path,
      ":localHash": content ? await sha1(content) : null,
    },
  });
}

export async function trackRemoteChange(db: Sqlite3.DB, path: string, content: string | null, timestamp: string) {
  db.exec(UPSERT_REMOTE_FILE_CHANGE, {
    bind: {
      ":path": path,
      ":remoteHashTime": timestamp,
      ":remoteHash": content ? await sha1(content) : null,
    },
  });
}

export async function trackRemoteChangeNow(db: Sqlite3.DB, path: string, content: string | null) {
  db.exec(UPSERT_REMOTE_FILE_CHANGE_NOW, {
    bind: {
      ":path": path,
      ":remoteHash": content ? await sha1(content) : null,
    },
  });
}
