import { asyncPipe } from "@tinykb/fp-utils";
import { sqlite3Opfs } from "@tinykb/sqlite-utils";
import SCHEMA from "./schema.sql";

export const init = asyncPipe(sqlite3Opfs.bind(null, "./sqlite3/jswasm/"), (db: Sqlite3.DB) => {
  db.exec(SCHEMA);
  return db;
});
