import { pipe, tap } from "@tinykb/fp-utils";
import { getLibversion, loadApiIndex, openOpfsDb } from "@tinykb/sqlite-loader";
import INSERT_FILE from "./sql/insert-file.sql";
import SCHEMA from "./sql/schema.sql";
import SELECT_FILE from "./sql/select-file.sql";

export interface TinyFile {
  path: string;
  content: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

function init(path: string) {
  return Promise.resolve(mark("db-init-start"))
    .then(() => loadApiIndex("./sqlite3/jswasm/"))
    .then(
      pipe(
        tap(pipe(getLibversion, (v: string) => console.log(`[db] ${path} version: ${v}`))),
        openOpfsDb.bind(null, path),
        createSchema.bind(null, SCHEMA)
      )
    )
    .then(tap(pipe(measure.bind(null, "db-init-start"), logDuration.bind(null, `[perf] ${path} schema init`))));
}

function writeTextFile(db: Sqlite3.DB, filePath: string, content: string) {
  db.exec(INSERT_FILE, {
    bind: {
      ":path": filePath,
      ":type": "text/plain",
      ":content": content,
    },
  });
}

function readTextFile(db: Sqlite3.DB, filePath: string) {
  return db.selectObject<TinyFile>(SELECT_FILE, {
    ":path": filePath,
  });
}

function createSchema(schema: string, db: Sqlite3.DB) {
  db.exec(schema);
  return db;
}

function logDuration(name: string, measure: PerformanceMeasure) {
  console.log(`${name} ${measure.duration.toFixed(2)}ms`);
}

function mark(markName: string) {
  return performance.mark(markName);
}
function measure(markName: string) {
  return performance.measure("", markName);
}

export const tinyfs = {
  init,
  writeTextFile,
  readTextFile,
};
