import { asyncPipe, callOnce } from "@tinykb/fp-utils";
import { sqlite3Opfs } from "@tinykb/sqlite-utils";
import CLEAR_FILES from "./sql/clear-files.sql";
import LIST_FILES from "./sql/list-files.sql";
import SCHEMA from "./sql/schema.sql";
import SELECT_FILE from "./sql/select-file.sql";
import UPSERT_FILE from "./sql/upsert-file.sql";
export * from "./check-health";

export const init = callOnce(
  asyncPipe(sqlite3Opfs.bind(null, "./sqlite3/jswasm/"), (db: Sqlite3.DB) => db.exec(SCHEMA))
);

export function clear(db: Sqlite3.DB) {
  return db.exec(CLEAR_FILES);
}

export async function writeFile(db: Sqlite3.DB, path: string, type: "text/plain", content: string) {
  return db.exec(UPSERT_FILE, {
    bind: {
      ":path": path,
      ":type": type,
      ":content": content,
    },
  });
}

export async function readFile(db: Sqlite3.DB, path: string) {
  return db.selectObject<TinyFile>(SELECT_FILE, {
    ":path": path,
  });
}

export async function listFiles(db: Sqlite3.DB, limit: number, offset: number) {
  return db.selectObjects<TinyFile>(LIST_FILES, {
    ":limit": limit,
    ":offset": offset,
  });
}

export interface TinyFile {
  path: string;
  content: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}
