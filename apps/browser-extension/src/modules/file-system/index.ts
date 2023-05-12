import { asyncPipe, callOnce } from "@tinykb/fp-utils";
import { destoryOpfsByPath, sqlite3Opfs } from "@tinykb/sqlite-utils";
import LIST_FILES from "./sql/list-files.sql";
import SCHEMA from "./sql/schema.sql";
import SELECT_FILE from "./sql/select-file.sql";
import UPSERT_FILE from "./sql/upsert-file.sql";

export const fsDbAsync = callOnce(
  asyncPipe(sqlite3Opfs.bind(null, "./sqlite3/jswasm/", "/tinykb-fs.sqlite3"), (db: Sqlite3.DB) => db.exec(SCHEMA))
);

export async function checkFsHealth() {
  function assertEqual(expected?: any, actual?: any) {
    if (expected !== actual) {
      throw new Error(`Assert equal filed\nExpeced: ${expected}\nActual: ${actual}`);
    }
  }

  function log(message: string) {
    return console.log("[check health]", message);
  }

  async function test() {
    log("attempt to remove previous test db");
    await destoryOpfsByPath("/tinykb-fs-test.sqlite3")
      .then(() => log("removed"))
      .catch(() => log("nothing to remove"));

    log("init opfs");
    const db = await sqlite3Opfs("./sqlite3/jswasm/", "/tinykb-fs-test.sqlite3");

    log("ensure schema");
    db.exec(SCHEMA);
    log("write file");
    writeFile(db, "/test.txt", "text/plain", "hello world");
    log("file written");

    log("read file");
    readFile(db, "/test.txt").then((file) => assertEqual(file?.content, "hello world"));
    log("file read");
    log("ok");
  }

  return test()
    .then(() => true)
    .catch(() => false)
    .finally(() => destoryOpfsByPath("/tinykb-fs-test.sqlite3").then(() => log("cleanup")));
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
