import { asyncPipe, callOnce } from "@tinykb/fp-utils";
import { exec, sqlite3Opfs } from "@tinykb/sqlite-utils";

export const syncDbAsync = callOnce(
  asyncPipe(sqlite3Opfs.bind(null, "./sqlite3/jswasm/", "/tinykb-fs.sqlite3"), exec.bind(null, ""))
);
