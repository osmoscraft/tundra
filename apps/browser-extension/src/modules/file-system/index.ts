import { asyncPipe, callOnce } from "@tinykb/fp-utils";
import { sqlite3Opfs } from "@tinykb/sqlite-utils";
import CLEAR_FILES from "./sql/clear-files.sql";
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
