import { pipe, tap } from "@tinykb/fp-utils";
import { getLibversion, loadApiIndex, openOpfsDb } from "@tinykb/sqlite-loader";
import CREATE_SCHEMA from "../sql/create-schema.sql";

export function dbInit(path: string) {
  return Promise.resolve(mark("db-init-start"))
    .then(() => loadApiIndex("./sqlite3/jswasm/"))
    .then(
      pipe(
        tap(pipe(getLibversion, (v: string) => console.log("[db] sqlite version:", v))),
        openOpfsDb.bind(null, path),
        createSchema
      )
    )
    .then(tap(pipe(measure.bind(null, "db-init-start"), logDuration.bind(null, "[perf] DB schema init"))));
}

function createSchema(db: Sqlite3.DB) {
  db.exec(CREATE_SCHEMA);
  return db;
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
