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
    { path: "local/withContent", localContent: "", localUpdatedAt: 1 },
    { path: "local/deleted", localContent: null, localUpdatedAt: 1 },
  ]);

  assertEqual(readV2(db, "local/withContent")?.status, DbFileStatus.Added);
  assertUndefined(readV2(db, "local/deleted"));
}

export async function testFileV2StatusTransition010() {
  const db = await createTestDb(SCHEMA);

  upsertMany<TestDbWritableRow>(db, "FileV2", "path", [
    { path: "remote/withContent", remoteContent: "", remoteUpdatedAt: 1 },
    { path: "remote/deleted", remoteContent: null, remoteUpdatedAt: 1 },
  ]);

  assertEqual(readV2(db, "remote/withContent")?.status, DbFileStatus.Unchanged);
  assertUndefined(readV2(db, "remote/deleted"));
}

export async function testFileV2StatusTransition001() {
  const db = await createTestDb(SCHEMA);

  upsertMany<TestDbWritableRow>(db, "FileV2", "path", [
    { path: "base/withContent", baseContent: "", baseUpdatedAt: 1 },
    { path: "base/deleted", baseContent: null, baseUpdatedAt: 1 },
  ]);

  assertEqual(readV2(db, "base/withContent")?.status, DbFileStatus.Unchanged);
  assertUndefined(readV2(db, "base/deleted"));
}

export async function testFileV2StatusTransition101() {
  const db = await createTestDb(SCHEMA);

  console.log(`[test] transition101/outdated/edited`);
  upsertMany<TestDbWritableRow>(db, "FileV2", "path", [
    {
      path: "outdated/edited",
      localContent: "local",
      localUpdatedAt: 1,
      baseContent: "base",
      baseUpdatedAt: 2,
    },
  ]);
  assertEqual(readV2(db, "outdated/edited")?.status, DbFileStatus.Unchanged);

  console.log(`[test] transition101/outdated/deleted`);
  upsertMany<TestDbWritableRow>(db, "FileV2", "path", [
    {
      path: "outdated/deleted",
      localContent: "local",
      localUpdatedAt: 1,
      baseContent: null,
      baseUpdatedAt: 2,
    },
  ]);
  assertUndefined(readV2(db, "outdated/deleted"));

  console.log(`[test] transition101/both deleted`);
  upsertMany<TestDbWritableRow>(db, "FileV2", "path", [
    {
      path: "modified/bothNull",
      localContent: null,
      localUpdatedAt: 2,
      baseContent: null,
      baseUpdatedAt: 1,
    },
  ]);
  assertUndefined(readV2(db, "modified/bothNull"));

  console.log(`[test] transition10l/both edited`);
  upsertMany<TestDbWritableRow>(db, "FileV2", "path", [
    {
      path: "modified/bothSame",
      localContent: "same",
      localUpdatedAt: 2,
      baseContent: "same",
      baseUpdatedAt: 1,
    },
  ]);
  assertEqual(readV2(db, "modified/bothSame")?.status, DbFileStatus.Unchanged);

  console.log(`[test] transition101/local created`);
  upsertMany<TestDbWritableRow>(db, "FileV2", "path", [
    {
      path: "modified/localCreated",
      localContent: "local",
      localUpdatedAt: 2,
      baseContent: null,
      baseUpdatedAt: 1,
    },
  ]);
  assertEqual(readV2(db, "modified/localCreated")?.status, DbFileStatus.Added);

  console.log(`[test] transition101/local deteted`);
  upsertMany<TestDbWritableRow>(db, "FileV2", "path", [
    {
      path: "modified/localDeleted",
      localContent: null,
      localUpdatedAt: 2,
      baseContent: "base",
      baseUpdatedAt: 1,
    },
  ]);
  assertEqual(readV2(db, "modified/localDeleted")?.status, DbFileStatus.Modified);

  console.log(`[test] transition101/local edited`);
  upsertMany<TestDbWritableRow>(db, "FileV2", "path", [
    {
      path: "modified/localEdited",
      localContent: "local",
      localUpdatedAt: 2,
      baseContent: "base",
      baseUpdatedAt: 1,
    },
  ]);
  assertEqual(readV2(db, "modified/localEdited")?.status, DbFileStatus.Modified);
}

export async function testFileV2StatusTransition110() {}
export async function testFileV2StatusTransition011() {}

export async function testFileV2StatusTransition111() {}
export async function testFileV2StatusTransition000() {}

/**
 * Rows must be of the type type
 */
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
