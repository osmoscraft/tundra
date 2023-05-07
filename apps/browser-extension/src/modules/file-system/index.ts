import { asyncPipe, asyncTap, callOnce, tap } from "@tinykb/fp-utils";
import { destoryOpfsByPath, sqlite3Opfs } from "@tinykb/sqlite-utils";
import INSERT_FILE from "./sql/insert-file.sql";
import LIST_FILES from "./sql/list-files.sql";
import SCHEMA from "./sql/schema.sql";
import SELECT_FILE from "./sql/select-file.sql";

export const fsDbAsync = callOnce(
  asyncPipe(sqlite3Opfs.bind(null, "./sqlite3/jswasm/", "/tinykb-fs.sqlite3"), ensureSchema)
);

function ensureSchema(db: Sqlite3.DB) {
  db.exec(SCHEMA);
  return db;
}

export async function checkHealth() {
  function assertEqual(expected?: any, actual?: any) {
    if (expected !== actual) {
      throw new Error(`Assert equal filed\nExpeced: ${expected}\nActual: ${actual}`);
    }
  }

  function log(message: string) {
    return tap(() => console.log("[check health]", message));
  }

  const isSuccess = await asyncPipe(
    log("attempt to remove previous test db"),
    () => destoryOpfsByPath("/tinykb-fs-test.sqlite3").then(log("removed")).catch(log("nothing to remove")),
    log("init opfs"),
    sqlite3Opfs.bind(null, "./sqlite3/jswasm/", "/tinykb-fs-test.sqlite3"),
    log("ensure schema"),
    ensureSchema,
    asyncTap(
      asyncPipe(
        log("write file"),
        (db: Sqlite3.DB) => writeFile(db, "/test.txt", "text/plain", "hello world"),
        log("file written")
      )
    ),
    asyncTap(
      asyncPipe(
        log("read file"),
        (db: Sqlite3.DB) => readFile(db, "/test.txt"),
        (file: TinyFile) => assertEqual(file?.content, "hello world"),
        log("file read")
      )
    )
  )()
    .then(log("ok"))
    .then(() => true)
    .catch(() => false)
    .finally(() => destoryOpfsByPath("/tinykb-fs-test.sqlite3").then(log("cleanup")));

  return isSuccess;
}

export async function writeFile(db: Sqlite3.DB, path: string, type: "text/plain", content: string) {
  return db.exec(INSERT_FILE, {
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
