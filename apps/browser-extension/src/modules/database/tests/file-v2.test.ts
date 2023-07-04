import { arrayToParams, paramsToBindings } from "@tinykb/sqlite-utils";
import { assertDeepEqual, assertDefined, assertEqual, assertUndefined } from "../../live-test";
import { DbFileStatus, type DbFileV2Internal, type DbFileV2Snapshot } from "../schema";
import SCHEMA from "../schema.sql";
import { createTestDb } from "./fixture";

export async function testFileV2Db() {
  const db = await createTestDb(SCHEMA);
  assertDefined(db, "db is defined");
}

type TestDbWritable = Partial<DbFileV2Internal> & { path: string };

// test utils
function mockFile(time: number, content: string | null, meta: string | null = null) {
  const snapshot: DbFileV2Snapshot = { time, content, meta };
  return JSON.stringify(snapshot);
}

function upsertFiles(db: Sqlite3.DB, files: TestDbWritable[]) {
  return upsertMany<TestDbWritable>(db, { table: "FileV2", key: "path", rows: files });
}
function upsertFile(db: Sqlite3.DB, file: TestDbWritable) {
  return upsertFiles(db, [file]);
}

function selectFiles(db: Sqlite3.DB, paths: string[]) {
  return selectMany<TestDbWritable>(db, { table: "FileV2", key: "path", value: paths });
}

function selectFile(db: Sqlite3.DB, path: string) {
  return selectFiles(db, [path])[0];
}

export async function testFileV2StatusUntracked() {
  const db = await createTestDb(SCHEMA);

  console.log("[test] untracked > setS(content) > synced");
  upsertFile(db, { path: "file", synced: mockFile(1, "") });
  assertEqual(selectFile(db, "file")?.status, DbFileStatus.Synced);

  console.log("[test] untracked > setS(null) > untracked ");
  upsertFile(db, { path: "file2", synced: mockFile(1, null) });
  assertUndefined(selectFile(db, "file2"));

  console.log("[test] untracked > setL(content) > ahead");
  upsertFile(db, { path: "file3", local: mockFile(1, "") });
  assertEqual(selectFile(db, "file3")?.status, DbFileStatus.Ahead);

  console.log("[test] untracked > setL(null) > untracked");
  upsertFile(db, { path: "file4", local: mockFile(1, null) });
  assertUndefined(selectFile(db, "file4"));

  console.log("[test] untracked > setR(content) > behind");
  upsertFile(db, { path: "file5", remote: mockFile(1, "") });
  assertEqual(selectFile(db, "file5")?.status, DbFileStatus.Behind);

  console.log("[test] untracked > setR(null) > untracked");
  upsertFile(db, { path: "file6", remote: mockFile(1, null) });
  assertUndefined(selectFile(db, "file6"));
}

