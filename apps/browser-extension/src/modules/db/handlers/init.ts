import { pipe } from "../../fp/pipe";
import { tap } from "../../fp/tap";
import CREATE_SCHEMA from "../sql/create-schema.sql";
import initSqlite3 from "./sqlite3/jswasm/sqlite3.mjs"; // external, relative to worker script

export function initDb(path: string) {
  return Promise.resolve(mark("db-init-start"))
    .then(initSqlite3)
    .then(assertOpfs)
    .then(logSqlite3Version)
    .then(openOpfsDb.bind(null, path))
    .then(createSchema)
    .then(tap(pipe(measure.bind(null, "db-init-start"), logDuration.bind(null, "DB init"))));
}

function createSchema(db: Sqlite3.DB) {
  db.exec(CREATE_SCHEMA);
  return db;
}

function assertOpfs(sqlite3: Sqlite3.ApiIndex) {
  if (!sqlite3.opfs) throw new Error("OPFS is not loaded");
  return sqlite3;
}

function logSqlite3Version(sqlite3: Sqlite3.ApiIndex) {
  console.debug("sqlite3 version", sqlite3.capi.sqlite3_libversion(), sqlite3.capi.sqlite3_sourceid());
  return sqlite3;
}

function openOpfsDb(path: string, sqlite3: Sqlite3.ApiIndex) {
  return new sqlite3.oo1.OpfsDb(path);
}

function logDuration(name: string, measure: PerformanceMeasure) {
  console.log(`${name} ${measure.duration.toFixed(2)}`);
}

function mark(markName: string) {
  return performance.mark(markName);
}
function measure(markName: string) {
  return performance.measure("", markName);
}
