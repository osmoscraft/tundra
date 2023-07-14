import { selectMany, upsertMany } from "@tinykb/sqlite-utils";
import type { DbFileReadable, DbFileV2ParsedSource, DbWritableFileV2 } from "./schema";

export interface DbParsedWritableFile {
  path: string;
  local?: DbFileV2ParsedSource | null;
  remote?: DbFileV2ParsedSource | null;
  synced?: DbFileV2ParsedSource | null;
}

export function upsertParsedFiles(db: Sqlite3.DB, files: DbParsedWritableFile[]) {
  const rawFiles = files.map((file) => ({
    path: file.path,
    ...(file.local && { local: JSON.stringify(file.local) }),
    ...(file.remote && { remote: JSON.stringify(file.remote) }),
    ...(file.synced && { synced: JSON.stringify(file.synced) }),
  }));

  return upsertRawFiles(db, rawFiles);
}

export function upsertParsedFile(db: Sqlite3.DB, file: DbParsedWritableFile) {
  return upsertParsedFiles(db, [file]);
}

export function upsertRawFiles(db: Sqlite3.DB, files: DbWritableFileV2[]) {
  return upsertMany<DbWritableFileV2>(db, { table: "FileV2", key: "path", rows: files });
}

export function upsertRawFile(db: Sqlite3.DB, file: DbWritableFileV2) {
  return upsertRawFiles(db, [file]);
}

export function selectFiles(db: Sqlite3.DB, paths: string[]) {
  return selectMany<DbFileReadable>(db, { table: "FileV2", key: "path", value: paths });
}

export function selectFile(db: Sqlite3.DB, path: string) {
  return selectFiles(db, [path])[0];
}