export async function testFileV2StatusSynced() {
  const db = await createTestDb(SCHEMA);

  console.log("[test] synced > setS(same content) > synced");
  upsertFile(db, { path: "file", synced: mockFile(1, "") });
  upsertFile(db, { path: "file", synced: mockFile(2, "") });
  assertEqual(selectFile(db, "file")?.status, DbFileStatus.Synced);
  assertDeepEqual(JSON.parse(selectFile(db, "file")!.source!), JSON.parse(mockFile(2, "")));

  console.log("[test] synced > setS(different content) > synced");
  upsertFile(db, { path: "file", synced: mockFile(1, "") });
  upsertFile(db, { path: "file", synced: mockFile(2, "new") });
  assertEqual(selectFile(db, "file")?.status, DbFileStatus.Synced);
  assertDeepEqual(JSON.parse(selectFile(db, "file")!.source!), JSON.parse(mockFile(2, "new")));

  console.log("[test] synced > setS(null) > untracked");
  upsertFile(db, { path: "file2", synced: mockFile(1, "") });
  upsertFile(db, { path: "file2", synced: mockFile(2, null) });
  assertUndefined(selectFile(db, "file2"));

  console.log("[test] synced > setL(same content) > synced");
  upsertFile(db, { path: "file3", synced: mockFile(1, "") });
  upsertFile(db, { path: "file3", local: mockFile(2, "") });
  assertEqual(selectFile(db, "file3")?.status, DbFileStatus.Synced);
  assertDeepEqual(JSON.parse(selectFile(db, "file3")!.source!), JSON.parse(mockFile(1, "")));

  console.log("[test] synced > setL(different content) > ahead");
  upsertFile(db, { path: "file4", synced: mockFile(1, "") });
  upsertFile(db, { path: "file4", local: mockFile(2, "new") });
  assertEqual(selectFile(db, "file4")?.status, DbFileStatus.Ahead);
  assertDeepEqual(JSON.parse(selectFile(db, "file4")!.source!), JSON.parse(mockFile(2, "new")));

  console.log("[test] synced > setL(null) > ahead");
  upsertFile(db, { path: "file4", synced: mockFile(1, "") });
  upsertFile(db, { path: "file4", local: mockFile(2, null) });
  assertEqual(selectFile(db, "file4")?.status, DbFileStatus.Ahead);
  assertDeepEqual(JSON.parse(selectFile(db, "file4")!.source!), JSON.parse(mockFile(2, null)));

  console.log("[test] synced > setR(same content) > synced");
  upsertFile(db, { path: "file5", synced: mockFile(1, "") });
  upsertFile(db, { path: "file5", remote: mockFile(2, "") });
  assertEqual(selectFile(db, "file5")?.status, DbFileStatus.Synced);
  assertDeepEqual(JSON.parse(selectFile(db, "file5")!.source!), JSON.parse(mockFile(1, "")));

  console.log("[test] synced > setR(different content) > behind");
  upsertFile(db, { path: "file6", synced: mockFile(1, "") });
  upsertFile(db, { path: "file6", remote: mockFile(2, "new") });
  assertEqual(selectFile(db, "file6")?.status, DbFileStatus.Behind);
  assertDeepEqual(JSON.parse(selectFile(db, "file6")!.source!), JSON.parse(mockFile(1, "")));

  console.log("[test] synced > setR(null) > behind");
  upsertFile(db, { path: "file7", synced: mockFile(1, "") });
  upsertFile(db, { path: "file7", remote: mockFile(2, null) });
  assertEqual(selectFile(db, "file7")?.status, DbFileStatus.Behind);
  assertDeepEqual(JSON.parse(selectFile(db, "file7")!.source!), JSON.parse(mockFile(1, "")));
}

export async function testFileV2StatusBehind() {
  const db = await createTestDb(SCHEMA);
}

export interface UpsertManyInput<T extends {}> {
  table: string;
  key: string & keyof T;
  rows: T[];
}

/**
 * Upsert multiple rows of different kind
 */
export function upsertMany<T extends {}>(db: Sqlite3.DB, input: UpsertManyInput<T>) {
  return input.rows.map((row) => {
    return upsertOne(db, { table: input.table, key: input.key, row });
  });
}

/**
 * Upsert multiple rows of the same kind
 */
export function usertBulk<T extends {}>(db: Sqlite3.DB, input: UpsertManyInput<T>) {
  return upsertInternal(db, input);
}

export interface UpsertOneInput<T extends {}> {
  table: string;
  key: string & keyof T;
  row: T;
}

export function upsertOne<T extends {}>(db: Sqlite3.DB, input: UpsertOneInput<T>) {
  return upsertInternal(db, { table: input.table, key: input.key, rows: [input.row] });
}

function upsertInternal<T extends {}>(db: Sqlite3.DB, input: UpsertManyInput<T>) {
  if (!input.rows.length) return;

  const refRow = input.rows[0];
  const cols = Object.keys(refRow);
  const nonKeyCols = cols.filter((col) => col !== input.key);

  const sql = [
    `INSERT INTO ${input.table} (${cols.join(",")}) VALUES`,
    input.rows.map((_, i) => `(${cols.map((col) => `:${col}${i}`).join(",")})`).join(","),
    nonKeyCols.length
      ? `ON CONFLICT(${input.key}) DO UPDATE SET ${cols
          .filter((col) => col !== input.key)
          .map((col) => `${col} = excluded.${col}`)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  // TODO minimize col names to index
  const bind = paramsToBindings(sql, arrayToParams(input.rows));
  return db.exec(sql, { bind });
}

export interface SelectManyInput<T extends {}> {
  table: string;
  key: string & keyof T;
  value: any[];
}
export function selectMany<T extends {}>(db: Sqlite3.DB, input: SelectManyInput<T>): (T | undefined)[] {
  return input.value.map((value) => {
    return selectOne(db, { table: input.table, key: input.key, value });
  });
}

export interface SelectOneInput<T extends {}> {
  table: string;
  key: string & keyof T;
  value: any;
}

export function selectOne<T extends {}>(db: Sqlite3.DB, input: SelectOneInput<T>): T | undefined {
  const sql = `SELECT * FROM ${input.table} WHERE ${input.key} = :${input.key}`;
  const bind = paramsToBindings(sql, { [input.key]: input.value });
  const file = db.selectObject<T>(sql, bind);
  return file;
}
