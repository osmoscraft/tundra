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

export interface GraphFile {
  path: string;
  content: string | null;
  updatedAt?: number;
}

export function commit(db: Sqlite3.DB, input: GraphFile | GraphFile[]) {
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

export function fetch(db: Sqlite3.DB, files: GraphFile | GraphFile[]) {
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

export function clone(db: Sqlite3.DB, files: GraphFile | GraphFile[]) {
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

export function merge(db: Sqlite3.DB, input: GraphFile | GraphFile[]) {
  const changes = array(input).filter((file) => fileApi.selectFile(db, file.path)?.status === DbFileV2Status.Behind);
  clone(db, changes);
}

export function push(db: Sqlite3.DB, input: GraphFile | GraphFile[]) {
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

export function getAheadFiles(db: Sqlite3.DB, ignore: string[] = []) {
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
