import { array } from "@tinykb/fp-utils";
import * as fileApi from "./file";
import { decodeMeta, encodeMeta } from "./meta";

/**
 * TODO graph v2
 * 
export interface GraphNodeInput {
  path: string;
  content: string;
  updatedAt?: number;
}
export interface GraphNodeOutput<T = any> extends GraphNodeInput {
  meta: T;
}

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

export interface CommitInput {
  path: string;
  content: string | null;
  updatedAt?: number;
}
export function updateLocal(db: Sqlite3.DB, input: CommitInput | CommitInput[]) {
  const now = Date.now();
  fileApi.writeMany(
    db,
    array(input).map((file) => ({
      path: file.path,
      localContent: file.content,
      meta: encodeMeta(file),
      localUpdatedAt: file.updatedAt ?? now,
    }))
  );
}

export function updateRemote(db: Sqlite3.DB, files: CommitInput | CommitInput[]) {
  const now = Date.now();
  fileApi.writeMany(
    db,
    array(files).map((file) => ({
      path: file.path,
      remoteContent: file.content,
      remoteUpdatedAt: file.updatedAt ?? now,
      meta: encodeMeta(file),
    }))
  );
}

export function mergeRemote(db: Sqlite3.DB, input: CommitInput | CommitInput[]) {
  // update remote version
  // if local version is older, clean up local version
  // if local version is newer,
}

export interface FileChange {
  path: string;
  content: string | null;
  meta?: any;
  updatedAt?: number;
}

export function setLocalFile(db: Sqlite3.DB, file: CommitInput) {
  setLocalFiles(db, [file]);
}

export function setRemoteFile(db: Sqlite3.DB, file: FileChange) {
  updateRemote(db, [file]);
}

export function setLocalFiles(db: Sqlite3.DB, files: CommitInput[]) {
  updateLocal(db, files);
}

export function deleteFiles(db: Sqlite3.DB, patterns: string[]) {
  fileApi.removeMany(db, patterns);
}

export function getFile(db: Sqlite3.DB, path: string) {
  const file = fileApi.read(db, path);
  if (!file) return undefined;

  return decodeMeta(file);
}

export interface RecentFilesInput {
  limit: number;
  paths?: string[];
  ignore?: string[];
}
export function getRecentFiles(db: Sqlite3.DB, input: RecentFilesInput) {
  const files = fileApi.list(db, {
    paths: input.paths,
    ignore: input.ignore,
    orderBy: [["updatedAt", "DESC"]],
    limit: input.limit,
  });
  return files.map(decodeMeta);
}

export function getDirtyFiles(db: Sqlite3.DB, ignore: string[] = []) {
  const files = fileApi.list(db, {
    ignore,
    filters: [["isDirty", "=", 1]],
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
  const files = fileApi.search(db, {
    query: input.query,
    limit: input.limit,
    paths: input.paths,
    ignore: input.ignore,
  });
  return files.map(decodeMeta);
}
