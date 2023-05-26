import { asyncPipe, callOnce } from "@tinykb/fp-utils";
import { sqlite3Opfs } from "@tinykb/sqlite-utils";
import CLEAR_FILES from "./sql/clear-files.sql";
import DELETE_FILE from "./sql/delete-file.sql";
import LIST_FILES_NEWER_THAN from "./sql/list-files-newer-than.sql";
import LIST_FILES from "./sql/list-files.sql";
import type { DbFile } from "./sql/schema";
import SCHEMA from "./sql/schema.sql";
import SELECT_FILE from "./sql/select-file.sql";
import UPSERT_FILE from "./sql/upsert-file.sql";
export * from "./check-health";
export * from "./sql/schema";

export const init = callOnce(
  asyncPipe(sqlite3Opfs.bind(null, "./sqlite3/jswasm/"), (db: Sqlite3.DB) => {
    db.exec(SCHEMA);
    return db;
  })
);

export function clear(db: Sqlite3.DB) {
  return db.exec(CLEAR_FILES);
}

export function writeFile(db: Sqlite3.DB, path: string, type: string, content: string) {
  return db.exec(UPSERT_FILE, {
    bind: {
      ":path": path,
      ":type": type,
      ":content": content,
    },
  });
}

/**
 * TODO swith to tombstone pattern for fault tolerant delete propagation to other modules
 * Set content to `null` for deletion
 */
export function writeOrDeleteFile(db: Sqlite3.DB, path: string, type: string, content: string | null) {
  if (content === null) {
    db.exec(DELETE_FILE, {
      bind: {
        ":path": path,
      },
    });
  } else {
    db.exec(UPSERT_FILE, {
      bind: {
        ":path": path,
        ":type": type,
        ":content": content,
      },
    });
  }
}

export function readFile(db: Sqlite3.DB, path: string) {
  return db.selectObject<DbFile>(SELECT_FILE, {
    ":path": path,
  });
}

export function listFiles(db: Sqlite3.DB, limit: number, offset: number) {
  return db.selectObjects<DbFile>(LIST_FILES, {
    ":limit": limit,
    ":offset": offset,
  });
}

export function listFilesNewerThan(db: Sqlite3.DB, minUpdatedTime: string) {
  return db.selectObjects<DbFile>(LIST_FILES_NEWER_THAN, {
    ":minUpdatedTime": minUpdatedTime,
  });
}
