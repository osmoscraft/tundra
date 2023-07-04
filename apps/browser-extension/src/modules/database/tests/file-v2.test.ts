import { arrayToParams, paramsToBindings } from "@tinykb/sqlite-utils";
import { assertDefined, assertEqual, assertUndefined } from "../../live-test";
import { DbFileStatus, type DbFileV2Internal } from "../schema";
import SCHEMA from "../schema.sql";
import { createTestDb } from "./fixture";

export async function testFileV2Db() {
  const db = await createTestDb(SCHEMA);

  assertDefined(db, "db is defined");
}

type TestDbWritableRow = Partial<DbFileV2Internal> & { path: string };

export async function testFileV2Status() {
  const db = await createTestDb(SCHEMA);

  upsertMany<TestDbWritableRow>(db, "FileV2", "path", [{ path: "added", localContent: "", localUpdatedAt: 1 }]);
  upsertMany<TestDbWritableRow>(db, "FileV2", "path", [{ path: "unchanged", baseContent: "", baseUpdatedAt: 1 }]);
  upsertMany<TestDbWritableRow>(db, "FileV2", "path", [
    { path: "modified", localContent: "local", localUpdatedAt: 2, baseContent: "", baseUpdatedAt: 1 },
  ]);
  upsertMany<TestDbWritableRow>(db, "FileV2", "path", [
    {
      path: "conflict",
      localContent: "local",
      localUpdatedAt: 2,
      remoteContent: "remote",
      remoteUpdatedAt: 2,
      baseContent: "",
      baseUpdatedAt: 1,
    },
  ]);

  assertEqual(readV2(db, "added")?.status, DbFileStatus.Added);
  assertEqual(readV2(db, "unchanged")?.status, DbFileStatus.Unchanged);
  assertEqual(readV2(db, "modified")?.status, DbFileStatus.Modified);
  assertEqual(readV2(db, "conflict")?.status, DbFileStatus.Conflict);
}

export async function testFileV2StatusTransition100() {
  const db = await createTestDb(SCHEMA);

  upsertMany<TestDbWritableRow>(db, "FileV2", "path", [
    { path: "added/withContent", localContent: "", localUpdatedAt: 1 },
    { path: "added/deleted", localContent: null, localUpdatedAt: 1 },
  ]);

  assertEqual(readV2(db, "added/withContent")?.status, DbFileStatus.Added);
  assertUndefined(readV2(db, "added/deleted"));
}

export function upsertMany<T extends {}>(db: Sqlite3.DB, table: string, key: string, rows: T[]) {
  if (!rows.length) return;

  const cols = Object.keys(rows[0]);
  const sql = `
INSERT INTO ${table} (${cols.join(",")}) VALUES
${rows.map((_, i) => `(${cols.map((col) => `:${col}${i}`).join(",")})`).join(",")}
ON CONFLICT(${key}) DO UPDATE SET ${cols.filter((col) => col !== key).map((col) => `${col} = excluded.${col}`)}
  `;
  const bind = paramsToBindings(sql, arrayToParams(rows));
  return db.exec(sql, { bind });
}

export function readV2(db: Sqlite3.DB, path: string): DbFileV2Internal | undefined {
  const sql = `SELECT * FROM FileV2 WHERE path = :path`;
  const bind = paramsToBindings(sql, { path });

  const file = db.selectObject<DbFileV2Internal>(sql, bind);
  return file;
}
