import { list, read, removeMany, search, writeMany } from "./file";
import { decodeMeta } from "./meta";
import type { DbFileWithMeta } from "./schema";

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

export interface FileChange {
  path: string;
  content: string | null;
  meta?: any;
  updatedAt?: number;
}

export function setLocalFile(db: Sqlite3.DB, file: FileChange) {
  setLocalFiles(db, [file]);
}

export function setRemoteFile(db: Sqlite3.DB, file: FileChange) {
  setRemoteFiles(db, [file]);
}

export function setLocalFiles(db: Sqlite3.DB, files: FileChange[]) {
  writeMany(
    db,
    files.map((file) => ({
      path: file.path,
      localContent: file.content,
      localUpdatedAt: file.updatedAt ?? Date.now(),
      meta: JSON.stringify(file.meta),
    }))
  );
}

export function setRemoteFiles(db: Sqlite3.DB, files: FileChange[]) {
  writeMany(
    db,
    files.map((file) => ({
      path: file.path,
      remoteContent: file.content,
      remoteUpdatedAt: file.updatedAt ?? Date.now(),
      meta: JSON.stringify(file.meta),
    }))
  );
}

export function deleteFiles(db: Sqlite3.DB, patterns: string[]) {
  removeMany(db, patterns);
}

export function getFile(db: Sqlite3.DB, path: string): DbFileWithMeta | undefined {
  const file = read(db, path);
  if (!file) return undefined;

  return decodeMeta(file);
}

export function getRecentFiles(db: Sqlite3.DB, limit: number, ignore: string[] = []): DbFileWithMeta[] {
  const files = list(db, {
    ignore,
    orderBy: [["updatedAt", "DESC"]],
    limit,
  });
  return files.map(decodeMeta);
}

export function getDirtyFiles(db: Sqlite3.DB, ignore: string[] = []): DbFileWithMeta[] {
  const files = list(db, {
    ignore,
    filters: [["isDirty", "=", 1]],
  });
  return files.map(decodeMeta);
}

export interface SearchFilesInput {
  query: string;
  limit: number;
  ignore?: string[];
}
export function searchFiles(db: Sqlite3.DB, input: SearchFilesInput): DbFileWithMeta[] {
  const files = search(db, {
    query: input.query,
    limit: input.limit,
    ignore: input.ignore,
  });
  return files.map(decodeMeta);
}
