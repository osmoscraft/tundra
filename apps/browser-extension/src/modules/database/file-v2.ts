import { deleteMany, selectMany, upsertMany } from "@tinykb/sqlite-utils";
import type { DbReadableFileV2, DbWritableFileV2 } from "./schema";

export function upsertRawFiles(db: Sqlite3.DB, files: DbWritableFileV2[]) {
  return upsertMany<DbWritableFileV2>(db, { table: "FileV2", key: "path", rows: files });
}

export function upsertRawFile(db: Sqlite3.DB, file: DbWritableFileV2) {
  return upsertRawFiles(db, [file]);
}

export function selectFiles(db: Sqlite3.DB, paths: string[]) {
  return selectMany<DbReadableFileV2>(db, { table: "FileV2", key: "path", value: paths });
}

export function selectFile(db: Sqlite3.DB, path: string) {
  return selectFiles(db, [path])[0];
}

export function deleteFiles(db: Sqlite3.DB, paths: string[]) {
  return deleteMany(db, { table: "FileV2", key: "path", value: paths, comparator: "GLOB" });
}

export function deleteFile(db: Sqlite3.DB, path: string) {
  return deleteFiles(db, [path]);
}
