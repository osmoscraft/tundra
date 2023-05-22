import { asyncPipe, callOnce } from "@tinykb/fp-utils";
import { sqlite3Opfs } from "@tinykb/sqlite-utils";
import type { GithubConnection } from "./github";
import * as github from "./github";
import CLEAR_CONFIG from "./sql/clear-config.sql";
import CLEAR_HISTORY from "./sql/clear-history.sql";
import LIST_FILE_CHANGES from "./sql/list-file-changes.sql";
import LIST_LOCAL_FILE_CHANGES from "./sql/list-local-file-changes.sql";
import REPLACE_GITHUB_CONNECTION from "./sql/replace-github-connection.sql";
import REPLACE_GITHUB_REF from "./sql/replace-github-ref.sql";
import type { DbFileChange, DbGithubRef } from "./sql/schema";
import SCHEMA from "./sql/schema.sql";
import SELECT_GITHUB_CONNECTION from "./sql/select-github-connection.sql";
import SELECT_GITHUB_REF from "./sql/select-github-ref.sql";
import UPSERT_LOCAL_FILE_CHANGE from "./sql/upsert-local-file-change.sql";
import UPSERT_REMOTE_FILE_CHANGE from "./sql/upsert-remote-file-change.sql";

export * from "./check-health";
export * from "./fetch";
export type { GithubConnection } from "./github";
export * from "./import";
export * from "./push";
export * from "./sql/schema";

export const init = callOnce(
  asyncPipe(sqlite3Opfs.bind(null, "./sqlite3/jswasm/"), (db: Sqlite3.DB) => {
    db.exec(SCHEMA);
    return db;
  })
);

export function getConnection(db: Sqlite3.DB) {
  return db.selectObject<GithubConnection>(SELECT_GITHUB_CONNECTION) ?? null;
}

export function clearConfig(db: Sqlite3.DB) {
  return db.exec(CLEAR_CONFIG);
}

export function clearHistory(db: Sqlite3.DB) {
  return db.exec(CLEAR_HISTORY);
}

export function getGithubRef(db: Sqlite3.DB) {
  return db.selectObject<DbGithubRef>(SELECT_GITHUB_REF) ?? null;
}

export function getChangedFiles(db: Sqlite3.DB): DbFileChange[] {
  return db.selectObjects<DbFileChange>(LIST_FILE_CHANGES);
}

export function getLocalChangedFiles(db: Sqlite3.DB): DbFileChange[] {
  return db.selectObjects<DbFileChange>(LIST_LOCAL_FILE_CHANGES);
}

export async function setConnection(db: Sqlite3.DB, connection: GithubConnection) {
  return db.exec(REPLACE_GITHUB_CONNECTION, {
    bind: {
      ":owner": connection.owner,
      ":repo": connection.repo,
      ":token": connection.token,
    },
  });
}

export function setGithubRef(db: Sqlite3.DB, id: string) {
  return db.exec(REPLACE_GITHUB_REF, {
    bind: { ":id": id },
  });
}

export async function testConnection(db: Sqlite3.DB) {
  const connection = await getConnection(db);
  return !!connection && github.testConnection(connection);
}

export async function trackLocalChange(db: Sqlite3.DB, path: string, content: string | null) {
  db.exec(UPSERT_LOCAL_FILE_CHANGE, {
    bind: {
      ":path": path,
      ":localHash": content ? await sha1(content) : null,
    },
  });
}

export async function trackRemoteChange(db: Sqlite3.DB, path: string, content: string | null) {
  db.exec(UPSERT_REMOTE_FILE_CHANGE, {
    bind: {
      ":path": path,
      ":remoteHash": content ? await sha1(content) : null,
    },
  });
}

async function sha1(input: string) {
  const msgUint8 = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join(""); // convert bytes to hex string
  return hashHex;
}
