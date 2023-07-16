import { array } from "@tinykb/fp-utils";
import * as fileApi from "./file";
import { decodeMeta, encodeMeta } from "./meta";
import { DbFileV2Status, type DbReadableFileV2, type DbWritableFileV2 } from "./schema";

export interface GraphWritableSource {
  path: string;
  content: string | null;
  updatedAt?: number | null;
}

export interface GraphReadableSource {
  path: string;
  content: string | null;
  updatedAt: number | null;
}

export function commit(db: Sqlite3.DB, files: GraphWritableSource | GraphWritableSource[]) {
  const now = Date.now();
  fileApi.upsertFiles(
    db,
    array(files).map((file) => serializeGraphSourceToDbFile(file, now, "local"))
  );
}

export function fetch(db: Sqlite3.DB, files: GraphWritableSource | GraphWritableSource[]) {
  const now = Date.now();
  fileApi.upsertFiles(
    db,
    array(files).map((file) => serializeGraphSourceToDbFile(file, now, "remote"))
  );
}

export function clone(db: Sqlite3.DB, files: GraphWritableSource | GraphWritableSource[]) {
  const now = Date.now();
  fileApi.upsertFiles(
    db,
    array(files).map((file) => serializeGraphSourceToDbFile(file, now, "synced"))
  );
}

export function merge(db: Sqlite3.DB, input: GraphWritableSource | GraphWritableSource[]) {
  const changes = array(input).filter((file) => fileApi.selectFile(db, file.path)?.status === DbFileV2Status.Behind);
  clone(db, changes);
}

export function push(db: Sqlite3.DB, input: GraphWritableSource | GraphWritableSource[]) {
  const changes = array(input).filter((file) => fileApi.selectFile(db, file.path)?.status === DbFileV2Status.Ahead);
  clone(db, changes);
}

export function remove(db: Sqlite3.DB, patterns: string[]) {
  fileApi.deleteFiles(db, patterns);
}

export function getFile(db: Sqlite3.DB, path: string) {
  const file = fileApi.selectFile(db, path);
  if (!file) return undefined;

  return decodeMeta(file);
}

export interface RecentFilesInput {
  limit: number;
  paths?: string[];
  ignore?: string[];
}
export function getRecentFiles(db: Sqlite3.DB, input: RecentFilesInput) {
  const files = fileApi.listFiles(db, {
    paths: input.paths,
    ignore: input.ignore,
    orderBy: [["updatedAt", "DESC"]],
    limit: input.limit,
  });
  return files.map(decodeMeta);
}

export function getRawAheadFiles(db: Sqlite3.DB, ignore: string[] = []) {
  return fileApi.listFiles(db, {
    ignore,
    filters: [["status", "=", DbFileV2Status.Ahead]],
  });
}

export function getRawBehindFiles(db: Sqlite3.DB, ignore: string[] = []) {
  return fileApi.listFiles(db, {
    ignore,
    filters: [["status", "=", DbFileV2Status.Behind]],
  });
}

export interface SearchFilesInput {
  query: string;
  limit: number;
  paths?: string[];
  ignore?: string[];
}
export function searchFiles(db: Sqlite3.DB, input: SearchFilesInput) {
  const files = fileApi.searchFiles(db, {
    query: input.query,
    limit: input.limit,
    paths: input.paths,
    ignore: input.ignore,
  });
  return files.map(decodeMeta);
}

// conversions

export function serializeGraphSourceToDbFile(
  graphSource: GraphWritableSource,
  now: number,
  dbSourceType: "local" | "remote" | "synced"
): DbWritableFileV2 {
  return {
    path: graphSource.path,
    [dbSourceType]: JSON.stringify({
      content: graphSource.content,
      meta: encodeMeta(graphSource),
      updatedAt: graphSource.updatedAt === undefined ? now : graphSource.updatedAt,
    }),
  };
}

export function parseDbFileToGraphSource(file: DbReadableFileV2): GraphReadableSource {
  return {
    path: file.path,
    content: file.content,
    updatedAt: file.updatedAt,
  };
}
