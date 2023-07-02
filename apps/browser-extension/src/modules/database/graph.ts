import { paramsToBindings } from "@tinykb/sqlite-utils";
import { list, read, removeMany, writeMany } from "./file";
import type { DbFile, DbFileInternal, DbFileReadable } from "./schema";

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

export function getFile(db: Sqlite3.DB, path: string): DbFile | undefined {
  const file = read(db, path);
  if (!file) return undefined;

  return {
    ...file,
    meta: file.meta !== null ? JSON.parse(file.meta) : {},
  };
}

export function getRecentFiles(db: Sqlite3.DB, limit: number, ignore: string[] = []): DbFileReadable[] {
  const files = list(db, {
    ignore,
    orderBy: [["updatedAt", "DESC"]],
    limit,
  });
  return files.map(parseMeta);
}

export function getDirtyFiles(db: Sqlite3.DB, ignore: string[] = []): DbFileReadable[] {
  const files = list(db, {
    ignore,
    filters: [["isDirty", "=", 1]],
  });
  return files.map(parseMeta);
}

export interface SearchFilesInput {
  query: string;
  limit: number;
}
export function searchFiles(db: Sqlite3.DB, input: SearchFilesInput): DbFile[] {
  // weights map to fts columns: path, content, meta,
  const sql = `
SELECT * FROM File JOIN FileFts ON File.path = FileFts.path WHERE FileFts MATCH :query ORDER BY bm25(FileFts, 0.1, 1, 100) LIMIT :limit
`;

  const bind = paramsToBindings(sql, {
    query: input.query,
    limit: input.limit,
  });

  return db.selectObjects<DbFileInternal>(sql, bind).map(parseMeta);
}

export interface WithMeta {
  meta: string | null;
}
function parseMeta<T extends WithMeta>(withMeta: T): T {
  return {
    ...withMeta,
    meta: withMeta.meta !== null ? JSON.parse(withMeta.meta) : {},
  };
}
