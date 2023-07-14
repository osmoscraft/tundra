import { array } from "@tinykb/fp-utils";
import * as fileApi from "./file";
import { decodeMeta, encodeMeta } from "./meta";
import { DbFileV2Status } from "./schema";

/**
 * TODO graph v2
 * 
export function commit(nodes: GraphNodeInput[]) {}
export function clone(nodes: GraphNodeInput[]) {}
export function pull(nodes: GraphNodeInput[]) {}
export function push(nodes: GraphNodeInput[]) {}
export function get<T = any>(paths: string[]): GraphNodeOutput<T>[] {
  return [];
}
export function search<T = any>(query: string): GraphNodeOutput<T>[] {
  return [];
}
*/

export interface TextFile {
  path: string;
  content: string | null;
  updatedAt?: number;
}
export function updateLocal(db: Sqlite3.DB, input: TextFile | TextFile[]) {
  const now = Date.now();
  fileApi.upsertFiles(
    db,
    array(input).map((file) => ({
      path: file.path,
      local: JSON.stringify({
        content: file.content,
        meta: encodeMeta(file),
        updatedAt: file.updatedAt ?? now,
      }),
    }))
  );
}

export function updateRemote(db: Sqlite3.DB, files: TextFile | TextFile[]) {
  const now = Date.now();
  fileApi.upsertFiles(
    db,
    array(files).map((file) => ({
      path: file.path,
      remote: JSON.stringify({
        content: file.content,
        updatedAt: file.updatedAt ?? now,
        meta: encodeMeta(file),
      }),
    }))
  );
}

export function updateSynced(db: Sqlite3.DB, files: TextFile | TextFile[]) {
  const now = Date.now();
  fileApi.upsertFiles(
    db,
    array(files).map((file) => ({
      path: file.path,
      synced: JSON.stringify({
        content: file.content,
        updatedAt: file.updatedAt ?? now,
        meta: encodeMeta(file),
      }),
    }))
  );
}

export function mergeRemote(db: Sqlite3.DB, input: TextFile | TextFile[]) {
  // set synced col to the same as remote col
}

export function deleteFiles(db: Sqlite3.DB, patterns: string[]) {
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

export function getDirtyFiles(db: Sqlite3.DB, ignore: string[] = []) {
  const files = fileApi.listFiles(db, {
    ignore,
    filters: [["status", "=", DbFileV2Status.Ahead]],
  });
  return files.map(decodeMeta);
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
